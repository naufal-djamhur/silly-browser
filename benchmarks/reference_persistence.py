"""Assert the reviewed CloakBrowser persistence workflow using our own SDK.

Uses separate fresh profiles, never the user's manual browser. The upstream
example prints restored values; this adaptation asserts them in both modes.
"""

import argparse
import hashlib
import json
import pathlib
import time
import traceback
from importlib.metadata import version

from custom_browser import launch_persistent_context


EXPECTED_BLOB = 'e8978d1b2a8ebc79b9ab9038adb96a877d05e553'


def sha256(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--executable', type=pathlib.Path, required=True)
    parser.add_argument('--reference-dir', type=pathlib.Path, required=True)
    parser.add_argument('--output', type=pathlib.Path, required=True)
    args = parser.parse_args()
    source = (args.reference_dir / 'persistent_context.py').read_bytes().replace(b'\r\n', b'\n')
    blob = hashlib.sha1(b'blob ' + str(len(source)).encode() + b'\0' + source).hexdigest()
    if blob != EXPECTED_BLOB:
        raise ValueError('Reference source hash mismatch: persistent_context.py')
    args.output.mkdir(parents=True, exist_ok=False)
    executable = args.executable.resolve()
    report = {
        'schemaVersion': 1,
        'startedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'example': 'persistent_context.py',
        'referenceBlob': blob,
        'executableSha256': sha256(executable),
        'runtimeSha256': sha256(executable.with_name('chrome.dll')),
        'libraries': {'playwright': version('playwright')},
        'adaptations': [
            'Own SDK launch and explicit local executable; no reference launch/download code executed',
            'Fresh owned profile per display mode; two independent launches per profile',
            'Assert restored values instead of only printing them',
            'No proxy, identity overrides, humanize, or detector tuning',
        ],
        'results': [],
    }

    def save():
        (args.output / 'results.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')

    save()
    for headless in (False, True):
        mode = 'headless' if headless else 'headed'
        profile = args.output / f'{mode}-profile'
        result = {'mode': mode, 'status': 'error', 'sessions': []}
        try:
            for session in (1, 2):
                context = launch_persistent_context(
                    profile, executable_path=str(executable), headless=headless,
                )
                try:
                    page = context.new_page()
                    page.goto('https://example.com', timeout=30000)
                    assert page.title() == 'Example Domain', 'Unexpected navigation result'
                    cdp = context.new_cdp_session(page)
                    result['browserProduct'] = cdp.send('Browser.getVersion')['product']
                    cdp.detach()
                    before = page.evaluate("() => ({cookie: document.cookie, localStorage: localStorage.getItem('user')})")
                    if session == 1:
                        assert 'session=abc123' not in before['cookie'], 'Profile was not fresh'
                        assert before['localStorage'] is None, 'Profile was not fresh'
                        page.evaluate("document.cookie = 'session=abc123; path=/; max-age=3600'")
                        page.evaluate("localStorage.setItem('user', 'returning')")
                    state = page.evaluate("() => ({cookie: document.cookie, localStorage: localStorage.getItem('user')})")
                    assert 'session=abc123' in state['cookie'], 'Cookie did not persist'
                    assert state['localStorage'] == 'returning', 'localStorage did not persist'
                    result['sessions'].append({'session': session, 'before': before, 'state': state})
                    page.screenshot(path=str(args.output / f'{mode}-session-{session}.png'))
                finally:
                    context.close()
            result['status'] = 'pass'
        except Exception as error:
            result.update(error=str(error), traceback=traceback.format_exc())
        report['results'].append(result)
        save()
        print(f'persistent-context {mode}: {result["status"]}', flush=True)
    report['completedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    report['allPassed'] = len(report['results']) == 2 and all(item['status'] == 'pass' for item in report['results'])
    report['runtimeUnchanged'] = (report['executableSha256'] == sha256(executable)
                                  and report['runtimeSha256'] == sha256(executable.with_name('chrome.dll')))
    save()
    return 0 if report['allPassed'] and report['runtimeUnchanged'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
