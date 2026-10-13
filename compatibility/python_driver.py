"""Local driver compatibility probe; emits evidence rather than stealth claims."""
import argparse
import json
import pathlib
import tempfile
import time
from importlib.metadata import version

from custom_browser import launch_context, _options, _handshake

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--driver',choices=['playwright-python','selenium'],required=True)
    parser.add_argument('--executable',required=True)
    parser.add_argument('--engine-mode',choices=['baseline','custom'],required=True)
    parser.add_argument('--url',required=True)
    parser.add_argument('--headed',action='store_true')
    args=parser.parse_args()
    settings={'executable_path':args.executable,'engine_mode':args.engine_mode,'headless':not args.headed}
    if args.driver=='playwright-python':
        context=launch_context(**settings)
        try:
            page=context.new_page()
            page.goto(args.url)
            page.locator('#value').fill('compatibility')
            page.locator('#submit').click()
            assert page.locator('#result').inner_text()=='compatibility'
            assert page.frames[1].locator('#frame-value').inner_text()=='frame-ready'
            page.evaluate("localStorage.setItem('driver-fixture','retained')")
            page.reload()
            assert page.evaluate("localStorage.getItem('driver-fixture')")=='retained'
            observed=page.evaluate('window.observe()')
            cdp=context.new_cdp_session(page)
            observed['cdp']=cdp.send('Browser.getVersion');cdp.detach()
            observed['libraryVersion']=version('playwright')
        finally:context.close()
    else:
        from selenium import webdriver
        from selenium.webdriver.common.by import By
        from selenium.webdriver.chrome.service import Service
        from selenium.webdriver.support.ui import WebDriverWait
        launch_options=_options(**settings)
        _handshake(launch_options,args.engine_mode)
        with tempfile.TemporaryDirectory(prefix='custom-browser-selenium-') as profile:
            options=webdriver.ChromeOptions()
            options.binary_location=launch_options['executable_path']
            for flag in launch_options['args']:options.add_argument(flag)
            if not args.headed:options.add_argument('--headless=new')
            options.add_argument(f'--user-data-dir={profile}')
            options.add_argument('--no-first-run')
            driver=webdriver.Chrome(options=options,service=Service())
            try:
                driver.get(args.url)
                driver.find_element(By.ID,'value').send_keys('compatibility')
                driver.find_element(By.ID,'submit').click()
                WebDriverWait(driver,10).until(lambda d:d.find_element(By.ID,'result').text=='compatibility')
                driver.switch_to.frame(driver.find_element(By.TAG_NAME,'iframe'))
                assert driver.find_element(By.ID,'frame-value').text=='frame-ready'
                driver.switch_to.default_content()
                driver.execute_script("localStorage.setItem('driver-fixture','retained')")
                driver.refresh()
                assert driver.execute_script("return localStorage.getItem('driver-fixture')")=='retained'
                observed=driver.execute_script('return window.observe()')
                observed['version']=driver.capabilities['browserVersion']
                observed['libraryVersion']=version('selenium')
                observed['chromeDriverVersion']=driver.capabilities.get('chrome',{}).get('chromedriverVersion')
                observed['cdp']=driver.execute_cdp_cmd('Browser.getVersion',{})
            finally:driver.quit()
    print(json.dumps({'status':'passed','driver':args.driver,'headed':args.headed,'observed':observed}))

if __name__=='__main__':main()
