"""Create an auditable browser-only DEPS file outside the pinned source tree."""
import argparse
import ast
import hashlib
import json
import pathlib
import subprocess

from release_config import load_release

OMITTED = 'src/third_party/updater/chrome_win_x86/cipd'
PACKAGE = 'chromium/third_party/updater/chrome_win_x86'


def browser_deps(original):
    tree = ast.parse(original)
    assignments = [node for node in tree.body if isinstance(node, ast.Assign)
                   and any(isinstance(target, ast.Name) and target.id == 'deps' for target in node.targets)]
    if len(assignments) != 1 or not isinstance(assignments[0].value, ast.Dict):
        raise ValueError('Expected one literal upstream deps dictionary')
    matches = [value for key, value in zip(assignments[0].value.keys, assignments[0].value.values)
               if isinstance(key, ast.Constant) and key.value == OMITTED]
    if len(matches) != 1:
        raise ValueError('Expected exactly one optional updater-test dependency')
    value = matches[0]
    dependency = ast.literal_eval(value)
    if dependency.get('dep_type') != 'cipd' or [entry.get('package') for entry in dependency.get('packages', [])] != [PACKAGE]:
        raise ValueError('Unexpected updater-test package definition')
    lines = original.splitlines(keepends=True)
    start = sum(map(len, lines[:value.lineno - 1])) + value.col_offset
    end = sum(map(len, lines[:value.end_lineno - 1])) + value.end_col_offset
    result = original[:start] + b'None' + original[end:]
    ast.parse(result)
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=pathlib.Path)
    parser.add_argument('--release', required=True)
    args = parser.parse_args()
    _, lock, _ = load_release(args.release)
    source = args.source.resolve()
    head = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
    if head != lock['commit']:
        raise SystemExit('Source revision differs from the selected release')
    original = subprocess.check_output(['git', '-C', str(source), 'show', f'{head}:DEPS'])
    if (source / 'DEPS').read_bytes().replace(b'\r\n', b'\n') != original.replace(b'\r\n', b'\n'):
        raise SystemExit('Tracked DEPS contains local changes; preserving them')
    result = browser_deps(original)
    destination = source.parent / f'.silly-browser-{args.release}.DEPS'
    if destination.exists() and destination.read_bytes() != result:
        raise SystemExit('Generated dependency-file location contains different data; preserving it')
    destination.write_bytes(result)
    report = dict(version=args.release, commit=head, upstreamDepsSha256=hashlib.sha256(original).hexdigest(),
                  browserDepsSha256=hashlib.sha256(result).hexdigest(), omittedDependency=OMITTED,
                  omittedPackage=PACKAGE, scope='x64 browser; prebuilt x86 updater test fixture excluded',
                  trackedSourceModified=False, antivirusSettingsChanged=False)
    destination.with_suffix('.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
