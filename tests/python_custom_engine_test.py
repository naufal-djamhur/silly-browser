"""Actual custom-engine option, ownership and persistent-profile checks."""
import asyncio
import hashlib
import importlib.metadata
import json
import os
import pathlib
import platform
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from custom_browser import launch, launch_context_async, launch_persistent_context, launch_persistent_context_async

ROOT = pathlib.Path(__file__).resolve().parents[1]
BINARY = os.environ.get('CUSTOM_BROWSER_EXECUTABLE')
REPORT = pathlib.Path(os.environ.get('CUSTOM_PYTHON_ENGINE_REPORT', ROOT / 'artifacts/engine-validation/windows-146-step2/python-results.json'))
OBSERVATIONS = {}
READ_IDENTITY = """async () => ({platform:navigator.platform, ua:navigator.userAgent,
 hints:await navigator.userAgentData.getHighEntropyValues(['platformVersion','architecture','bitness']),
 headers:await(await fetch('/headers')).json()})"""

class Fixture(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Accept-CH', 'Sec-CH-UA-Platform-Version, Sec-CH-UA-Arch, Sec-CH-UA-Bitness')
        self.send_header('Content-Type', 'application/json' if self.path == '/headers' else 'text/html')
        self.end_headers()
        self.wfile.write(json.dumps(dict(self.headers.items())).encode() if self.path == '/headers' else b'<!doctype html><title>Python custom engine fixture</title>')
    def log_message(self, *args):
        pass

@unittest.skipUnless(BINARY, 'CUSTOM_BROWSER_EXECUTABLE is required')
class CustomEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), Fixture)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = f'http://127.0.0.1:{cls.server.server_port}'
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown(); cls.server.server_close(); cls.thread.join()

    def assert_identity(self, value, native_platform, hint, version):
        self.assertEqual(value['platform'], native_platform)
        self.assertEqual(value['hints']['platform'], hint)
        self.assertEqual(value['hints']['platformVersion'], version)
        headers = {key.lower(): val for key, val in value['headers'].items()}
        self.assertEqual(headers['user-agent'], value['ua'])
        self.assertEqual(headers['sec-ch-ua-platform'], json.dumps(hint))
        self.assertEqual(headers['sec-ch-ua-platform-version'], json.dumps(version))

    def test_sync_windows_persistent_profile(self):
        snapshots = []
        with tempfile.TemporaryDirectory(prefix='python-custom-engine-') as directory:
            seed_file = pathlib.Path(directory) / '.custom-browser-seed'
            stored = None
            for index, override in enumerate((None, '0', None)):
                options = dict(executable_path=BINARY, platform='windows', platform_version='12.3.4', args=['--enable-automation'])
                if override is not None: options['seed'] = override
                context = launch_persistent_context(directory, **options)
                try:
                    page = context.new_page(); page.goto(self.url)
                    identity = page.evaluate(READ_IDENTITY)
                    self.assert_identity(identity, 'Win32', 'Windows', '12.3.4')
                    args = context.new_cdp_session(page).send('Browser.getBrowserCommandLine')['arguments']
                    seed = next(value.split('=', 1)[1] for value in args if value.startswith('--custom-browser-seed='))
                    stored = stored or seed_file.read_text().strip()
                    self.assertEqual(seed, override if override is not None else stored)
                    self.assertEqual(seed_file.read_text().strip(), stored)
                    if index == 0:
                        page.evaluate("localStorage.setItem('python-fixture','retained')")
                        context.add_cookies([dict(name='python-fixture', value='retained', url=self.url, expires=2000000000)])
                    else:
                        self.assertEqual(page.evaluate("localStorage.getItem('python-fixture')"), 'retained')
                        self.assertTrue(any(value['name'] == 'python-fixture' for value in context.cookies()))
                    snapshots.append(dict(seed=seed, platformVersion=identity['hints']['platformVersion']))
                finally: context.close()
        OBSERVATIONS[self._testMethodName] = dict(snapshots=snapshots, diagnosticFlag='--enable-automation', cookiesAndStorageRetained=True)

    def test_async_macos_persistent_profile(self):
        async def probe():
            snapshots = []
            with tempfile.TemporaryDirectory(prefix='python-custom-engine-') as directory:
                seed_file = pathlib.Path(directory) / '.custom-browser-seed'
                for index in range(2):
                    context = await launch_persistent_context_async(directory, executable_path=BINARY, platform='macos', platform_version='12.3.4', args=['--enable-automation'])
                    try:
                        page = await context.new_page(); await page.goto(self.url)
                        identity = await page.evaluate(READ_IDENTITY)
                        self.assert_identity(identity, 'MacIntel', 'macOS', '12.3.4')
                        cdp = await context.new_cdp_session(page)
                        args = (await cdp.send('Browser.getBrowserCommandLine'))['arguments']
                        seed = next(value.split('=', 1)[1] for value in args if value.startswith('--custom-browser-seed='))
                        self.assertEqual(seed, seed_file.read_text().strip())
                        if index == 0: await page.evaluate("localStorage.setItem('python-fixture','retained')")
                        else: self.assertEqual(await page.evaluate("localStorage.getItem('python-fixture')"), 'retained')
                        snapshots.append(dict(seed=seed, platformVersion=identity['hints']['platformVersion']))
                    finally: await context.close()
                self.assertEqual(snapshots[0]['seed'], snapshots[1]['seed'])
            return dict(snapshots=snapshots, diagnosticFlag='--enable-automation', localStorageRetained=True)
        OBSERVATIONS[self._testMethodName] = asyncio.run(probe())

    def test_sync_browser_linux_identity(self):
        browser = launch(executable_path=BINARY, platform='linux', platform_version='12.3.4', seed='18446744073709551615')
        try:
            page = browser.new_page(); page.goto(self.url)
            identity = page.evaluate(READ_IDENTITY)
            self.assert_identity(identity, 'Linux x86_64', 'Linux', '12.3.4')
            OBSERVATIONS[self._testMethodName] = dict(identity=identity, version=browser.version)
        finally: browser.close()

    def test_async_native_context_and_temporary_cleanup(self):
        from playwright.async_api import async_playwright
        async def probe():
            async with async_playwright() as pw:
                browser = await pw.chromium.launch(executable_path=BINARY, chromium_sandbox=True)
                try:
                    page = await browser.new_page(); await page.goto(self.url)
                    reference = await page.evaluate(READ_IDENTITY)
                finally: await browser.close()
            context = await launch_context_async(executable_path=BINARY, args=['--enable-automation'])
            try:
                page = await context.new_page(); await page.goto(self.url)
                observed = await page.evaluate(READ_IDENTITY)
                # Exclude server request details; compare the actual web identity.
                for key in ('platform', 'ua', 'hints'): self.assertEqual(observed[key], reference[key])
                cdp = await context.new_cdp_session(page)
                args = (await cdp.send('Browser.getBrowserCommandLine'))['arguments']
                profile_dir = pathlib.Path(next(value.split('=', 1)[1] for value in args if value.startswith('--user-data-dir=')))
                self.assertTrue(profile_dir.exists())
            finally: await context.close()
            self.assertFalse(profile_dir.exists())
            return dict(identity=observed, nativeIdentityPreserved=True, temporaryProfileRemoved=True, diagnosticFlag='--enable-automation')
        OBSERVATIONS[self._testMethodName] = asyncio.run(probe())

    def test_rejected_options_preserve_profile(self):
        with tempfile.TemporaryDirectory(prefix='python-custom-engine-') as directory:
            seed_file = pathlib.Path(directory) / '.custom-browser-seed'
            seed_file.write_text('corrupt-seed\n')
            for extra in (dict(platform='freebsd'), dict(seed='18446744073709551616'), dict(platform_version='12.3.4'), dict(args=['--no-sandbox'])):
                with self.assertRaises((ValueError, TypeError)):
                    launch_persistent_context(directory, executable_path=BINARY, **extra)
                self.assertEqual(seed_file.read_text(), 'corrupt-seed\n')
            with self.assertRaisesRegex(ValueError, 'Corrupt persistent seed'):
                launch_persistent_context(directory, executable_path=BINARY)
            self.assertEqual(seed_file.read_text(), 'corrupt-seed\n')
        OBSERVATIONS[self._testMethodName] = dict(rejectedOptions=4, corruptSeedPreserved=True)

class EvidenceResult(unittest.TextTestResult):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs); self.records = []
    def addSuccess(self, test):
        super().addSuccess(test); self.records.append(dict(name=test._testMethodName, status='passed', observed=OBSERVATIONS.get(test._testMethodName)))
    def addFailure(self, test, error):
        super().addFailure(test, error); self.records.append(dict(name=test._testMethodName, status='failed', error=str(error[1])))
    def addError(self, test, error):
        super().addError(test, error); self.records.append(dict(name=test.id(), status='failed', error=str(error[1])))

if __name__ == '__main__':
    if not BINARY: raise SystemExit('CUSTOM_BROWSER_EXECUTABLE is required; no qualification report generated')
    result = unittest.TextTestRunner(verbosity=2, resultclass=EvidenceResult).run(unittest.defaultTestLoader.loadTestsFromTestCase(CustomEngine))
    binary = pathlib.Path(BINARY)
    evidence = dict(iteration=2, engineMode='custom', binarySha256=hashlib.sha256(binary.read_bytes()).hexdigest(), runtimeSha256=hashlib.sha256(binary.with_name('chrome.dll').read_bytes()).hexdigest(), python=platform.python_version(), playwright=importlib.metadata.version('playwright'), results=result.records, passed=len(result.records)-len(result.failures)-len(result.errors), failed=len(result.failures)+len(result.errors), scope='Python sync/async option mapping, native identity, persistent seeds/storage and temporary cleanup on the custom Windows binary.')
    REPORT.parent.mkdir(parents=True, exist_ok=True); REPORT.write_text(json.dumps(evidence, indent=2)+'\n')
    raise SystemExit(0 if result.wasSuccessful() else 1)
