"""Regression for an empty detail map from the reviewed reference collector."""
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'benchmarks'))
from reference_result_details import parse_detection_details


class CapturedDetailsTest(unittest.TestCase):
    def test_multiline_rendered_json_preserves_true_and_false(self):
        text = '''Are you a bot? Raw detection details
        {
          "isBot": true,
          "details": {"signalA": true, "signalB": false}
        }
        Explanation below.'''
        self.assertEqual(parse_detection_details(text), {
            'isBot': True, 'checks': {'signalA': True, 'signalB': False}})

    def test_false_verdict_is_available_and_nonboolean_fields_are_omitted(self):
        self.assertEqual(parse_detection_details(
            '{"isBot":false,"details":{"one":false,"numeric":1,"text":"true"},"ip":"ignored"}'),
            {'isBot': False, 'checks': {'one': False}})

    def test_missing_or_malformed_data_does_not_become_a_pass(self):
        for text in ['unavailable', '{broken', '{"isBot":true}',
                     '{"isBot":1,"details":{}}', '{"isBot":false,"details":null}',
                     '{"isBot":false,"details":{}}', '{"isBot":false,"details":{"a":1}}']:
            with self.subTest(text=text):
                self.assertIsNone(parse_detection_details(text))

    def test_unrelated_braces_do_not_hide_the_rendered_result(self):
        self.assertEqual(parse_detection_details(
            'notes {broken} {"unrelated":1} then {"isBot":true,"details":{"a":true}}'),
            {'isBot': True, 'checks': {'a': True}})

    def test_oversized_input_is_rejected(self):
        with self.assertRaises(ValueError):
            parse_detection_details('x' * (1024 * 1024 + 1))


if __name__ == '__main__':
    unittest.main()
