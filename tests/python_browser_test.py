import asyncio
import os
import pathlib
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from custom_browser import launch_context, launch_context_async, launch_persistent_context, _proxy

class Fixture(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200);self.send_header('Content-Type','text/html');self.end_headers()
        self.wfile.write(b'<input id="field"><button id="go" disabled>Go</button><div id="result"></div><script>setTimeout(()=>go.disabled=false,200);go.onclick=()=>result.textContent=field.value</script>')
    def log_message(self,*args):pass

class BrowserTests(unittest.TestCase):
    def setUp(self):
        self.server=ThreadingHTTPServer(('127.0.0.1',0),Fixture)
        self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()
        self.url=f'http://127.0.0.1:{self.server.server_port}'
        self.options=dict(executable_path=os.environ['TEST_CHROMIUM_EXECUTABLE'],engine_mode='baseline',humanize=True,human_config={'duration_ms':16,'typing_delay_ms':1})
    def tearDown(self):self.server.shutdown();self.server.server_close();self.thread.join()
    def test_sync_input_and_profile(self):
        context=launch_context(**self.options)
        try:
            page=context.new_page();page.goto(self.url)
            page.human_type(page.locator('#field'),'Python')
            page.human_click(page.locator('#go'))
            self.assertEqual(page.locator('#result').inner_text(),'Python')
        finally:context.close()
        with tempfile.TemporaryDirectory() as directory:
            context=launch_persistent_context(directory,**self.options)
            page=context.new_page();page.goto(self.url);page.evaluate("localStorage.setItem('saved','yes')")
            context.close()
            seed=(pathlib.Path(directory)/'.custom-browser-seed').read_text()
            context=launch_persistent_context(directory,**self.options)
            try:
                page=context.new_page();page.goto(self.url)
                self.assertEqual(page.evaluate("localStorage.getItem('saved')"),'yes')
                self.assertEqual((pathlib.Path(directory)/'.custom-browser-seed').read_text(),seed)
            finally:context.close()
    def test_async_input(self):
        async def run():
            context=await launch_context_async(**self.options)
            try:
                page=await context.new_page();await page.goto(self.url)
                await page.human_type(page.locator('#field'),'Async')
                await page.human_click(page.locator('#go'))
                self.assertEqual(await page.locator('#result').inner_text(),'Async')
            finally:await context.close()
        asyncio.run(run())
    def test_proxy(self):
        self.assertEqual(_proxy('http://name:p%40ss@[::1]:8080')['password'],'p@ss')
        with self.assertRaises(NotImplementedError):_proxy('socks5://name:password@localhost:1080')

if __name__=='__main__':unittest.main()
