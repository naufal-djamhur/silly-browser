import hashlib
import io
import json
import pathlib
import shutil
import stat
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'sdk/python'))
from custom_browser import browser_manager as manager
import custom_browser as sdk
import silly_browser


def fixture(entries=None):
    entries=entries or {'chrome.exe':b'fixture executable','locales/en-US.pak':b'fixture locale'}
    output=io.BytesIO()
    with zipfile.ZipFile(output,'w') as bundle:
        for name,data in entries.items():bundle.writestr(name,data)
    archive=output.getvalue()
    entry={'revision':'fixture-1','platform':manager.host_platform(),'executable':'chrome.exe',
           'chromiumVersion':'155.0.8059.80',
           'url':'https://github.com/naufal-djamhur/silly-browser/releases/download/fixture-1/browser.zip',
           'sha256':hashlib.sha256(archive).hexdigest(),'size':len(archive),
           'files':{name:{'sha256':hashlib.sha256(data).hexdigest(),'size':len(data)} for name,data in entries.items()}}
    return archive,entry,{'schemaVersion':1,'defaultRevision':'fixture-1','releases':[entry]}


class BrowserManagerTests(unittest.TestCase):
    @unittest.skipUnless(shutil.which('node'),'Node.js is required for the cross-SDK cache check')
    def test_javascript_and_python_reuse_each_others_cache(self):
        archive,entry,catalog=fixture()
        module=(pathlib.Path(__file__).resolve().parents[1]/'sdk/js/browser-manager.mjs').as_uri()
        code='''import {readFile} from 'node:fs/promises';
import {installBrowser} from MODULE;
const [manifest,archive,cache,network]=process.argv.slice(1);
const releaseCatalog=JSON.parse(await readFile(manifest));
console.log(await installBrowser({cacheDir:cache,releaseCatalog,fetchImpl:async()=>{
 if(network==='forbidden')throw Error('Unexpected network call');
 return new Response(await readFile(archive));
}}));'''.replace('MODULE',json.dumps(module))
        with tempfile.TemporaryDirectory() as root:
            root=pathlib.Path(root);manifest=root/'catalog.json';bundle=root/'fixture.zip'
            manifest.write_text(json.dumps(catalog));bundle.write_bytes(archive)
            for direction in ['js-first','py-first']:
                cache=root/direction
                if direction=='py-first':
                    with patch.object(manager,'_download',side_effect=lambda e,p:p.write_bytes(archive)):
                        python_path=manager.install_browser(cache_dir=cache,release_catalog=catalog)
                result=subprocess.run([shutil.which('node'),'--input-type=module','-e',code,str(manifest),str(bundle),str(cache),
                                       'forbidden' if direction=='py-first' else 'fixture'],check=True,capture_output=True,text=True,timeout=30)
                with patch.object(manager,'_download',side_effect=AssertionError('Unexpected network call')):
                    python_path=manager.install_browser(cache_dir=cache,release_catalog=catalog)
                self.assertEqual(pathlib.Path(result.stdout.strip()),pathlib.Path(python_path))

    def test_pending_release_and_import_compatibility(self):
        self.assertIs(silly_browser.launch,sdk.launch)
        if manager.CATALOG['defaultRevision'] is None:self.assertEqual(manager.CATALOG['releases'],[])
        for entry in manager.CATALOG['releases']:manager.select_release(revision=entry['revision'],host=entry['platform'])
        with self.assertRaisesRegex(RuntimeError,'No published'):manager.select_release({'schemaVersion':1,'defaultRevision':None,'releases':[]})

    def test_paths_and_urls(self):
        for value in ['../escape','/absolute','C:/drive','a\\b','NUL.txt','a/../b','a//b','a.']:
            with self.subTest(value=value),self.assertRaises(ValueError):manager.safe_archive_path(value)
        _,entry,catalog=fixture()
        entry['url']='https://example.com/evil.zip'
        with self.assertRaisesRegex(ValueError,'official'):manager.select_release(catalog)

    def test_install_reuse_integrity_and_shared_marker(self):
        archive,entry,catalog=fixture()
        with tempfile.TemporaryDirectory() as root,patch.object(manager,'_download',side_effect=lambda e,p:p.write_bytes(archive)) as download:
            path=pathlib.Path(manager.install_browser(cache_dir=root,release_catalog=catalog))
            self.assertEqual(path.read_bytes(),b'fixture executable')
            self.assertEqual(manager.install_browser(cache_dir=root,release_catalog=catalog),str(path))
            self.assertEqual(download.call_count,1)
            identity=json.loads((path.parent/manager.MARKER).read_text())
            self.assertEqual(identity['archiveSha256'],entry['sha256'])
            self.assertEqual(list(path.parent.parent.iterdir()),[path.parent])
            path.write_bytes(b'corrupt')
            with self.assertRaisesRegex(RuntimeError,'integrity failure'):manager.install_browser(cache_dir=root,release_catalog=catalog)

    def test_zip_traversal_case_collisions_and_symlinks(self):
        for attack in ['../outside','CHROME.exe','symlink']:
            archive,entry,catalog=fixture()
            output=io.BytesIO()
            with zipfile.ZipFile(output,'w') as bundle:
                bundle.writestr('chrome.exe',b'fixture executable')
                if attack=='symlink':
                    info=zipfile.ZipInfo('link');info.create_system=3;info.external_attr=(stat.S_IFLNK|0o777)<<16
                    bundle.writestr(info,'target')
                else:bundle.writestr(attack,b'attack')
            with tempfile.TemporaryDirectory() as root,patch.object(manager,'_download',side_effect=lambda e,p:p.write_bytes(output.getvalue())):
                with self.subTest(attack=attack),self.assertRaises((ValueError,RuntimeError)):
                    manager.install_browser(cache_dir=root,release_catalog=catalog)
                self.assertEqual(list((pathlib.Path(root)/entry['revision']).iterdir()),[])
                self.assertFalse((pathlib.Path(root)/'outside').exists())

    def test_lock_and_download_disabled(self):
        _,entry,catalog=fixture()
        with tempfile.TemporaryDirectory() as root:
            parent=pathlib.Path(root)/entry['revision'];parent.mkdir()
            lock=parent/f"{entry['platform']}.lock";lock.write_text('other process')
            with self.assertRaisesRegex(RuntimeError,'in progress'):manager.install_browser(cache_dir=root,release_catalog=catalog)
            self.assertEqual(lock.read_text(),'other process')
            lock.unlink()
            with patch.dict('os.environ',{'SILLY_BROWSER_SKIP_DOWNLOAD':'1'}):
                with self.assertRaisesRegex(RuntimeError,'disabled'):manager.install_browser(cache_dir=root,release_catalog=catalog)

    def test_download_checksums_and_redirects(self):
        archive,entry,_=fixture()
        class Response(io.BytesIO):pass
        class Opener:
            def open(self,*args,**kwargs):return Response(archive)
        with tempfile.TemporaryDirectory() as root,patch.object(manager,'build_opener',return_value=Opener()):
            path=pathlib.Path(root)/'archive.zip';manager._download(entry,path)
            self.assertEqual(path.read_bytes(),archive)
            entry['sha256']='0'*64
            with self.assertRaisesRegex(RuntimeError,'checksum'):manager._download(entry,pathlib.Path(root)/'bad.zip')
        with self.assertRaisesRegex(ValueError,'HTTPS'):manager._release_url('http://github.com/evil')
        with self.assertRaisesRegex(ValueError,'official'):manager._release_url('https://example.com/evil',redirect=True)

    def test_validation_precedes_download_and_baseline_stays_explicit(self):
        with patch.object(sdk,'ensure_browser') as ensure:
            with self.assertRaisesRegex(TypeError,'args'):sdk._prepare_executable({'args':'bad'})
            with self.assertRaisesRegex(ValueError,'explicit'):sdk._prepare_executable({'engine_mode':'baseline'})
            ensure.assert_not_called()
            ensure.return_value='owned-build.exe'
            self.assertEqual(sdk._prepare_executable({})['executable_path'],'owned-build.exe')


if __name__=='__main__':unittest.main(verbosity=2)
