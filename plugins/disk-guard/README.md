# Disk Guard for Omarchy

A local Quickshell bar plugin for Arch/Omarchy. Click **Disk** to review developer caches, project artifacts, large downloads and temporary files, then move selected items to recoverable Trash. Nothing is deleted automatically.


## Install

Requires the current Omarchy Quickshell plugin host, Python 3.11+, Git, and the standard `df` command. `notify-send` and `xdg-open` are optional desktop integrations. No Python packages, background web server, telemetry or network requests.

From this directory, in your normal terminal:

```bash
python3 install.py
```

The installer copies the plugin into `~/.config/omarchy/plugins/local.disk-guard`, creates default settings without replacing existing settings, rescans the shell and enables the bar widget. Existing plugin files are backed up under `~/.config/omarchy/plugin-backups/`. It never edits `/usr/share/omarchy`.

```bash
omarchy-shell local.disk-guard open
omarchy plugin disable local.disk-guard
```

Use `python3 install.py --no-enable` to copy without activation. A read-only agent sandbox can build and test this project, but installation must run from a terminal that can write your home directory.

## What it monitors

- Disk usage and free space, sampled every minute; bar pressure colors and one notification per upward crossing of 80% or 90%.
- **72 Linux cache locations**: npm, Yarn, pnpm, Bun, Deno, node-gyp, TypeScript, pip, UV, Poetry, Conda, Gradle, Maven, SBT/Ivy, Go, Cargo, Zig, Bazel, ccache/sccache, Composer, NuGet, Dart/Flutter, Ruby archives, testing browsers, Electron, Prisma, GPU shaders, AUR caches, debug symbols, editor caches and AI model caches. These are explicit paths, not broad app-profile deletion rules.
- **23 project families**: Node.js, Python, Rust, Zig, Go, Gradle, Maven, PHP, Ruby, Flutter, CMake, Swift, CocoaPods, Carthage, Elixir, Haskell, Crystal, Godot, Unity, Unreal, .NET, Terraform, and Xcode. Each project exposes separate artifacts. Go has no generic local artifact rule; its global build/download caches are in the cache catalog.
- Repositories under `~/github`, `~/github-private`, `~/Projects`, and directly in your home directory; nested monorepo projects are discovered too. Only known build-system markers authorize artifact classification. Arbitrary folders named `build`, `cache`, or `bin` are never assumed disposable.
- Large files in discovered project directories and Downloads (default 1 GiB), user-owned temporary files/directories in `/tmp` and `/var/tmp` (default 100 MiB), and model storage at `~/github/models`.
- Pacman packages, the system journal, container storage, installed SDKs/toolchains, Android emulators and cached VoiceStudio worktrees are **inspection only**. Use their owning tools to remove these. Root cleanup, package removal, Docker prune, database removal, and Git worktree deletion are not automated.

Downloads and temporary files are review candidates, not presumed junk. A `.zip` or `.iso` is caution; other large files are risky. You can inspect each location from the panel. Inaccessible paths and truncated measurements are reported.

## Safety and cleanup

1. **Scan:** size, full path, category, risk, description, and last modification age. A “stale” suggestion means no observed file modification for seven days; it does not mean the file was unused.
2. **Select and review:** safe stale candidates can be selected together. Downloads, environments, dependencies, models and other caution/risky items require deliberate selection.
3. **Recheck:** blocks tracked source, Git submodules/checkouts, mounted volumes/subvolumes, symlink artifact roots/ancestors, foreign-owned files, unreadable content, special files, active processes and files changed since scanning. Project processes are checked against their project root, not just the artifact path; common package managers also block corresponding caches. If user-process visibility is incomplete, cleanup is blocked.
4. **Confirm:** type the displayed phrase. A review expires in ten minutes. Each item is checked again immediately before moving. Cleanup stops on the first error and reports completed moves.
5. **Trash:** same-filesystem rename into Freedesktop home Trash, with `.trashinfo` metadata created first and a persistent recovery journal. Cross-filesystem copies are refused. Moving to Trash does **not** reclaim space.
6. **Restore:** restores selected plugin entries, preserves data, refuses missing parent directories and never overwrites new files at the original path.
7. **Erase:** only selected Disk Guard Trash entries, after typing `EMPTY SELECTED TRASH`. Other applications' Trash is never emptied. This action is permanent.

Huihui abliterated and Fable Cold Fusion model directories from this machine are protected by default. Keys, AWS credentials, source repositories, version-manager runtimes and application databases are not generic cleanup candidates. Protect additional locations in settings.

The plugin serializes scans/actions and uses metadata fingerprints and Linux no-overwrite renames. It is a conservative cleanup utility, not a security boundary against malicious programs running as your user. A process can start or write between a final check and a move; keep builders and tools stopped for cleanup. Offline dependencies, locally modified packages and locally generated model data may still require special care even when files are not Git-tracked.

## Space accounting

Folder figures use allocated blocks, without following symlinks. Hard links are deduplicated within each entry; links shared between entries and Btrfs shared extents can still be counted more than once. Btrfs compression, reflinks and snapshots mean **estimated candidate bytes are not guaranteed reclaimable bytes**. The UI separates scan estimates, bytes moved to Trash and observed free-space change after each action. Concurrent disk activity can affect the observed change.

Disk history stays local for 90 days. A linear usage forecast appears only after at least eight samples spanning seven days, and only when usage is growing. It is an estimate, not a scheduled cleanup.

## Settings and performance

`~/.config/disk-guard/config.json` contains project roots, exclusions, protected paths, scan limits and size thresholds. Read the generated defaults:

```bash
python3 disk_guard.py default-config
```

Scans run on first activation, on **Rescan**, and every six hours while the plugin is in the bar. Only the lightweight disk check runs every minute. The first scan may take several minutes on a machine with many dependencies. Defaults limit the overall scan to 240 seconds, each measurement to 35 seconds and discovery depth to six. Partial results are saved during scanning; incomplete entries cannot be cleaned. Raise `scan_seconds`, `entry_seconds`, or `max_depth` if needed. It does not claim to enumerate every byte on the OS partition.

Omarchy's bar settings expose `scanHours` and `notifications`. The panel's Settings button opens the config file. Project roots must remain inside your home; external disks need their own file-manager cleanup. No systemd service, cron task, shell keybinding or global config reset is needed.

## CLI

All responses are JSON. No command accepts an arbitrary cleanup path.

```bash
python3 disk_guard.py scan
python3 disk_guard.py status
python3 disk_guard.py preview SCANNED_ID
python3 disk_guard.py trash --token REVIEW_TOKEN --confirm 'MOVE REVIEWED FILES'
python3 disk_guard.py restore PLUGIN_TRASH_ID
python3 disk_guard.py empty --confirm 'EMPTY SELECTED TRASH' PLUGIN_TRASH_ID
```

Use the exact phrase returned by `preview`; safe stale selections may use `MOVE TO TRASH`. State is under `$XDG_STATE_HOME/disk-guard` and home Trash under `$XDG_DATA_HOME/Trash`. Protected model names and settings can be adjusted locally. Scan records include local file paths; they stay on this machine.

## Validation

```bash
python3 -m unittest discover -s tests -p 'test_guard.py' -v
python3 tests/test_ui.py
```

26 backend tests exercise real temporary Git repositories and real rename/trash/restore/delete operations on disposable fixtures; active-process detection has a real subprocess test. UI smoke tests render the actual QML controls for files, review and Trash using an offscreen popup-host substitute. They check for binding/runtime errors and save screenshots under `test-results/`. They do not verify live Wayland popup positioning or desktop notifications. Those need an installed graphical session.

Freedesktop Trash format reference: https://specifications.freedesktop.org/trash/latest/

License: MIT.
