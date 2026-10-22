"""Driver-boundary regressions. These do not launch or qualify a browser."""
import asyncio
import pathlib
import sys
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'sdk/python'))
import custom_browser as sdk

BASE={'executable_path':'not-launched.exe','engine_mode':'baseline'}

class SdkContractTests(unittest.TestCase):
    def test_raw_args_reject_non_lists(self):
        for args in ['--example',b'--example',{'--example':True},(),False,1,['--example',1]]:
            with self.subTest(args=args),self.assertRaisesRegex(TypeError,'args'):
                sdk._options(**BASE,args=args)
        self.assertEqual(sdk._options(**BASE,args=['--example'])['args'],['--example'])
        self.assertEqual(sdk._options(**BASE,args=None)['args'],[])

    def test_invalid_args_do_not_create_profile_or_start_driver(self):
        with tempfile.TemporaryDirectory() as directory,patch('playwright.sync_api.sync_playwright') as factory:
            profile=pathlib.Path(directory)/'never-created'
            with self.assertRaisesRegex(TypeError,'args'):
                sdk.launch_persistent_context(profile,**BASE,args='--example')
            self.assertFalse(profile.exists());factory.assert_not_called()

    def test_context_builder_and_copy(self):
        viewport={'width':900,'height':700}
        mapped=sdk.build_context_options(locale='fr-FR',timezone='Europe/Paris',viewport=viewport)
        self.assertEqual(mapped,{'locale':'fr-FR','timezone_id':'Europe/Paris','viewport':viewport})
        mapped['viewport']['width']=1000
        self.assertEqual(viewport['width'],900)
        self.assertEqual(sdk.build_context_options(),{'no_viewport':True})
        self.assertEqual(sdk.build_context_options(viewport=None),{'no_viewport':True})

    def test_context_builder_rejects_invalid_values(self):
        for options in [{'viewport':{'width':-1,'height':10}},{'viewport':{'width':True,'height':10}},{'viewport':{'width':10.5,'height':10}},{'viewport':{'width':10,'height':10,'extra':1}},{'locale':123},{'locale':''},{'timezone':'bad zone'}]:
            with self.subTest(options=options),self.assertRaises((ValueError,TypeError)):
                sdk.build_context_options(**options)

    def test_sync_profile_forwards_viewport_without_no_viewport(self):
        captured={}
        def launch(*args,**kwargs):captured.update(kwargs);return SimpleNamespace(close=lambda:None)
        pw=SimpleNamespace(chromium=SimpleNamespace(launch_persistent_context=launch),stop=lambda:None)
        with tempfile.TemporaryDirectory() as directory,patch('playwright.sync_api.sync_playwright',return_value=SimpleNamespace(start=lambda:pw)):
            context=sdk.launch_persistent_context(directory,**BASE,locale='fr-FR',timezone='Europe/Paris',viewport={'width':900,'height':700})
            self.assertEqual(captured['viewport'],{'width':900,'height':700});self.assertNotIn('no_viewport',captured)
            self.assertEqual(captured['locale'],'fr-FR');self.assertEqual(captured['timezone_id'],'Europe/Paris');context.close()

    def test_plain_launch_rejects_context_fields_before_driver_start(self):
        with patch('playwright.sync_api.sync_playwright') as factory:
            for options in [{'locale':'fr-FR'},{'timezone':'Europe/Paris'},{'viewport':None}]:
                with self.assertRaisesRegex(TypeError,'context'):
                    sdk.launch(**BASE,**options)
            factory.assert_not_called()

class AsyncSdkContractTests(unittest.IsolatedAsyncioTestCase):
    async def test_async_profile_forwards_viewport(self):
        captured={}
        async def close():pass
        async def launch(*args,**kwargs):captured.update(kwargs);return SimpleNamespace(close=close)
        async def start():return SimpleNamespace(chromium=SimpleNamespace(launch_persistent_context=launch),stop=close)
        with tempfile.TemporaryDirectory() as directory,patch('playwright.async_api.async_playwright',return_value=SimpleNamespace(start=start)):
            context=await sdk.launch_persistent_context_async(directory,**BASE,viewport={'width':900,'height':700})
            self.assertEqual(captured['viewport'],{'width':900,'height':700});self.assertNotIn('no_viewport',captured);await context.close()

    async def test_async_rejections_do_not_create_profile_or_start_driver(self):
        with tempfile.TemporaryDirectory() as directory,patch('playwright.async_api.async_playwright') as factory:
            profile=pathlib.Path(directory)/'never-created'
            with self.assertRaisesRegex(TypeError,'args'):
                await sdk.launch_persistent_context_async(profile,**BASE,args='--example')
            self.assertFalse(profile.exists())
            with self.assertRaisesRegex(TypeError,'context'):
                await sdk.launch_async(**BASE,locale='fr-FR')
            factory.assert_not_called()

if __name__=='__main__':unittest.main(verbosity=2)
