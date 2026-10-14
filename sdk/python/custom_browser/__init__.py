"""Custom Chromium SDK. Baseline mode never claims engine fingerprint patches."""
import json
import os
import pathlib
import secrets
import subprocess
import tempfile
import shutil
from urllib.parse import urlsplit, unquote
from .humanize import humanize as _humanize, _config as _human_config

def _proxy(value):
    if not value:
        return None
    if isinstance(value, dict):
        parsed = _proxy(value['server'])
        parsed.update({k:v for k,v in value.items() if k != 'server'})
        if parsed['server'].startswith('socks5:') and (parsed.get('username') or parsed.get('password')):
            raise NotImplementedError('Native authenticated SOCKS5 engine patch is not implemented yet')
        return parsed
    url = urlsplit(value)
    if url.scheme not in ('http','https','socks5') or not url.hostname or not url.port or url.path not in ('','/') or url.query or url.fragment:
        raise ValueError('Proxy requires a supported scheme, host, and port')
    username, password = unquote(url.username or ''), unquote(url.password or '')
    if url.scheme == 'socks5' and (username or password):
        raise NotImplementedError('Native authenticated SOCKS5 engine patch is not implemented yet')
    hostname=f'[{url.hostname}]' if ':' in url.hostname else url.hostname
    result={'server':f'{url.scheme}://{hostname}:{url.port}'}
    if username:result['username']=username
    if password:result['password']=password
    return result

def _options(executable_path=None, engine_mode='custom', headless=True, proxy=None, platform='native', platform_version=None, webrtc_policy='native', extension_paths=None, seed=None, args=None, geoip=False, **kwargs):
    if kwargs:raise TypeError(f'Unknown options: {", ".join(kwargs)}')
    if not executable_path:raise ValueError('An explicit executable_path is required')
    if engine_mode not in ('custom','baseline'):raise ValueError('Invalid engine_mode')
    if platform not in ('native','windows','linux','macos'):raise ValueError('Unsupported platform')
    if webrtc_policy not in ('native','default','default_public_interface_only','default_public_and_private_interfaces','disable_non_proxied_udp'):raise ValueError('Unsupported webrtc_policy')
    if engine_mode=='baseline' and webrtc_policy!='native':raise ValueError('WebRTC policy requires our compiled custom engine')
    if engine_mode=='baseline' and platform!='native':raise ValueError('Platform identity requires our compiled custom engine')
    if geoip:raise NotImplementedError('GeoIP is not implemented yet')
    if platform_version is not None:
        import re
        if platform=='native' or not isinstance(platform_version,str) or len(platform_version)>32 or not re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+',platform_version):raise ValueError('platform_version requires a preset and major.minor.patch')
    launch_args=list(args or [])
    if not all(isinstance(a,str) for a in launch_args):raise TypeError('args must be strings')
    if any(a.split('=')[0] in ('--no-sandbox','--disable-setuid-sandbox','--custom-browser-seed','--custom-browser-platform','--custom-browser-platform-version','--custom-browser-webrtc-policy','--user-data-dir') for a in launch_args):
        raise ValueError('Sandbox and profile lifecycle flags cannot be overridden')
    if seed is not None:
        value=str(seed)
        if not value.isascii() or not value.isdecimal() or not 0 <= int(value) < 2**64:raise ValueError('seed must be uint64 decimal')
        if engine_mode == 'custom':launch_args.append(f'--custom-browser-seed={value}')
    if platform!='native':launch_args.append(f'--custom-browser-platform={platform}')
    if platform_version is not None:launch_args.append(f'--custom-browser-platform-version={platform_version}')
    if webrtc_policy!='native':launch_args.append(f'--custom-browser-webrtc-policy={webrtc_policy}')
    paths=extension_paths or []
    if not isinstance(paths,list) or any(not isinstance(p,str) or ',' in p for p in paths):raise TypeError('Invalid extension_paths')
    if paths:
        joined=','.join(str(pathlib.Path(p).resolve()) for p in paths)
        launch_args.extend([f'--load-extension={joined}',f'--disable-extensions-except={joined}'])
    result={'executable_path':str(pathlib.Path(executable_path).resolve()),'headless':headless,'chromium_sandbox':True,'args':launch_args}
    if paths:result['ignore_default_args']=['--disable-extensions']
    if proxy:result['proxy']=_proxy(proxy)
    return result

def _handshake(options,mode):
    if mode=='baseline':return
    result=subprocess.run([options['executable_path'],'--headless','--custom-browser-engine-info'],capture_output=True,text=True,timeout=10,check=True)
    info=json.loads(result.stdout.strip())
    if info.get('engine')!='custom-browser' or info.get('policyVersion')!=1:raise RuntimeError('Custom engine handshake failed')
    if any(a.startswith('--custom-browser-platform=') for a in options['args']) and info.get('sourcePatchCount',0)<2:raise RuntimeError('Compiled engine does not support platform identity')
    if any(a.startswith('--custom-browser-webrtc-policy=') for a in options['args']) and 'webrtc-policy' not in info.get('capabilities',[]):raise RuntimeError('Compiled engine does not support the native WebRTC policy patch')

def _seed(directory,explicit):
    directory.mkdir(parents=True,exist_ok=True)
    if explicit is not None:return str(explicit)
    file=directory/'.custom-browser-seed'
    if file.exists():
        value=file.read_text().strip()
        if not value.isascii() or not value.isdecimal() or not 0 <= int(value) < 2**64:raise ValueError('Corrupt persistent seed; repair explicitly')
        return value
    fd,temporary=tempfile.mkstemp(prefix='.custom-browser-seed.',suffix='.tmp',dir=directory)
    temporary=pathlib.Path(temporary)
    try:
        with os.fdopen(fd,'w') as handle:
            handle.write(str(secrets.randbits(64))+'\n')
            handle.flush();os.fsync(handle.fileno())
        try:os.link(temporary,file)
        except FileExistsError:pass
        except OSError as error:raise RuntimeError('Profile filesystem must support atomic hard-link seed publication') from error
    finally:temporary.unlink(missing_ok=True)
    return _seed(directory,None)

def launch(**kwargs):
    from playwright.sync_api import sync_playwright
    humanize=kwargs.pop('humanize',False)
    human_config=kwargs.pop('human_config',None)
    if humanize:_human_config(human_config or {})
    if kwargs.get('extension_paths'):raise ValueError('Extensions require launch_context or launch_persistent_context')
    options=_options(**kwargs);_handshake(options,kwargs.get('engine_mode','custom'))
    pw=sync_playwright().start()
    try:browser=pw.chromium.launch(**options)
    except BaseException:pw.stop();raise
    close=browser.close
    def owned_close(*a,**k):
        try:return close(*a,**k)
        finally:pw.stop()
    browser.close=owned_close
    if humanize:_humanize(browser,human_config)
    return browser

def launch_persistent_context(user_data_dir,**kwargs):
    from playwright.sync_api import sync_playwright
    humanize=kwargs.pop('humanize',False);human_config=kwargs.pop('human_config',None)
    if humanize:_human_config(human_config or {})
    locale=kwargs.pop('locale',None);timezone=kwargs.pop('timezone',None)
    _options(**kwargs)
    directory=pathlib.Path(user_data_dir).resolve()
    kwargs['seed']=_seed(directory,kwargs.get('seed'))
    options=_options(**kwargs);_handshake(options,kwargs.get('engine_mode','custom'))
    if locale:options['locale']=locale
    if timezone:options['timezone_id']=timezone
    options['no_viewport']=True
    pw=sync_playwright().start()
    try:context=pw.chromium.launch_persistent_context(str(directory),**options)
    except BaseException:pw.stop();raise
    close=context.close
    def owned_close(*a,**k):
        try:return close(*a,**k)
        finally:pw.stop()
    context.close=owned_close
    if humanize:_humanize(context,human_config)
    return context

def launch_context(**kwargs):
    directory=tempfile.mkdtemp(prefix='custom-browser-')
    try:context=launch_persistent_context(directory,**kwargs)
    except BaseException:shutil.rmtree(directory);raise
    close=context.close
    def owned_close(*a,**k):
        try:return close(*a,**k)
        finally:shutil.rmtree(directory)
    context.close=owned_close
    return context

async def launch_async(**kwargs):
    from playwright.async_api import async_playwright
    import asyncio
    humanize=kwargs.pop('humanize',False);human_config=kwargs.pop('human_config',None)
    if humanize:_human_config(human_config or {})
    if kwargs.get('extension_paths'):raise ValueError('Extensions require a profile context')
    options=_options(**kwargs)
    await asyncio.to_thread(_handshake,options,kwargs.get('engine_mode','custom'))
    pw=await async_playwright().start()
    try:browser=await pw.chromium.launch(**options)
    except BaseException:await pw.stop();raise
    close=browser.close
    async def owned_close(*a,**k):
        try:return await close(*a,**k)
        finally:await pw.stop()
    browser.close=owned_close
    if humanize:_humanize(browser,human_config)
    return browser

async def launch_persistent_context_async(user_data_dir,**kwargs):
    from playwright.async_api import async_playwright
    import asyncio
    humanize=kwargs.pop('humanize',False);human_config=kwargs.pop('human_config',None)
    if humanize:_human_config(human_config or {})
    locale=kwargs.pop('locale',None);timezone=kwargs.pop('timezone',None)
    _options(**kwargs)
    directory=pathlib.Path(user_data_dir).resolve()
    kwargs['seed']=await asyncio.to_thread(_seed,directory,kwargs.get('seed'))
    options=_options(**kwargs)
    await asyncio.to_thread(_handshake,options,kwargs.get('engine_mode','custom'))
    if locale:options['locale']=locale
    if timezone:options['timezone_id']=timezone
    options['no_viewport']=True
    pw=await async_playwright().start()
    try:context=await pw.chromium.launch_persistent_context(str(directory),**options)
    except BaseException:await pw.stop();raise
    close=context.close
    async def owned_close(*a,**k):
        try:return await close(*a,**k)
        finally:await pw.stop()
    context.close=owned_close
    if humanize:_humanize(context,human_config)
    return context

async def launch_context_async(**kwargs):
    directory=tempfile.mkdtemp(prefix='custom-browser-')
    try:context=await launch_persistent_context_async(directory,**kwargs)
    except BaseException:shutil.rmtree(directory);raise
    close=context.close
    async def owned_close(*a,**k):
        try:return await close(*a,**k)
        finally:shutil.rmtree(directory)
    context.close=owned_close
    return context
