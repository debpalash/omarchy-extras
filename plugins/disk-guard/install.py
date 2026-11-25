#!/usr/bin/env python3
"""Install this user-owned plugin; never modifies packaged Omarchy files."""
import argparse
import datetime
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

SOURCE = Path(__file__).resolve().parent
FILES = ['manifest.json', 'Panel.qml', 'disk_guard.py', 'catalog.py', 'README.md', 'LICENSE', 'preview.png']


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--no-enable',action='store_true',help='Copy files without enabling the bar widget')
    p.add_argument('--prefix',type=Path,help='Alternative plugin parent for packaging/testing; disables activation')
    args=p.parse_args()
    config=Path(os.environ.get('XDG_CONFIG_HOME') or Path.home()/'.config')
    parent=args.prefix or config/'omarchy/plugins'
    dest=parent/'local.disk-guard'
    for path in [dest,*dest.parents]:
        if path.is_symlink():sys.exit('Refusing symlink installation path: '+str(path))
    existing_parent=parent
    while not existing_parent.exists():existing_parent=existing_parent.parent
    if not os.access(existing_parent,os.W_OK):
        sys.exit('Installation blocked by read-only access. Run python3 install.py from your normal terminal.')
    if dest.exists():
        stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
        backups=(args.prefix.parent/'disk-guard-backups') if args.prefix else config/'omarchy/plugin-backups'
        backups.mkdir(parents=True,exist_ok=True)
        shutil.copytree(dest,backups/('local.disk-guard-'+stamp))
    dest.mkdir(parents=True,exist_ok=True)
    for name in FILES:shutil.copy2(SOURCE/name,dest/name)
    if args.prefix:
        print('Packaged plugin at '+str(dest));return
    settings=config/'disk-guard/config.json'
    settings.parent.mkdir(parents=True,exist_ok=True)
    if not settings.exists():
        from disk_guard import DEFAULTS
        settings.write_text(json.dumps(DEFAULTS,indent=2)+'\n')
        settings.chmod(0o600)
    print('Installed '+str(dest))
    if not args.no_enable:
        if not shutil.which('omarchy-shell') or not shutil.which('omarchy'):
            sys.exit('Plugin copied. Omarchy CLI missing; enable local.disk-guard when the shell is available.')
        subprocess.run(['omarchy-shell','shell','rescanPlugins'],check=True)
        subprocess.run(['omarchy','plugin','enable','local.disk-guard'],check=True)
        print('Enabled. Click Disk in the bar, or: omarchy-shell local.disk-guard open')

if __name__=='__main__':main()
