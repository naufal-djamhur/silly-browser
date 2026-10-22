import hashlib
import importlib.util
import pathlib
import tempfile
import unittest
import zipfile

ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('make_browser_catalog',ROOT/'build/make_browser_catalog.py')
tool=importlib.util.module_from_spec(spec);spec.loader.exec_module(tool)


class CatalogTests(unittest.TestCase):
    def test_failed_or_unfinished_build_cannot_create_download_metadata(self):
        for status in [{},{'state':'failed'},{'state':'compiling','compiled':False,'validated':False}]:
            with self.assertRaisesRegex(ValueError,'successful completed'):tool.create_catalog(pathlib.Path('not-read.zip'),status,'test')

    def test_catalog_binds_inventory_and_qualified_binary_hashes(self):
        files={'chrome.exe':b'fixture exe','chrome.dll':b'fixture dll','icudtl.dat':b'icu',
               'resources.pak':b'pak','locales/en-US.pak':b'locale','LICENSE.chromium.html':b'notices'}
        status={'state':'integration-passed','compiled':True,'validated':True,'version':'155.0.8059.80',
                'binarySha256':hashlib.sha256(files['chrome.exe']).hexdigest(),
                'runtimeSha256':hashlib.sha256(files['chrome.dll']).hexdigest()}
        with tempfile.TemporaryDirectory() as root:
            archive=pathlib.Path(root)/'fixture.zip'
            with zipfile.ZipFile(archive,'w') as bundle:
                for name,data in files.items():bundle.writestr(name,data)
            catalog=tool.create_catalog(archive,status,'fixture-1')
            self.assertEqual(catalog['releases'][0]['platform'],'windows-x64')
            self.assertEqual(set(catalog['releases'][0]['files']),set(files))
            status['binarySha256']='0'*64
            with self.assertRaisesRegex(ValueError,'does not match'):tool.create_catalog(archive,status,'fixture-1')


if __name__=='__main__':unittest.main(verbosity=2)
