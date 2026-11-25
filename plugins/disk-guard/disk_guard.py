#!/usr/bin/env python3
"""Local disk monitor. No network, root actions or automatic deletion."""
from __future__ import annotations

import argparse
import contextlib
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import sys
import time
import uuid
from urllib.parse import quote

from catalog import ARTIFACTS, CACHES, PROJECTS, SKIP

VERSION = 1
DAY = 86400
DEFAULTS = {
    'project_roots': ['~/github', '~/github-private', '~/Projects', '~'],
    'max_depth': 6, 'scan_seconds': 240, 'entry_seconds': 35,
    'minimum_bytes': 16 * 1024**2, 'large_file_bytes': 1024**3,
    'stale_days': 7, 'large_file_depth': 3, 'temp_roots': ['/tmp', '/var/tmp'],
    'protected': ['~/github/models/Huihui-Qwen3.8-Flash-Next-abliterated-GGUF',
                  '~/github/models/Qwen3.8-27B-Turbo-Fable-GGUF'],
    'excluded': ['~/.ssh', '~/.aws', '~/.gnupg', '~/.local/share/Trash'],
}

class Refused(Exception):
    pass


def absolute(path):
    return Path(os.path.abspath(os.path.expanduser(str(path))))


def xdg(name, fallback):
    raw = os.environ.get(name, '')
    return Path(raw) if raw.startswith('/') else Path.home() / fallback


def within(path, parent):
    return path == parent or parent in path.parents


def secure_dir(path):
    # Refuse symlink ancestors, even when only an ancestor exists yet.
    for p in [*reversed(path.parents), path]:
        if p.is_symlink():
            raise Refused(f'Symlink storage directory: {p}')
    path.mkdir(parents=True, exist_ok=True, mode=0o700)
    s = path.stat()
    if s.st_uid != os.getuid():
        raise Refused(f'Storage directory is not owned by you: {path}')
    if stat.S_IMODE(s.st_mode) & 0o022:
        raise Refused(f'Storage directory is writable by other users: {path}')


def load_json(path, fallback=None):
    try:
        return json.loads(path.read_text())
    except FileNotFoundError:
        return fallback


def save_json(path, value):
    secure_dir(path.parent)
    temp = path.with_name(path.name + '.' + uuid.uuid4().hex + '.tmp')
    fd = os.open(temp, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        with os.fdopen(fd, 'w') as f:
            json.dump(value, f, ensure_ascii=True)
            f.flush()
            os.fsync(f.fileno())
        os.replace(temp, path)
    finally:
        if temp.exists():
            temp.unlink()


def run(command, timeout=15):
    result = subprocess.run(command, capture_output=True, text=True, timeout=timeout,
                            env={**os.environ, 'GIT_OPTIONAL_LOCKS': '0', 'LC_ALL': 'C'})
    if result.returncode:
        raise Refused(result.stderr.strip()[:400] or 'Command failed')
    return result.stdout.strip()


def no_symlink_ancestors(path):
    for parent in [path, *path.parents]:
        if parent.is_symlink():
            raise Refused(f'Symlink path: {parent}')


def measure(path, timeout=35, seen=None):
    """Allocated blocks and a content-metadata fingerprint; never follow symlinks."""
    begin = time.monotonic()
    root = path.lstat()
    digest = hashlib.sha256()
    used = logical = count = 0
    latest = root.st_mtime
    nested_git = mount = foreign = False
    complete = True
    errors = []
    seen = set() if seen is None else seen
    stack = [path]
    while stack:
        if time.monotonic() - begin > timeout:
            complete = False
            errors.append('Measurement time limit reached')
            break
        node = stack.pop()
        try:
            s = node.lstat()
            rel = str(node.relative_to(path))
            digest.update(os.fsencode(rel))
            digest.update(str((s.st_dev, s.st_ino, s.st_mode, s.st_size,
                               s.st_mtime_ns, s.st_ctime_ns)).encode())
            latest = max(latest, s.st_mtime)
            foreign |= s.st_uid != os.getuid()
            count += 1
            if node != path and (s.st_dev != root.st_dev or os.path.ismount(node)):
                mount = True
                continue
            key = s.st_dev, s.st_ino
            if key not in seen:
                used += s.st_blocks * 512
                if stat.S_ISREG(s.st_mode):
                    logical += s.st_size
                seen.add(key)
            if node.name in {'.git', '.hg', '.svn'}:
                nested_git = True
            if stat.S_ISDIR(s.st_mode):
                with os.scandir(node) as entries:
                    children = sorted((Path(e.path) for e in entries), key=os.fsencode, reverse=True)
                stack.extend(children)
            elif not (stat.S_ISREG(s.st_mode) or stat.S_ISLNK(s.st_mode)):
                complete = False
                errors.append('Contains a socket, device or other special file')
        except (OSError, ValueError) as e:
            complete = False
            errors.append(str(e)[:180])
    return {'bytes': used, 'logical_bytes': logical, 'files': count,
            'latest_mtime': latest, 'fingerprint': digest.hexdigest(),
            'complete': complete, 'nested_git': nested_git, 'mount': mount,
            'foreign_owner': foreign, 'errors': errors[:3],
            'identity': [root.st_dev, root.st_ino]}


def project_families(path, names):
    families = {family for marker, family in PROJECTS.items() if marker in names}
    if any(n.endswith('.csproj') or n.endswith('.sln') for n in names):
        families.add('.NET')
    if any(n.endswith('.tf') for n in names):
        families.add('Terraform')
    if any(n.endswith('.xcodeproj') for n in names):
        families.add('Xcode')
    if any(n.endswith('.uproject') for n in names):
        families.add('Unreal')
    if {'Assets', 'ProjectSettings'} <= names:
        families.add('Unity')
    return families


def git_safety(path):
    """Use the nearest repository. Preserve tracked artifacts and ignored-source overrides."""
    if not shutil.which('git'):
        raise Refused('Git is unavailable; cannot validate project artifacts')
    try:
        top = absolute(run(['git', '-C', str(path.parent), 'rev-parse', '--show-toplevel']))
    except Refused as e:
        if 'not a git repository' in str(e):
            return 'Project is outside Git; review locally created data.'
        raise
    rel = str(path.relative_to(top))
    tracked = run(['git', '-C', str(top), 'ls-files', '--', rel])
    if tracked:
        raise Refused('Contains tracked source or a Git submodule')
    r = subprocess.run(['git', '-C', str(top), 'check-ignore', '-q', '--', rel],
                       capture_output=True, timeout=10)
    if r.returncode not in (0, 1):
        raise Refused('Could not validate Git ignore rules')
    return '' if r.returncode == 0 else 'Untracked artifact is not Git-ignored; review local data.'


def process_users(paths, proc=Path('/proc')):
    """Check cwd/exe/open descriptors/maps for all observable processes owned by user."""
    hits = {str(p): [] for p in paths}
    unknown = []
    for entry in proc.iterdir():
        if not entry.name.isdigit() or int(entry.name) == os.getpid():
            continue
        try:
            if entry.stat().st_uid != os.getuid():
                continue
            refs = []
            try:
                refs.extend(os.fsdecode(x) for x in (entry/'cmdline').read_bytes().split(b'\0') if x.startswith(b'/'))
            except FileNotFoundError:
                continue
            except PermissionError:
                unknown.append(entry.name)
            for name in ('cwd', 'exe'):
                try:
                    refs.append(os.readlink(entry / name).removesuffix(' (deleted)'))
                except FileNotFoundError:
                    pass
                except PermissionError:
                    unknown.append(entry.name)
            try:
                for fd in (entry / 'fd').iterdir():
                    with contextlib.suppress(FileNotFoundError):
                        refs.append(os.readlink(fd).removesuffix(' (deleted)'))
                for line in (entry / 'maps').read_text().splitlines():
                    parts = line.split(None, 5)
                    if len(parts) == 6 and parts[5].startswith('/'):
                        refs.append(parts[5].removesuffix(' (deleted)'))
            except FileNotFoundError:
                continue
            except PermissionError:
                unknown.append(entry.name)
            for p in paths:
                if any(r.startswith('/') and within(Path(r), p) for r in refs):
                    hits[str(p)].append(entry.name)
        except FileNotFoundError:
            continue
        except PermissionError:
            unknown.append(entry.name)
    return hits, sorted(set(unknown))


class Guard:
    def __init__(self, state=None, config=None):
        self.state = absolute(state or xdg('XDG_STATE_HOME', '.local/state') / 'disk-guard')
        self.config_path = absolute(config or xdg('XDG_CONFIG_HOME', '.config') / 'disk-guard/config.json')
        self.config = {**DEFAULTS, **(load_json(self.config_path, {}) or {})}
        limits = {'max_depth': (0, 12), 'scan_seconds': (1, 3600), 'entry_seconds': (.01, 600),
                  'minimum_bytes': (0, 1024**5), 'large_file_bytes': (1, 1024**5),
                  'stale_days': (0, 3650), 'large_file_depth': (0, 8)}
        for key, (low, high) in limits.items():
            value = self.config[key]
            if not isinstance(value, (int,float)) or isinstance(value,bool) or not low <= value <= high:
                raise Refused(f'Invalid setting {key}: expected a number between {low} and {high}')
        for key in ['project_roots','protected','excluded','temp_roots']:
            if not isinstance(self.config[key],list) or not all(isinstance(p,str) for p in self.config[key]):
                raise Refused('Invalid path list: '+key)
        self.home = absolute(Path.home())
        self.cache = xdg('XDG_CACHE_HOME', '.cache')
        self.trash = xdg('XDG_DATA_HOME', '.local/share') / 'Trash'
        self.protected = [absolute(x) for x in self.config['protected'] + self.config['excluded']]
        self.protected += [self.state, self.trash, self.config_path]
        self.roots = [absolute(x) for x in self.config['project_roots']]
        for root in self.roots:
            if not within(root, self.home):
                raise Refused('Project roots must be inside your home directory')
        self.errors = []

    @contextlib.contextmanager
    def lock(self, name="operation.lock"):
        secure_dir(self.state)
        fd = os.open(self.state / name, os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW, 0o600)
        try:
            try:
                fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                raise Refused('Another scan or cleanup is running')
            yield
        finally:
            os.close(fd)

    def excluded(self, path):
        return any(within(path, p) or within(p, path) for p in self.protected)

    def check_path(self, path, writable=False):
        no_symlink_ancestors(path)
        if path in {self.home, self.cache, Path('/tmp'), Path('/var/tmp')} or self.excluded(path):
            raise Refused('Protected path')
        if not any(within(path, p) for p in [self.home, Path('/tmp'), Path('/var/tmp')]):
            raise Refused('Outside approved scan locations')
        if os.path.ismount(path):
            raise Refused('Mounted volumes and Btrfs subvolumes are protected')
        s = path.lstat()
        if s.st_uid != os.getuid():
            raise Refused('Not owned by you')
        if writable and not os.access(path.parent, os.W_OK):
            raise Refused('Parent directory is read-only; nothing removed')

    def candidates(self, deadline):
        # Specific caches only; broad app profiles and ~/.cache never count as disposable.
        emitted = set()
        for relative, name, risk, group, description in CACHES:
            p = self.cache / relative[7:] if relative.startswith('@cache/') else self.home / relative
            if p.exists() and p not in emitted:
                emitted.add(p)
                yield p, name, risk, group, description, 'cache', None
        for location, name in [('/var/cache/pacman/pkg', 'Pacman package cache'),
                               ('/var/log/journal', 'System journal'),
                               ('/var/lib/docker', 'Docker images and volumes'),
                               ('/var/lib/containers', 'System container storage')]:
            p = Path(location)
            if p.exists():
                yield p, name, 'risky', 'Arch Linux', 'System-managed files. Inspect with the owning tool; this plugin never runs privileged cleanup.', 'system-inspect', None
        worktrees = self.cache / 'voicestudio-prs'
        if worktrees.exists():
            yield worktrees, 'Cached VoiceStudio worktrees', 'risky', 'Projects', \
                'Git checkouts may contain uncommitted work. Inspect and remove through Git after review.', 'inspect', None
        for relative, name in [
            ('Android/Sdk/system-images', 'Android system images'),
            ('Android/Sdk/ndk', 'Android NDKs'),
            ('Android/sdk/system-images', 'Android system images'),
            ('Android/sdk/ndk', 'Android NDKs'),
            ('.android/avd', 'Android emulators'),
            ('.local/share/mise/installs', 'Mise installed runtimes'),
            ('.rustup/toolchains', 'Rust installed toolchains'),
            ('.local/share/containers/storage', 'Podman container storage'),
            ('.local/share/docker', 'Docker storage'),
        ]:
            p = self.home / relative
            if p.exists():
                yield p, name, 'risky', 'Installed tools', 'Installed tools or runtime data. Inspect using the owning tool; automatic deletion is disabled.', 'inspect', None
        visited = set()
        for root in self.roots:
            if not root.is_dir() or root.is_symlink():
                continue
            stack = [(root, 0)]
            while stack and time.monotonic() < deadline:
                p, depth = stack.pop()
                if p in visited or any(within(p, protected) for protected in self.protected):
                    continue
                visited.add(p)
                try:
                    names = {e.name for e in p.iterdir()}
                    families = project_families(p, names)
                    for family in sorted(families):
                        artifacts = list(ARTIFACTS[family])
                        if family == 'Python':
                            artifacts += [n for n in names if n.endswith('.egg-info')]
                        for name in artifacts:
                            artifact = p / name
                            if artifact.exists() and artifact not in emitted:
                                emitted.add(artifact)
                                risk = 'caution' if name in {'node_modules', '.venv', 'venv', 'vendor', 'lib', 'Pods', 'deps', 'vendor/bundle', '.terraform'} else 'safe'
                                description = f'{family} generated artifact. Rebuild or reinstall dependencies after cleanup.'
                                if name in {'.venv', 'venv'}:
                                    description = 'Python environment; recreate and reinstall dependencies. Locally edited packages may be lost.'
                                if name == '.terraform':
                                    description = 'Downloaded providers and modules; terraform init is needed. State files are preserved.'
                                yield artifact, f'{p.name} / {name}', risk, 'Projects', description, 'project', str(p)
                    for name in sorted(names):
                        large = p / name
                        if large in emitted or large.is_symlink() or not large.is_file() or name.startswith('.'):
                            continue
                        if large.stat().st_size >= int(self.config['large_file_bytes']):
                            emitted.add(large)
                            yield large, name, 'risky', 'Large files', 'Large project file; may be source, data or a generated binary. Review its purpose.', 'file', str(p)
                    # Preserve hidden config, worktrees, artifact directories and mounted volumes.
                    if depth < int(self.config['max_depth']):
                        for n in sorted(names, reverse=True):
                            child = p / n
                            if n in SKIP or n.startswith('.') or not child.is_dir() or child.is_symlink():
                                continue
                            if os.path.ismount(child):
                                continue
                            if p == self.home and child not in self.roots and n in {'Pictures', 'Videos', 'Music'}:
                                continue
                            stack.append((child, depth + 1))
                except OSError as e:
                    self.errors.append(f'{p}: {e}')
        # Large files: arbitrary files are risky; models and Git objects are inspect-only.
        temp_roots = [absolute(p) for p in self.config['temp_roots']]
        if any(p not in {Path('/tmp'), Path('/var/tmp')} for p in temp_roots):
            raise Refused('Temporary scan roots must be /tmp or /var/tmp')
        for root, category in [(self.home / 'Downloads', 'Downloads'), (self.home / 'github/models', 'AI / models')] + [(p, 'Temporary') for p in temp_roots]:
            if not root.is_dir() or root.is_symlink():
                continue
            stack = [(root, 0)]
            while stack and time.monotonic() < deadline:
                p, depth = stack.pop()
                try:
                    for child in sorted(p.iterdir()):
                        if child.is_symlink() or self.excluded(child):
                            continue
                        s = child.lstat()
                        if s.st_uid != os.getuid():
                            continue
                        istemp = category == 'Temporary'
                        threshold = 100 * 1024**2 if istemp else int(self.config['large_file_bytes'])
                        if stat.S_ISREG(s.st_mode) and s.st_size >= threshold:
                            risk = 'caution' if category == 'Downloads' and child.suffix.lower() in {'.iso', '.zip', '.gz', '.xz', '.zst', '.deb', '.rpm', '.apk', '.appimage'} else 'risky'
                            yield child, child.name, risk, category, \
                                'Large file, not necessarily disposable. Review its contents and purpose.', \
                                'inspect' if category == 'AI / models' else 'file', None
                        elif stat.S_ISDIR(s.st_mode) and not os.path.ismount(child):
                            if istemp and depth == 0 and time.time() - s.st_mtime > 2 * DAY:
                                yield child, child.name, 'risky', category, \
                                    'User-owned temporary directory. May contain work or running application state.', 'file', None
                            elif depth < int(self.config['large_file_depth']) and child.name not in SKIP:
                                stack.append((child, depth + 1))
                except OSError as e:
                    self.errors.append(f'{p}: {e}')

    def scan(self):
        with self.lock():
            started = time.time()
            deadline = time.monotonic() + float(self.config['scan_seconds'])
            entries = []
            covered = []
            complete = True
            try:
                for p, name, risk, category, description, kind, project in self.candidates(deadline):
                    if time.monotonic() >= deadline:
                        complete = False
                        break
                    if any(within(p, ancestor) for ancestor in covered):
                        continue
                    if self.excluded(p):
                        continue
                    try:
                        if kind != 'system-inspect':
                            self.check_path(p)
                        note = git_safety(p) if kind in {'project', 'file'} else ''
                        if note:
                            risk = 'risky'
                        info = measure(p, timeout=min(float(self.config['entry_seconds']), max(.01, deadline-time.monotonic())))
                        if info['bytes'] < int(self.config['minimum_bytes']) and info['complete']:
                            continue
                        blocks = []
                        if kind in {'inspect','system-inspect'}:
                            blocks.append('Inspection only: system data, installed tools, models or Git worktrees')
                        if not info['complete']:
                            blocks.append('Incomplete measurement; cannot clean')
                        if info['nested_git']:
                            blocks.append('Contains a Git checkout; inspect through Git')
                        if info['mount']:
                            blocks.append('Contains another mount or Btrfs subvolume')
                        if info['foreign_owner']:
                            blocks.append('Contains files owned by another user')
                        entry = {'id': hashlib.sha256(os.fsencode(p)).hexdigest()[:20],
                                 'path': str(p), 'name': name, 'risk': risk, 'category': category,
                                 'description': description, 'kind': kind, 'project': project,
                                 'note': note, 'blocked': '; '.join(blocks), **info,
                                 'age_days': max(0, (started-info['latest_mtime'])/DAY)}
                        entries.append(entry)
                        covered.append(p)
                    except (OSError, Refused, subprocess.TimeoutExpired) as e:
                        self.errors.append(f'{p}: {e}')
                    # Progress survives an interrupted scan; never advertise it as complete.
                    self.save_scan(entries, started, False, 'Scanning ' + str(p))
                complete &= time.monotonic() < deadline
            finally:
                entries.sort(key=lambda e: e['bytes'], reverse=True)
                result = self.save_scan(entries, started, complete, '' if complete else 'Scan reached its time budget; increase scan_seconds for more coverage')
            return result

    def save_scan(self, entries, started, complete, progress):
        result = {'version': VERSION, 'scanned_at': started, 'complete': complete,
                  'progress': progress, 'entries': entries, 'errors': self.errors[-30:],
                  'estimate_note': 'Allocated file blocks are estimates. Btrfs compression, shared extents, hard links and snapshots affect actual reclaim.',
                  'categories': {c: sum(e['bytes'] for e in entries if e['category'] == c)
                                 for c in sorted({e['category'] for e in entries})},
                  'review_bytes': sum(e['bytes'] for e in entries if not e['blocked']),
                  'stale_days': self.config['stale_days'],
                  'safe_stale_bytes': sum(e['bytes'] for e in entries if not e['blocked'] and e['risk']=='safe' and e['age_days']>=self.config['stale_days'])}
        save_json(self.state / 'scan.json', result)
        return result

    def partitions(self):
        mounts = []
        sources = set()
        # df reports the filesystem source correctly for Btrfs subvolumes.
        raw = run(['df', '-PT', '-B1', '/', str(self.home), '/boot'])
        for line in raw.splitlines()[1:]:
            parts = line.split()
            if len(parts) < 7:
                continue
            source, fstype, total, used, available, pct, mount = parts[:7]
            if source in sources:
                continue
            sources.add(source)
            mounts.append({'source': source, 'type': fstype, 'mount': mount,
                           'total': int(total), 'used': int(used), 'available': int(available),
                           'percent': float(pct.rstrip('%'))})
        return mounts

    def status(self, notify=False):
        scan = load_json(self.state / 'scan.json', {'entries': [], 'scanned_at': 0, 'complete': False,
                                                 'review_bytes': 0, 'safe_stale_bytes': 0, 'categories': {}})
        disks = self.partitions()
        with self.lock('status.lock'):
            history = load_json(self.state / 'history.json', [])
            now = time.time()
            if not history or now-history[-1]['time'] >= 3600:
                history.append({'time': now, 'disks': disks})
                history = [h for h in history if now-h['time'] <= 90*DAY]
                save_json(self.state / 'history.json', history)
            forecasts = {}
            for disk in disks:
                points = [(h['time']/DAY, d['used']) for h in history for d in h['disks']
                          if d['source']==disk['source'] and d['total']==disk['total']]
                if len(points) >= 8 and points[-1][0]-points[0][0] >= 7:
                    xbar=sum(x for x,y in points)/len(points); ybar=sum(y for x,y in points)/len(points)
                    denom=sum((x-xbar)**2 for x,y in points)
                    slope=sum((x-xbar)*(y-ybar) for x,y in points)/denom if denom else 0
                    if slope > 1024**2:
                        forecasts[disk['source']] = round(disk['available']/slope, 1)
            if notify:
                levels = load_json(self.state / 'notifications.json', {})
                for disk in disks:
                    level = 90 if disk['percent']>=90 else 80 if disk['percent']>=80 else 0
                    if level > levels.get(disk['source'], 0) and shutil.which('notify-send'):
                        subprocess.run(['notify-send', '--app-name=Disk Guard', '--urgency=normal',
                                        'Disk space needs attention', f"{disk['mount']}: {disk['percent']:.0f}% used. Open Disk Guard to review caches."],
                                       capture_output=True, timeout=5)
                    levels[disk['source']] = level
                save_json(self.state / 'notifications.json', levels)
        journal = load_json(self.state / 'trash-journal.json', [])
        trash = [r for r in journal if r['status'] in {'trashed', 'prepared'} and (self.trash/'files'/r['name']).exists()]
        return {**scan, 'disks': disks, 'forecasts': forecasts, 'trash': trash,
                'trash_bytes': sum(r['bytes'] for r in trash),
                'last_action': load_json(self.state / 'last-action.json', None)}

    def selected(self, ids):
        scan = load_json(self.state / 'scan.json', None)
        if not scan:
            raise Refused('Run a scan first')
        indexed = {e['id']: e for e in scan['entries']}
        if not ids or len(ids) != len(set(ids)) or any(i not in indexed for i in ids):
            raise Refused('Unknown, duplicate or empty selection; scan again')
        return [indexed[i] for i in ids]

    def validate_entry(self, entry):
        path = Path(entry['path'])
        self.check_path(path, writable=True)
        if entry['blocked']:
            raise Refused(entry['blocked'])
        if entry['kind'] in {'project', 'file'}:
            git_safety(path)
        if entry['kind'] == 'project':
            project = Path(entry['project'])
            families = project_families(project, {x.name for x in project.iterdir()})
            rel = str(path.relative_to(project))
            valid = any(rel in ARTIFACTS[f] for f in families)
            valid |= 'Python' in families and rel.endswith('.egg-info') and '/' not in rel
            if not valid:
                raise Refused('Project artifact no longer matches its build system')
        info = measure(path, timeout=float(self.config['entry_seconds']))
        if not info['complete'] or info['nested_git'] or info['mount'] or info['foreign_owner']:
            raise Refused('Contains Git, mounts, foreign-owned files or unreadable content')
        if info['fingerprint'] != entry['fingerprint']:
            raise Refused('Files changed since scan; scan again before cleanup')
        return info

    def activity(self, entries):
        paths = list(dict.fromkeys([Path(e['path']) for e in entries] + [Path(e['project']) for e in entries if e.get('project')]))
        hits, unknown = process_users(paths)
        blockers = {}
        for e in entries:
            found = hits.get(e['path'], [])
            if e.get('project'):
                found = found + hits.get(e['project'], [])
            blockers[e['path']] = sorted(set(found))
        # Cache consumers may have closed descriptors; block their package manager too.
        families = {
            'Python': {'uv', 'pip', 'pip3', 'poetry', 'pipenv', 'conda'},
            'JavaScript': {'npm', 'pnpm', 'bun', 'yarn', 'deno', 'node-gyp'},
            'JVM / Android': {'gradle', 'mvn', 'sbt'},
            'Go / Rust': {'cargo', 'rustc', 'go', 'zig'},
            'Build tools': {'bazel', 'ccache', 'sccache'},
            'Other languages': {'composer', 'dotnet', 'flutter', 'dart', 'gem'},
            'Testing': {'npm', 'pnpm', 'bun', 'yarn', 'playwright'},
            'Arch Linux': {'yay', 'paru', 'pacman'},
        }
        for proc in Path('/proc').iterdir():
            if not proc.name.isdigit() or int(proc.name) == os.getpid(): continue
            try:
                if proc.stat().st_uid != os.getuid(): continue
                words = (proc/'cmdline').read_bytes().split(b'\0')[:5]
                names = {Path(os.fsdecode(w)).name.lower() for w in words if w}
                names.add((proc/'comm').read_text().strip().lower())
                for e in entries:
                    if e['kind'] == 'cache' and names & families.get(e['category'], set()):
                        blockers[e['path']].append(proc.name)
            except FileNotFoundError: continue
            except PermissionError: unknown.append(proc.name)
        return blockers, sorted(set(unknown))

    def preview(self, ids):
        with self.lock():
            entries = self.selected(ids)
            paths = [Path(e['path']) for e in entries]
            hits, unknown = self.activity(entries)
            reasons = {}
            for entry in entries:
                try:
                    self.validate_entry(entry)
                    if unknown:
                        raise Refused('Cannot inspect some user processes; cleanup is blocked')
                    if hits[entry['path']]:
                        raise Refused('In use by process(es): ' + ', '.join(hits[entry['path']]))
                    # First version deliberately avoids expensive cross-filesystem copies.
                    ancestor = self.trash
                    while not ancestor.exists():
                        ancestor = ancestor.parent
                    if Path(entry['path']).stat().st_dev != ancestor.stat().st_dev:
                        raise Refused('Different filesystem from home Trash; use the file manager')
                except (OSError, Refused, subprocess.TimeoutExpired) as e:
                    reasons[entry['id']] = str(e)
            token = uuid.uuid4().hex
            phrase = 'MOVE REVIEWED FILES' if any(e['risk']!='safe' or e['age_days']<self.config['stale_days'] for e in entries) else 'MOVE TO TRASH'
            result = {'token': token, 'created_at': time.time(), 'expires_at': time.time()+600,
                      'ids': ids, 'entries': entries, 'blocked': reasons, 'phrase': phrase,
                      'bytes': sum(e['bytes'] for e in entries),
                      'message': 'Moving to Trash is recoverable and does not free disk space. Review every selected path.'}
            save_json(self.state / 'preview.json', result)
            return result

    def trash_dirs(self):
        for p in (self.trash, self.trash/'files', self.trash/'info'):
            secure_dir(p)

    def trash_files(self, token, phrase):
        with self.lock():
            preview = load_json(self.state/'preview.json', {})
            if preview.get('token') != token or time.time() > preview.get('expires_at', 0):
                raise Refused('Review expired; preview again')
            if phrase != preview['phrase'] or preview['blocked']:
                raise Refused('Confirmation does not match, or selected files are blocked')
            entries = self.selected(preview['ids'])
            for entry in entries:
                self.validate_entry(entry)
            paths = [Path(e['path']) for e in entries]
            hits, unknown = self.activity(entries)
            if unknown or any(hits.values()):
                raise Refused('Selected paths are active, or user processes cannot be inspected')
            self.trash_dirs()
            for p in paths:
                if p.stat().st_dev != (self.trash/'files').stat().st_dev:
                    raise Refused('Cross-filesystem trashing is not supported')
            before = self.partitions()
            journal = load_json(self.state/'trash-journal.json', [])
            moved = []
            errors = []
            for entry in entries:
                path = Path(entry['path'])
                name = 'disk-guard-' + uuid.uuid4().hex
                destination = self.trash/'files'/name
                info = self.trash/'info'/(name+'.trashinfo')
                record = {'id': name, 'name': name, 'original': str(path), 'bytes': entry['bytes'],
                          'identity': entry['identity'], 'time': time.time(), 'status': 'prepared'}
                try:
                    # Check again immediately before moving each entry. Never force a busy path.
                    self.validate_entry(entry)
                    busy, invisible = self.activity([entry])
                    if invisible or busy[str(path)]:
                        raise Refused('Path became active during cleanup')
                    text = '[Trash Info]\nPath=' + quote(str(path), safe='/') + '\nDeletionDate=' + dt.datetime.now().strftime('%Y-%m-%dT%H:%M:%S') + '\n'
                    fd = os.open(info, os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW, 0o600)
                    with os.fdopen(fd, 'w') as f:
                        f.write(text); f.flush(); os.fsync(f.fileno())
                    journal.append(record)
                    save_json(self.state/'trash-journal.json', journal)
                    no_symlink_ancestors(path)
                    s=path.lstat()
                    if [s.st_dev,s.st_ino] != entry['identity']:
                        raise Refused('Path identity changed')
                    rename_noreplace(path, destination)
                    record['status']='trashed'
                    moved.append(record)
                    save_json(self.state/'trash-journal.json', journal)
                except (OSError, Refused, subprocess.TimeoutExpired) as e:
                    if not destination.exists():
                        with contextlib.suppress(FileNotFoundError): info.unlink()
                        record['status']='failed'
                    errors.append({'path':str(path), 'error':str(e)})
                    save_json(self.state/'trash-journal.json', journal)
                    break
            save_json(self.state/'preview.json', {})
            self.invalidate_scan([e['path'] for e in entries if any(r['original']==e['path'] for r in moved)])
            return self.action_result('trash', moved, errors, before)

    def invalidate_scan(self, paths):
        scan=load_json(self.state/'scan.json', {})
        entries=[e for e in scan.get('entries',[]) if e['path'] not in paths]
        self.save_scan(entries, scan.get('scanned_at',time.time()), False, 'Contents changed; rescan to refresh estimates')

    def trash_records(self, ids):
        self.trash_dirs()
        journal=load_json(self.state/'trash-journal.json', [])
        indexed={r['id']:r for r in journal if r['status'] in {'trashed','prepared'}}
        if not ids or len(set(ids))!=len(ids) or any(i not in indexed for i in ids):
            raise Refused('Unknown or empty Trash selection')
        records=[indexed[i] for i in ids]
        for r in records:
            if not r['name'].startswith('disk-guard-') or '/' in r['name'] or r['name']!=r['id']:
                raise Refused('Invalid Trash record')
            p=self.trash/'files'/r['name']
            no_symlink_ancestors(p)
            s=p.lstat()
            if [s.st_dev,s.st_ino]!=r['identity']:
                raise Refused('Trash entry identity changed')
        return journal, records

    def restore(self, ids):
        with self.lock():
            journal, records=self.trash_records(ids)
            # Validate all destinations before any move, never overwrite or create parents.
            for r in records:
                p=Path(r['original'])
                no_symlink_ancestors(p)
                if os.path.lexists(p) or not p.parent.is_dir():
                    raise Refused('Restore destination exists or parent is missing: '+str(p))
                if not os.access(p.parent,os.W_OK): raise Refused('Restore destination is read-only')
                if p.parent.stat().st_dev!=(self.trash/'files'/r['name']).stat().st_dev:
                    raise Refused('Cannot restore across filesystems')
            before=self.partitions(); done=[]; errors=[]
            for r in records:
                try:
                    p=Path(r['original'])
                    if os.path.lexists(p): raise Refused('Destination appeared; refusing overwrite')
                    # Linux renameat2 RENAME_NOREPLACE prevents concurrent overwrite.
                    rename_noreplace(self.trash/'files'/r['name'],p)
                    r['status']='restored'; done.append(r)
                    (self.trash/'info'/(r['name']+'.trashinfo')).unlink(missing_ok=True)
                    save_json(self.state/'trash-journal.json',journal)
                except (OSError,Refused) as e:
                    errors.append({'path':r['original'],'error':str(e)});break
            save_json(self.state/'trash-journal.json',journal)
            return self.action_result('restore',done,errors,before)

    def empty(self, ids, phrase):
        if phrase!='EMPTY SELECTED TRASH':
            raise Refused('Type EMPTY SELECTED TRASH to permanently erase selected plugin Trash entries')
        with self.lock():
            journal,records=self.trash_records(ids)
            paths=[self.trash/'files'/r['name'] for r in records]
            hits,unknown=process_users(paths)
            if unknown or any(hits.values()):raise Refused('Trash entries are active or processes cannot be inspected')
            for p in paths:
                info=measure(p,timeout=float(self.config['entry_seconds']))
                if not info['complete'] or info['mount'] or info['foreign_owner']:
                    raise Refused('Cannot safely erase selected Trash contents')
            before=self.partitions();done=[];errors=[]
            for r,p in zip(records,paths):
                try:
                    # rmtree on Python/Linux is fd-based and resists symlink substitution.
                    if p.is_dir():
                        if not shutil.rmtree.avoids_symlink_attacks:raise Refused('Safe rmtree unavailable')
                        shutil.rmtree(p)
                    else:p.unlink()
                    r['status']='erased';done.append(r)
                    (self.trash/'info'/(r['name']+'.trashinfo')).unlink(missing_ok=True)
                    save_json(self.state/'trash-journal.json',journal)
                except (OSError,Refused) as e:
                    errors.append({'path':r['original'],'error':str(e)});break
            save_json(self.state/'trash-journal.json',journal)
            return self.action_result('empty',done,errors,before)

    def action_result(self, action, done, errors, before):
        after=self.partitions()
        old={d['source']:d['available'] for d in before}
        observed=sum(max(0,d['available']-old.get(d['source'],d['available'])) for d in after)
        result={'action':action,'time':time.time(),'count':len(done),
                'estimated_bytes':sum(r['bytes'] for r in done),'observed_free_delta':observed,
                'errors':errors,'message':'Observed free-space change may include concurrent disk activity. Btrfs snapshots can retain deleted blocks.'}
        save_json(self.state/'last-action.json',result)
        return result


def rename_noreplace(source,dest):
    import ctypes
    libc=ctypes.CDLL(None,use_errno=True)
    fn=libc.renameat2
    fn.argtypes=[ctypes.c_int,ctypes.c_char_p,ctypes.c_int,ctypes.c_char_p,ctypes.c_uint]
    fn.restype=ctypes.c_int
    if fn(-100,os.fsencode(source),-100,os.fsencode(dest),1)!=0:
        error=ctypes.get_errno()
        raise OSError(error,os.strerror(error),str(dest))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state');parser.add_argument('--config')
    sub=parser.add_subparsers(dest='command',required=True)
    sub.add_parser('scan')
    s=sub.add_parser('status');s.add_argument('--notify',action='store_true')
    p=sub.add_parser('preview');p.add_argument('ids',nargs='+')
    p=sub.add_parser('trash');p.add_argument('--token',required=True);p.add_argument('--confirm',required=True)
    p=sub.add_parser('restore');p.add_argument('ids',nargs='+')
    p=sub.add_parser('empty');p.add_argument('--confirm',required=True);p.add_argument('ids',nargs='+')
    sub.add_parser('default-config')
    args=parser.parse_args()
    try:
        if args.command=='default-config':result=DEFAULTS
        else:
            guard=Guard(args.state,args.config)
            if args.command=='scan':result=guard.scan()
            elif args.command=='status':result=guard.status(args.notify)
            elif args.command=='preview':result=guard.preview(args.ids)
            elif args.command=='trash':result=guard.trash_files(args.token,args.confirm)
            elif args.command=='restore':result=guard.restore(args.ids)
            else:result=guard.empty(args.ids,args.confirm)
        print(json.dumps(result,ensure_ascii=True))
    except (OSError,Refused,ValueError,subprocess.TimeoutExpired) as e:
        print(json.dumps({'error':str(e)}))
        return 1
    return 0

if __name__=='__main__':sys.exit(main())
