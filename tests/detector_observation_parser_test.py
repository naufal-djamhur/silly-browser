"""Guard measurement completeness and conflicting rendered check values."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'benchmarks'))
from compare_detector_observations import scan_details


class ScanObservationTests(unittest.TestCase):
    def test_complete_rendered_failure_and_categories(self):
        result=scan_details('Fingerprint collected successfully\nBot score 100/100\nHardware / OS: LOW\nBrowser: HIGH\n+305\nNetwork / proxy: MEDIUM\n+49\nWebdriver\ntrue\nCDP Stack Check\ntrue\nSelenium Properties\nfalse\n')
        self.assertEqual(result['status'],'fail')
        self.assertEqual(result['score'],100)
        self.assertEqual(result['categories'][1],{'category':'Browser','level':'HIGH','renderedPoints':305})
        self.assertEqual(result['reportedChecks']['Selenium Properties'],[False])

    def test_uncollected_zero_is_not_a_pass(self):
        for text in ['Not collected Bot score 0/100','Bot score 0/100\ncollecting…','Fingerprint collected successfully']:
            self.assertEqual(scan_details(text)['status'],'unavailable')

    def test_out_of_range_score_is_unavailable(self):
        self.assertEqual(scan_details('Fingerprint collected successfully\nBot score 101/100')['status'],'unavailable')

    def test_repeated_conflicting_checks_are_preserved(self):
        result=scan_details('Fingerprint collected successfully\nBot score 0/100\nWebdriver\nfalse\nWebdriver\ntrue\nWebdriver\nfalse\n')
        self.assertEqual(result['score'],0)
        self.assertEqual(result['reportedChecks']['Webdriver'],[False,True])


if __name__=='__main__':
    unittest.main()
