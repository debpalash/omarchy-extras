import contextlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import disk_guard as dg


class GuardTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(prefix='disk-guard-test-')
        self.home=Path(self.tmp.name)/'home';self.home.mkdir()
        self.env=patch.dict(os.environ,{'HOME':str(self.home),'XDG_DATA_HOME':str(self.home/'data'),
                                       'XDG_CACHE_HOME':str(self.home/'.cache'), 'XDG_STATE_HOME':str(self.home/'state'),
                                       'XDG_CONFIG_HOME':str(self.home/'config')})
        self.env.start()
        self.addCleanup(self.env.stop);self.addCleanup(self.tmp.cleanup)
        self.project=self.home/'Projects/app';self.project.mkdir(parents=True)
        subprocess.run(['git','init','-q',str(self.project)],check=True)
        (self.project/'package.json').write_text('{}')
        (self.project/'.gitignore').write_text('node_modules/\ndist/\nbuild/\n')
        subprocess.run(['git','-C',str(self.project),'add','package.json','.gitignore'],check=True)
        self.cache=self.project/'node_modules';self.cache.mkdir()
        (self.cache/'package.js').write_bytes(b'a'*8192)
        self.config=self.home/'settings.json'
        dg.save_json(self.config,{'project_roots':[str(self.home/'Projects')], 'minimum_bytes':1,
                                  'temp_roots':[], 'protected':[], 'excluded':[], 'large_file_bytes':16384})
        self.guard=dg.Guard(self.home/'guard-state',self.config)
        self.process_patch=patch('disk_guard.process_users',side_effect=lambda paths:({str(p):[] for p in paths},[]))
        self.process_patch.start();self.addCleanup(self.process_patch.stop)

    def scan(self):
        return self.guard.scan()

    def preview(self):
        scan=self.scan()
        entry=next(e for e in scan['entries'] if e['path']==str(self.cache))
        preview=self.guard.preview([entry['id']])
        self.assertFalse(preview['blocked'])
        return entry,preview

    def trash(self):
        entry,preview=self.preview()
        result=self.guard.trash_files(preview['token'],preview['phrase'])
        self.assertEqual(result['count'],1)
        self.assertFalse(self.cache.exists())
        journal=dg.load_json(self.guard.state/'trash-journal.json',[])
        return journal[-1]

    def test_scan_finds_monorepo_and_direct_home_project(self):
        (self.home/'package.json').write_text('{}')
        home_cache=self.home/'dist';home_cache.mkdir();(home_cache/'built.js').write_bytes(b'b'*8192)
        nested=self.project/'mobile';nested.mkdir();(nested/'build.gradle.kts').write_text('')
        (self.project/'.gitignore').write_text('node_modules/\ndist/\nbuild/\nmobile/.cxx/\n')
        (nested/'build').mkdir();(nested/'build/out.apk').write_bytes(b'a'*8192)
        self.guard.roots.append(self.home)
        paths={e['path'] for e in self.scan()['entries']}
        self.assertIn(str(self.cache),paths)
        self.assertIn(str(home_cache),paths)
        self.assertIn(str(nested/'build'),paths)

    def test_tracked_source_never_cleaned(self):
        out=self.project/'build';out.mkdir();(out/'source.js').write_bytes(b'a'*8192)
        subprocess.run(['git','-C',str(self.project),'add','-f','build/source.js'],check=True)
        self.assertNotIn(str(out),{e['path'] for e in self.scan()['entries']})
        self.assertTrue(any('tracked source' in e for e in self.guard.errors))

    def test_nested_git_blocks_cleanup(self):
        (self.cache/'.git').write_text('gitdir: elsewhere')
        entry=next(e for e in self.scan()['entries'] if e['path']==str(self.cache))
        self.assertIn('Git checkout',entry['blocked'])
        self.assertTrue(self.guard.preview([entry['id']])['blocked'])

    def test_symlink_artifact_skipped(self):
        self.cache.rename(self.project/'real_modules')
        self.cache.symlink_to(self.project/'real_modules',target_is_directory=True)
        self.assertNotIn(str(self.cache),{e['path'] for e in self.scan()['entries']})

    def test_protected_descendant_blocks_parent_but_not_sibling_scan(self):
        self.guard.protected.append(self.home/'Projects/protected')
        self.assertIn(str(self.cache),{e['path'] for e in self.scan()['entries']})
        self.guard.protected.append(self.cache/'package.js')
        self.assertNotIn(str(self.cache),{e['path'] for e in self.scan()['entries']})

    def test_unknown_ids_and_duplicate_ids_refused(self):
        entry,preview=self.preview()
        for ids in [[],['not-a-scanned-id'],[entry['id'],entry['id']]]:
            with self.assertRaises(dg.Refused):self.guard.preview(ids)

    def test_changed_files_invalidate_review(self):
        entry,preview=self.preview()
        (self.cache/'package.js').write_bytes(b'changed')
        with self.assertRaisesRegex(dg.Refused,'changed since scan'):
            self.guard.trash_files(preview['token'],preview['phrase'])
        self.assertTrue(self.cache.exists())

    def test_newly_tracked_files_block_review(self):
        entry,preview=self.preview()
        subprocess.run(['git','-C',str(self.project),'add','-f','node_modules/package.js'],check=True)
        with self.assertRaisesRegex(dg.Refused,'tracked source'):
            self.guard.trash_files(preview['token'],preview['phrase'])

    def test_wrong_confirmation_and_expired_review_refused(self):
        entry,preview=self.preview()
        with self.assertRaises(dg.Refused):self.guard.trash_files(preview['token'],'yes')
        preview['expires_at']=0;dg.save_json(self.guard.state/'preview.json',preview)
        with self.assertRaisesRegex(dg.Refused,'expired'):self.guard.trash_files(preview['token'],preview['phrase'])

    def test_active_process_blocks_preview(self):
        entry,_=self.preview()
        with patch('disk_guard.process_users',return_value=({str(self.cache):['42']},[])):
            p=self.guard.preview([entry['id']])
        self.assertIn('42',p['blocked'][entry['id']])

    def test_unknown_process_visibility_blocks_preview(self):
        entry,_=self.preview()
        with patch('disk_guard.process_users',return_value=({str(self.cache):[]},['42'])):
            p=self.guard.preview([entry['id']])
        self.assertIn('Cannot inspect',p['blocked'][entry['id']])

    def test_trash_is_recoverable_and_restore_no_overwrite(self):
        record=self.trash()
        original=(self.guard.trash/'files'/record['name']/'package.js').read_bytes()
        info=(self.guard.trash/'info'/(record['name']+'.trashinfo')).read_text()
        self.assertIn('[Trash Info]',info)
        self.assertIn(str(self.cache),info)
        self.cache.mkdir();(self.cache/'new').write_text('new work')
        with self.assertRaisesRegex(dg.Refused,'destination exists'):self.guard.restore([record['id']])
        self.assertEqual((self.cache/'new').read_text(),'new work')
        (self.cache/'new').unlink();self.cache.rmdir()
        result=self.guard.restore([record['id']])
        self.assertEqual(result['count'],1)
        self.assertEqual((self.cache/'package.js').read_bytes(),original)

    def test_empty_only_selected_plugin_trash(self):
        record=self.trash()
        unrelated=self.guard.trash/'files/other-app-file';unrelated.write_text('keep me')
        with self.assertRaises(dg.Refused):self.guard.empty([record['id']],'yes')
        result=self.guard.empty([record['id']],'EMPTY SELECTED TRASH')
        self.assertEqual(result['count'],1)
        self.assertTrue(unrelated.exists())
        self.assertFalse((self.guard.trash/'files'/record['name']).exists())

    def test_trash_root_symlink_refused(self):
        self.guard.trash.parent.mkdir(parents=True,exist_ok=True)
        alternate=self.home/'alternate';alternate.mkdir()
        self.guard.trash.symlink_to(alternate,target_is_directory=True)
        with self.assertRaisesRegex(dg.Refused,'Symlink'):self.guard.trash_dirs()

    def test_lock_serializes_cleanup(self):
        with self.guard.lock():
            with self.assertRaisesRegex(dg.Refused,'Another'):self.guard.scan()

    def test_incomplete_measurement_blocked(self):
        original=dg.measure
        def partial(*args,**kwargs):
            info=original(*args,**kwargs);info['complete']=False;return info
        with patch('disk_guard.measure',side_effect=partial):scan=self.scan()
        entry=next(e for e in scan['entries'] if e['path']==str(self.cache))
        self.assertIn('Incomplete',entry['blocked'])

    def test_hardlinks_not_double_counted(self):
        p=self.home/'hardlinks';p.mkdir();a=p/'a';a.write_bytes(b'x'*8192);os.link(a,p/'b')
        measured=dg.measure(p)
        self.assertEqual(measured['bytes'],p.stat().st_blocks*512+a.stat().st_blocks*512)

    def test_forecast_requires_history(self):
        status=self.guard.status()
        self.assertEqual(status['forecasts'],{})

    def test_trash_symlink_identity_substitution_refused(self):
        record=self.trash()
        p=self.guard.trash/'files'/record['name'];p.rename(p.with_name('saved'))
        p.symlink_to(self.home,target_is_directory=True)
        with self.assertRaises(dg.Refused):self.guard.empty([record['id']],'EMPTY SELECTED TRASH')

    def test_rename_noreplace_never_overwrites(self):
        a=self.home/'a';b=self.home/'b';a.write_text('source');b.write_text('keep')
        with self.assertRaises(FileExistsError):dg.rename_noreplace(a,b)
        self.assertEqual(b.read_text(),'keep')

    def test_running_project_root_blocks_artifact_cleanup(self):
        entry,_=self.preview()
        with patch('disk_guard.process_users',return_value=({str(self.cache):[],str(self.project):['123']},[])):
            preview=self.guard.preview([entry['id']])
        self.assertIn('123',preview['blocked'][entry['id']])

    def test_nested_mount_blocks_artifact_cleanup(self):
        child=self.cache/'mounted';child.mkdir();(child/'file').write_text('data')
        original=os.path.ismount
        with patch('disk_guard.os.path.ismount',side_effect=lambda p: Path(p)==child or original(p)):
            entry=next(e for e in self.scan()['entries'] if e['path']==str(self.cache))
        self.assertIn('mount',entry['blocked'])

    def test_large_tracked_project_file_preserved(self):
        large=self.project/'source.data';large.write_bytes(b'x'*32768)
        subprocess.run(['git','-C',str(self.project),'add','source.data'],check=True)
        self.assertNotIn(str(large),{e['path'] for e in self.scan()['entries']})

    def test_review_token_cannot_be_replayed(self):
        entry,preview=self.preview()
        result=self.guard.trash_files(preview['token'],preview['phrase'])
        self.assertEqual(result['count'],1)
        with self.assertRaisesRegex(dg.Refused,'expired'):
            self.guard.trash_files(preview['token'],preview['phrase'])

    def test_forecast_with_week_of_growth(self):
        disks=self.guard.partitions()
        now=time.time();source=disks[0]['source'];history=[]
        for i in range(8):
            adjusted=[{**d,'used':d['used']-(7-i)*1024**3} for d in disks]
            history.append({'time':now-(7-i)*dg.DAY,'disks':adjusted})
        dg.save_json(self.guard.state/'history.json',history)
        status=self.guard.status()
        self.assertIn(source,status['forecasts'])
        self.assertGreater(status['forecasts'][source],0)

    def test_real_process_cwd_is_detected(self):
        self.process_patch.stop()
        child=subprocess.Popen([sys.executable,'-c','import time; time.sleep(30)'],cwd=self.cache)
        try:
            hits,unknown=dg.process_users([self.cache])
            self.assertIn(str(child.pid),hits[str(self.cache)])
        finally:
            child.terminate();child.wait()
            self.process_patch.start()

if __name__=='__main__':unittest.main()
