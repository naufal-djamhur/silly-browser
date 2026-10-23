"""Record two public diagnostic pages under common launch conditions.

This measures rendered classifications and API observations. It does not
change browser properties, run CAPTCHA workflows or infer native patch sites.
Reference measurement functions are hash checked before being reused.
"""
import argparse
import contextlib
import hashlib
import io
import json
from pathlib import Path
import re
import time
from importlib.metadata import version
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright
from reference_measurements import CapturePage, reviewed_functions, verified_source


def digest(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def scan_details(text):
    match = re.search(r'Bot\s+(?:risk\s+)?score\s*(\d{1,3})\s*/\s*100', text, re.I)
    collected = bool(re.search(r'Fingerprint collected successfully', text, re.I))
    score = int(match.group(1)) if match and collected else None
    if score is not None and not 0 <= score <= 100:
        score = None
    labels = ['Webdriver', 'Webdriver Writable', 'Iframe Overridden',
              'Selenium Properties', 'CDP Stack Check', 'Playwright Flags',
              'Chrome Driver Flags', 'CDP Check']
    checks = {}
    for label in labels:
        values = re.findall(r'^' + re.escape(label) + r'\s*\n\s*(true|false)\s*$', text, re.M | re.I)
        if values:
            checks[label] = list(dict.fromkeys(v.lower() == 'true' for v in values))
    categories = [{
        'category': match.group(1), 'level': match.group(2).upper(),
        'renderedPoints': int(match.group(3)) if match.group(3) else None,
    } for match in re.finditer(
        r'\b(Hardware\s*/\s*OS|Browser|Network\s*/\s*proxy):\s*(LOW|MEDIUM|HIGH)(?:\s*\+(\d+))?', text, re.I)]
    return {'score': score, 'collected': collected, 'categories': categories,
            'reportedChecks': checks,
            'status': 'unavailable' if score is None else 'pass' if score < 10 else 'fail'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--engines', type=Path, required=True,
                        help='Private JSON list: id, executable, version, exeSha256, dllSha256')
    parser.add_argument('--reference-dir', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    engines = json.loads(args.engines.read_text(encoding='utf-8-sig'))
    assert engines and len({x['id'] for x in engines}) == len(engines)
    assert all(re.fullmatch('[a-z0-9-]+', x['id']) for x in engines)
    functions = reviewed_functions(verified_source(args.reference_dir, 'fingerprint_scan_test.py'))
    # Validate every runtime before visiting any page.
    for engine in engines:
        path = Path(engine['executable']).resolve()
        assert digest(path) == engine['exeSha256'], engine['id']
        assert digest(path.with_name('chrome.dll')) == engine['dllSha256'], engine['id']
    args.output.mkdir(parents=True, exist_ok=False)
    report = {'schemaVersion': 1, 'startedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),
              'scope': 'Rendered diagnostic observations under common raw Playwright launch; no concealment or CAPTCHA workflow',
              'playwrightVersion': version('playwright'),
              'conditions': {'viewport': {'width':1920,'height':1080}, 'deviceScaleFactor':1,
                             'profile':'fresh isolated context per site', 'proxy':False,
                             'humanize':False, 'nativeOverrides':False, 'sdkLaunchDefaultsApplied':False},
              'engines': [{k:v for k,v in engine.items() if k != 'executable'} for engine in engines],
              'observations': [], 'browserEvents': [], 'completed':False}
    def save():
        (args.output/'results.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
    save()
    with sync_playwright() as playwright:
        for engine in engines:
            path = Path(engine['executable']).resolve()
            for headless in [False, True]:
                mode = 'headless' if headless else 'headed'
                print(f"Launching {engine['id']} {mode}",flush=True)
                browser = playwright.chromium.launch(executable_path=str(path),headless=headless,chromium_sandbox=True)
                closing = False
                browser.on('disconnected', lambda _, eid=engine['id'], m=mode:
                    report['browserEvents'].append({'engine':eid,'mode':m,'event':'disconnected','expectedClose':closing}))
                try:
                    assert browser.version == engine['version'], (engine['id'],browser.version)
                    for site, function_name in [('fingerprint-scan','test_fingerprint_scan'),('creepjs','test_creepjs')]:
                        name = f"{engine['id']}-{mode}-{site}"
                        context = browser.new_context(viewport={'width':1920,'height':1080},device_scale_factor=1)
                        page = context.new_page()
                        result = {'engine':engine['id'],'mode':mode,'site':site,
                                  'browserVersion':browser.version,'status':'error','diagnostics':[]}
                        def observe(kind,detail):
                            if len(result['diagnostics']) < 64:
                                result['diagnostics'].append({'event':kind,'detail':detail})
                        page.on('crash', lambda _: observe('page-crash',None))
                        page.on('pageerror', lambda error: observe('page-error',str(error)[:2000]))
                        def failed(request):
                            if request.is_navigation_request():
                                url = urlsplit(request.url)
                                observe('navigation-request-failed',{'url':f'{url.scheme}://{url.netloc}{url.path}','failure':request.failure})
                        page.on('requestfailed',failed)
                        started = time.monotonic()
                        stream = io.StringIO()
                        try:
                            with contextlib.redirect_stdout(stream):
                                observation = functions[function_name](CapturePage(page,args.output,name))
                            result['referenceObservation'] = observation
                            text = page.inner_text('body',timeout=5000)
                            if site == 'fingerprint-scan':
                                result.update(scan_details(text))
                                # Capture the site's documented public result after
                                # measurement. Raw identifiers remain private.
                                public_result = page.evaluate('() => window.FINGERPRINT_SCAN ?? null')
                                result['publicInterfaceAvailable'] = isinstance(public_result, dict)
                                (args.output/f'{name}-public.json').write_text(
                                    json.dumps(public_result,indent=2)+'\n',encoding='utf8')
                            else:
                                fields = [observation.get('headlessPct'),observation.get('stealthPct')]
                                result['status'] = 'unavailable' if any(x is None for x in fields) else 'pass' if all(x<=30 for x in fields) else 'fail'
                            # Values only, collected after the page's measurement completes.
                            result['environment'] = page.evaluate('''() => ({
                              language:navigator.language, timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
                              screen:{width:screen.width,height:screen.height,availWidth:screen.availWidth,availHeight:screen.availHeight},
                              viewport:{width:innerWidth,height:innerHeight},webdriver:navigator.webdriver,
                              contentIndex:typeof ContentIndex,contacts:'contacts' in navigator,
                              downlinkMax:'downlinkMax' in (navigator.connection||{}),
                              lightColor:matchMedia('(prefers-color-scheme: light)').matches,
                              userAgent:navigator.userAgent
                            })''')
                            (args.output/f'{name}.txt').write_text(text,encoding='utf8')
                            (args.output/f'{name}.html').write_text(page.content(),encoding='utf8')
                        except Exception as error:
                            result['error'] = str(error)
                        finally:
                            (args.output/f'{name}.log').write_text(stream.getvalue(),encoding='utf8')
                            context.close()
                            result['elapsedSeconds'] = round(time.monotonic()-started,3)
                            report['observations'].append(result)
                            save()
                            print(f"{name}: {result['status']} " +
                                  (str(result.get('score')) if site=='fingerprint-scan' else
                                   str({k:result.get('referenceObservation',{}).get(k) for k in ['likeHeadlessPct','headlessPct','stealthPct']})),flush=True)
                finally:
                    closing = True
                    browser.close()
                    save()
            engine_report = next(x for x in report['engines'] if x['id']==engine['id'])
            engine_report['runtimeUnchanged'] = digest(path)==engine['exeSha256'] and digest(path.with_name('chrome.dll'))==engine['dllSha256']
            assert engine_report['runtimeUnchanged'],engine['id']
    report['completed'] = True
    report['completedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
    report['counts'] = {status:sum(x['status']==status for x in report['observations'])
                        for status in ['pass','fail','unavailable','error']}
    save()
    # A measured detector failure is a result, not a harness execution failure.
    return 1 if report['counts']['error'] or report['counts']['unavailable'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
