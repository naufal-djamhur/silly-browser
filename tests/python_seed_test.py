import concurrent.futures
import pathlib
import tempfile
import unittest
from custom_browser import _seed

class ProfileSeedTests(unittest.TestCase):
    def test_concurrent_creation(self):
        with tempfile.TemporaryDirectory() as directory:
            profile=pathlib.Path(directory)
            with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
                values=list(pool.map(lambda _:_seed(profile,None),range(48)))
            self.assertEqual(len(set(values)),1)
            self.assertEqual((profile/'.custom-browser-seed').read_text(),values[0]+'\n')
            self.assertEqual([p.name for p in profile.iterdir()],['.custom-browser-seed'])
    def test_corruption_is_preserved(self):
        with tempfile.TemporaryDirectory() as directory:
            profile=pathlib.Path(directory);file=profile/'.custom-browser-seed';file.write_text('broken\n')
            with self.assertRaisesRegex(ValueError,'Corrupt'):_seed(profile,None)
            self.assertEqual(_seed(profile,42),'42')
            self.assertEqual(file.read_text(),'broken\n')

if __name__=='__main__':unittest.main()
