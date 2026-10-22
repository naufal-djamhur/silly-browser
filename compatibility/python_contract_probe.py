"""Own SDK probes with stubbed driver boundaries; never starts Chromium."""
import argparse
import asyncio
import hashlib
import json
import pathlib
import platform
import sys
import tempfile
from types import SimpleNamespace
from unittest.mock import patch

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'sdk'/'python'))
import custom_browser as sdk

rows=[]
captured={}
base={'executable_path':'not-launched.exe','engine_mode':'baseline'}
def capture(*args,**kwargs):
    captured.clear();captured.update(kwargs)
    return SimpleNamespace(close=lambda:None)
pw=SimpleNamespace(chromium=SimpleNamespace(launch=capture,launch_persistent_context=capture),stop=lambda:None)
manager=SimpleNamespace(start=lambda:pw)
def rejected(action):
    try:action();return {'rejected':False}
    except Exception as error:return {'rejected':True,'errorType':type(error).__name__,'message':str(error)}
def observe(name,action):rows.append({'id':name,'observation':action(),'browserRuntimeValidated':False})

with patch('playwright.sync_api.sync_playwright',return_value=manager):
    observe('python-browser-locale',lambda:rejected(lambda:sdk.launch(**base,locale='fr-FR')))
    observe('python-browser-timezone',lambda:rejected(lambda:sdk.launch(**base,timezone='Europe/Paris')))
    with tempfile.TemporaryDirectory(prefix='silly-contract-') as directory:
        def persistent_config():
            context=sdk.launch_persistent_context(directory,**base,locale='fr-FR',timezone='Europe/Paris')
            assert captured['locale']=='fr-FR' and captured['timezone_id']=='Europe/Paris' and captured['no_viewport'] is True
            context.close()
            return {'localeForwarded':True,'timezoneForwarded':True,'noViewportAlwaysEnabled':True}
        observe('python-persistent-context-fields',persistent_config)
        def persistent_viewport():
            context=sdk.launch_persistent_context(directory,**base,viewport={'width':900,'height':700})
            assert captured['viewport']=={'width':900,'height':700} and 'no_viewport' not in captured
            context.close();return {'viewportForwarded':True,'noViewportForced':False}
        observe('python-persistent-viewport',persistent_viewport)
    observe('python-browser-extensions',lambda:rejected(lambda:sdk.launch(**base,extension_paths=['fixture-extension'])))

def credentials():
    options=sdk._options(**base,proxy='http://fixture-user:fixture-password@127.0.0.1:8080')
    assert '@' not in options['proxy']['server'] and options['proxy']['password']=='fixture-password'
    assert not any('fixture-password' in arg for arg in options['args'])
    return {'credentialsSeparatedFromServer':True,'credentialPresentInProcessArgs':False,'credentialsStillSensitiveInLaunchObject':True}
observe('python-http-credential-routing',credentials)
observe('python-authenticated-socks5',lambda:rejected(lambda:sdk._proxy('socks5://fixture-user:fixture-password@127.0.0.1:1080')))
observe('python-geoip',lambda:rejected(lambda:sdk._options(**base,geoip=True)))
def args_string():
    result=rejected(lambda:sdk._options(**base,args='--example'))
    assert result['rejected'];return {**result,'splitIntoCharacters':False}
observe('python-raw-args-string',args_string)
observe('python-context-options-passthrough',lambda:rejected(lambda:sdk._options(**base,context_options={'permissions':[]})))
observe('python-sandbox-policy',lambda:rejected(lambda:sdk._options(**base,args=['--no-sandbox'])))

async def async_capture(*args,**kwargs):
    captured.clear();captured.update(kwargs)
    async def close():pass
    return SimpleNamespace(close=close)
async def stop():pass
async def start():return SimpleNamespace(chromium=SimpleNamespace(launch=async_capture,launch_persistent_context=async_capture),stop=stop)
async def async_probes():
    with patch('playwright.async_api.async_playwright',return_value=SimpleNamespace(start=start)):
        try:
            await sdk.launch_async(**base,locale='fr-FR')
            observation={'rejected':False}
        except Exception as error:
            observation={'rejected':True,'errorType':type(error).__name__,'message':str(error)}
        rows.append({'id':'python-async-browser-locale','observation':observation,'browserRuntimeValidated':False})
        with tempfile.TemporaryDirectory(prefix='silly-contract-') as directory:
            context=await sdk.launch_persistent_context_async(directory,**base,locale='fr-FR',timezone='Europe/Paris')
            assert captured['locale']=='fr-FR' and captured['timezone_id']=='Europe/Paris' and captured['no_viewport'] is True
            await context.close()
            rows.append({'id':'python-async-persistent-context-fields','observation':{'localeForwarded':True,'timezoneForwarded':True,'noViewportAlwaysEnabled':True},'browserRuntimeValidated':False})
asyncio.run(async_probes())
report={'schemaVersion':1,'scope':'Own SDK validation and stubbed driver-boundary observations; no browser runtime, comparator execution, downloads or external traffic','runtime':platform.python_version(),'sources':{'sdk/python/custom_browser/__init__.py':hashlib.sha256((ROOT/'sdk/python/custom_browser/__init__.py').read_bytes()).hexdigest()},'observations':rows}
parser=argparse.ArgumentParser();parser.add_argument('--output',type=pathlib.Path);args=parser.parse_args()
if args.output:
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
