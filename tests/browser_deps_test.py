"""Guard the scope of our browser-only dependency manifest."""
import ast
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'build'))
from prepare_browser_deps import OMITTED, browser_deps


class BrowserDependencies(unittest.TestCase):
    def manifest(self, package='chromium/third_party/updater/chrome_win_x86'):
        return ("# Preserve UTF-8 metadata: café\n"
                "vars = {'version': 'pinned'}\n"
                "deps = {'keep_git': Var('version'),\n"
                f"'{OMITTED}': {{'dep_type': 'cipd', 'condition': 'checkout_win',\n"
                f"'packages': [{{'package': '{package}', 'version': 'exact'}}]}},\n"
                "'keep_cipd': {'dep_type': 'cipd', 'packages': [{'package': 'required', 'version': 'exact'}]}}\n").encode()

    def test_no_other_dependency_or_metadata_changes(self):
        original = self.manifest()
        expected = ast.parse(original)
        deps = next(node.value for node in expected.body if isinstance(node, ast.Assign)
                    and any(isinstance(target, ast.Name) and target.id == 'deps' for target in node.targets))
        index = next(index for index, key in enumerate(deps.keys) if key.value == OMITTED)
        deps.values[index] = ast.Constant(value=None)
        self.assertEqual(ast.dump(ast.parse(browser_deps(original))), ast.dump(expected))
        self.assertIn('café'.encode(), browser_deps(original))

    def test_unexpected_or_ambiguous_definitions_are_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Unexpected updater-test package'):
            browser_deps(self.manifest('required-compiler-package'))
        with self.assertRaisesRegex(ValueError, 'exactly one'):
            browser_deps(b'deps = {}\n')
        duplicate = self.manifest().replace(b"'keep_cipd':", repr(OMITTED).encode() + b':')
        with self.assertRaisesRegex(ValueError, 'exactly one'):
            browser_deps(duplicate)


if __name__ == '__main__':
    unittest.main(verbosity=2)
