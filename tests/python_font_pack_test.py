import json
import pathlib
import sys
from types import SimpleNamespace
import unittest
from unittest.mock import patch

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT/'sdk/python'),str(ROOT/'packages/fonts')]
import custom_browser as sdk
from silly_browser_fonts import get_font_directory,verify_fonts,FONT_MANIFEST


class FontPackTests(unittest.TestCase):
    def test_inventory_and_font_integrity(self):
        self.assertEqual(FONT_MANIFEST['fontLicense'],'OFL-1.1')
        self.assertEqual(len(FONT_MANIFEST['files']),10)
        self.assertTrue(verify_fonts()['verified'])
        self.assertEqual({f['family'] for f in FONT_MANIFEST['files']},{'Noto Sans','Noto Serif','Noto Sans Mono'})

    def test_typed_native_flag_and_conflicts(self):
        options=sdk._options(executable_path='owned-engine.exe',font_pack='noto-core')
        self.assertIn('--custom-browser-fonts-dir='+get_font_directory(),options['args'])
        for values in [{'font_pack':'unknown'},{'font_pack':'noto-core','font_directory':'other'},
                       {'font_pack':'noto-core','args':['--custom-browser-fonts-dir=duplicate']},
                       {'engine_mode':'baseline','font_pack':'noto-core'}]:
            with self.subTest(values=values),self.assertRaises((ValueError,TypeError)):
                sdk._options(executable_path='owned-engine.exe',**values)

    def test_stubbed_handshake_requires_native_font_capability(self):
        info={'engine':'custom-browser','policyVersion':1,'sourcePatchCount':5,'capabilities':[]}
        with patch.object(sdk.subprocess,'run',return_value=SimpleNamespace(stdout=json.dumps(info))):
            with self.assertRaisesRegex(RuntimeError,'font-directory'):
                sdk._handshake({'executable_path':'not-executed.exe','args':['--custom-browser-fonts-dir=fixture']},'custom')


if __name__=='__main__':unittest.main(verbosity=2)
