import pathlib
import sys
import unittest

sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'build'))
from release_config import load_release

class ReleaseSelection(unittest.TestCase):
    def test_historical_default_and_stable_have_distinct_locks(self):
        historic,old,_=load_release()
        stable,new,manifest=load_release('155.0.8059.80')
        self.assertNotEqual(historic,stable)
        self.assertEqual(old['tag'],'146.0.7680.177')
        self.assertEqual(new['commit'],'43a195105613ac83c21d3f14de279f4a045c7da0')
        self.assertEqual(new['windows']['visualStudioMinimum'],'18.0.0')
        self.assertFalse(new['built'])
        self.assertEqual([item['id'] for item in manifest['patches']],['CB-0001','CB-0002','CB-0003','CB-0004','CB-0005'])
    def test_path_and_range_inputs_are_rejected(self):
        for value in ['../146.0.7680.177','155','155.*','C:/src','155.0.8059.80/../../','']:
            with self.assertRaises(ValueError):load_release(value)

if __name__=='__main__':unittest.main()
