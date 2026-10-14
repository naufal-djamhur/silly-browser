"""Measure reviewed reference examples on an actual custom binary.

Reference launch/download code is not executed. Only hash-checked, reviewed
measurement functions are reused; missing data never establishes a pass.
Raw evidence stays in the ignored artifacts directory.
"""
import argparse
import ast
import contextlib
import hashlib
import io
import json
import pathlib
import re
import subprocess
import time
import traceback
from importlib.metadata import version

from custom_browser import launch

REFERENCE_COMMIT = 'fbf005bc199920b592df17ac4d489324e29d56d8'
EXPECTED_BLOBS = {
    'basic.py': '951d581ebd2606a60b0510ebae52fddd491f6f17',
    'fingerprint_scan_test.py': '472dc99b9faa3cb8f4f006f56b45ee83d75573d8',
    'recaptcha_score.py': '50202e13a80c22c981c77a5f1bbba1a59f53957b',
    'stealth_test.py': 'bf9d26ed631c4b71e3131d2a00945c7f268f776c',
}


def verified_source(directory, filename):
    raw = (directory / filename).read_bytes()
    # Windows Git checkouts use CRLF; compare the canonical LF Git blob.
    raw = raw.replace(b'\r\n', b'\n')
    actual = hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()
    if actual != EXPECTED_BLOBS[filename]:
        raise ValueError(f'Reference source hash mismatch: {filename}')
    return raw.decode('utf-8')


def reviewed_functions(source, include_tests=False):
    parsed = ast.parse(source)
    nodes = [node for node in parsed.body if isinstance(node, ast.FunctionDef) and node.name.startswith('test_')]
    if include_tests:
        nodes += [node for node in parsed.body if isinstance(node, ast.Assign)
                  and any(isinstance(target, ast.Name) and target.id == 'TESTS' for target in node.targets)]
    namespace = {'time': time}
    exec(compile(ast.Module(body=nodes, type_ignores=[]), '<reviewed-reference-functions>', 'exec'), namespace)
    return namespace


def checked_status(name, data, reference_pass=None):
    if name == 'sannysoft':
        if not data.get('total', 0):
            return 'unavailable'
        return 'fail' if data.get('failed') else 'pass'
    if name == 'incolumitas':
        if data.get('total', 0) < 30:
            return 'unavailable'
        # The upstream criterion excludes WEBDRIVER and connectionRTT.
        return 'pass' if reference_pass else 'fail'
    if name == 'rebrowser':
        if data.get('error') or not data.get('total', 0):
            return 'unavailable'
        if data.get('totalFails', 0):
            return 'fail'
        return 'inconclusive' if data.get('notTriggered', 0) else 'pass'
    if name == 'deviceandbrowserinfo':
        if not isinstance(data.get('isBot'), bool):
            return 'unavailable'
        return 'pass' if reference_pass else 'fail'
    if name == 'browserscan':
        # Raw Normal/Abnormal word counts alone do not validate this site's verdict.
        return 'captured-unqualified'
    if name == 'creepjs-noise-off':
        # The historical custom binary has no qualified fingerprint-noise switch.
        return 'unsupported-reference-option'
    return 'unavailable'


class CapturePage:
    def __init__(self, page, output, prefix):
        self.page, self.output, self.prefix = page, output, prefix

    def __getattr__(self, name):
        return getattr(self.page, name)

    def screenshot(self, **kwargs):
        if kwargs.get('path'):
            kwargs['path'] = str(self.output / f'{self.prefix}-reference-{pathlib.Path(kwargs["path"]).name}')
        return self.page.screenshot(**kwargs)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--executable', required=True)
    parser.add_argument('--reference-dir', type=pathlib.Path, required=True)
    parser.add_argument('--output', type=pathlib.Path, required=True)
    parser.add_argument('--headed', action='store_true')
    parser.add_argument('--only', choices=['all', 'recaptcha'], default='all')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    sources = {filename: verified_source(args.reference_dir, filename) for filename in EXPECTED_BLOBS}
    fingerprint = reviewed_functions(sources['fingerprint_scan_test.py'])
    stealth = reviewed_functions(sources['stealth_test.py'], include_tests=True)
    executable = pathlib.Path(args.executable).resolve()
    info = json.loads(subprocess.check_output([str(executable), '--headless', '--custom-browser-engine-info'], timeout=10, text=True))
    assert info['engine'] == 'custom-browser' and info['policyVersion'] == 1
    report = dict(schemaVersion=1, referenceCommit=REFERENCE_COMMIT, referenceBlobs=EXPECTED_BLOBS,
                  engineMode='custom', engineInfo=info, headless=not args.headed, selection=args.only,
                  startedAt=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                  executableSha256=hashlib.sha256(executable.read_bytes()).hexdigest(),
                  runtimeSha256=hashlib.sha256(executable.with_name('chrome.dll').read_bytes()).hexdigest(),
                  libraries={'playwright': version('playwright')},
                  conditions={'humanize': False, 'proxyConfigured': False, 'viewport': {'width': 1920, 'height': 1080},
                              'profileMode': 'fresh-incognito-context-per-case', 'launch': 'custom_browser.launch'},
                  adaptations=['Own custom binary instead of CloakBrowser download/launch',
                               'Only reviewed reference function definitions and TESTS criteria loaded',
                               'Capture paths redirected to this run directory',
                               'Missing/incomplete data excluded from passes',
                               'Unsupported CloakBrowser-specific noise/GeoIP/identity flags are not passed'],
                  results=[])

    def save():
        (args.output / 'results.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')

    browser = launch(executable_path=str(executable), headless=not args.headed)
    report['browserVersion'] = browser.version
    save()

    def record(example, name, operation):
        context = browser.new_context(viewport={'width':1920, 'height':1080})
        page = context.new_page()
        captured = CapturePage(page, args.output, name)
        result = dict(example=example, name=name, status='error')
        started = time.monotonic()
        stream = io.StringIO()
        try:
            with contextlib.redirect_stdout(stream):
                result.update(operation(captured))
        except Exception as error:
            result.update(error=str(error), traceback=traceback.format_exc())
        finally:
            (args.output / f'{name}.log').write_text(stream.getvalue(), encoding='utf-8')
            try:
                text = page.inner_text('body', timeout=5000)
                (args.output / f'{name}.txt').write_text(text, encoding='utf-8')
                (args.output / f'{name}.html').write_text(page.content(), encoding='utf-8')
                page.screenshot(path=str(args.output / f'{name}.png'), timeout=10000)
            except Exception as error:
                result['captureError'] = str(error)
            context.close()
            result['elapsedSeconds'] = round(time.monotonic() - started, 3)
            report['results'].append(result)
            save()
            print(f'{name}: {result["status"]}' + (f' ({result["score"]})' if result.get('score') is not None else ''), flush=True)

    try:
        def basic(page):
            page.goto('https://example.com', timeout=30000)
            title = page.title()
            return {'status': 'pass' if title == 'Example Domain' else 'fail', 'title': title, 'url': page.url}
        if args.only == 'all':
            record('basic.py', 'basic', basic)

        def scan(page):
            raw = fingerprint['test_fingerprint_scan'](page)
            text = page.inner_text('body')
            match = re.search(r'Bot\s+(?:risk\s+)?score\s*(\d{1,3})\s*/\s*100', text, re.I)
            score = int(match.group(1)) if match and not re.search(r'Not collected|collecting…', text) else None
            if score is not None and not 0 <= score <= 100:
                score = None
            return {'status': 'unavailable' if score is None else 'pass' if score < 10 else 'fail',
                    'score': score, 'requiredScore': '<10', 'referenceObservation': raw}
        if args.only == 'all':
            record('fingerprint_scan_test.py', 'fingerprint-scan', scan)

        def creep(page):
            raw = fingerprint['test_creepjs'](page)
            headless, stealth_pct = raw.get('headlessPct'), raw.get('stealthPct')
            status = 'unavailable' if headless is None or stealth_pct is None else 'pass' if headless <= 30 and stealth_pct <= 30 else 'fail'
            return {'status': status, 'referenceObservation': raw, 'criteria': 'reference <=30% headless and <=30% stealth'}
        if args.only == 'all':
            record('fingerprint_scan_test.py', 'creepjs-headless', creep)

        def recaptcha(page):
            responses = []
            def response_received(response):
                if response.url.split('?')[0] != 'https://recaptcha-demo.appspot.com/recaptcha-v3-verify.php':
                    return
                try:
                    body = response.json()
                    responses.append({key:body.get(key) for key in ('success','score','action','hostname')})
                except Exception:
                    pass
            wait_error = None
            try:
                # Consume the complete verification response before classifying it.
                # A response callback can otherwise append after classification.
                with page.expect_response(lambda response: response.url.split('?')[0] ==
                                          'https://recaptcha-demo.appspot.com/recaptcha-v3-verify.php', timeout=20000) as verification:
                    page.goto('https://recaptcha-demo.appspot.com/recaptcha-v3-request-scores.php', timeout=30000)
                    page.wait_for_function("() => document.body.innerText.includes('Received response from our backend')", timeout=20000)
                response_received(verification.value)
            except Exception as error:
                wait_error = str(error)
            valid = next((item for item in responses if item.get('success') is True and item.get('action') == 'examples/v3scores'
                          and isinstance(item.get('score'), (int,float)) and not isinstance(item['score'], bool) and 0 <= item['score'] <= 1), None)
            score = valid['score'] if valid else None
            return {'status': 'unavailable' if score is None else 'pass' if score >= 0.9 else 'fail', 'score': score,
                    'criteria': 'reference expected score >=0.9; demo-only observation', 'verifiedResponses':responses, 'waitError':wait_error}
        record('recaptcha_score.py', 'recaptcha-v3', recaptcha)

        names = ['sannysoft','incolumitas','rebrowser','deviceandbrowserinfo','browserscan','creepjs-noise-off']
        for name, test in (zip(names, stealth['TESTS'], strict=True) if args.only == 'all' else []):
            def operation(page, name=name, test=test):
                raw = test['runner'](page)
                reference_pass = bool(test['pass'](raw))
                return {'status':checked_status(name, raw, reference_pass), 'referenceReportedPass':reference_pass,
                        'referenceObservation':raw, 'unsupportedReferenceFlags':test.get('args', []),
                        'criteriaNote':'Reference comparison retained; availability and triggered coverage checked separately'}
            record('stealth_test.py', name, operation)
    finally:
        browser.close()
        report['completedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        report['totals'] = {status:sum(result['status'] == status for result in report['results'])
                            for status in sorted({item['status'] for item in report['results']})}
        report['allRequestedExamplesPass'] = len(report['results']) == 10 and all(item['status'] == 'pass' for item in report['results'])
        save()
    expected = 10 if args.only == 'all' else 1
    return 0 if len(report['results']) == expected and all(item['status'] == 'pass' for item in report['results']) else 1


if __name__ == '__main__':
    raise SystemExit(main())
