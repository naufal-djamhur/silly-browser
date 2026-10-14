"""Verify policy rejection against an actual engine without WebRTC capability."""
import asyncio
import os
import unittest
from custom_browser import launch, launch_async

LEGACY_BINARY = os.environ.get('CUSTOM_BROWSER_LEGACY_EXECUTABLE')

class WebRtcCapability(unittest.TestCase):
    def test_unsupported_policy_and_baseline_are_rejected_before_launch(self):
        with self.assertRaisesRegex(ValueError, 'Unsupported webrtc_policy'):
            launch(executable_path='missing.exe', webrtc_policy='spoof_ip')
        with self.assertRaisesRegex(ValueError, 'compiled custom engine'):
            launch(executable_path='missing.exe', engine_mode='baseline', webrtc_policy='default')

    @unittest.skipUnless(LEGACY_BINARY, 'Set CUSTOM_BROWSER_LEGACY_EXECUTABLE to the historical two-patch engine')
    def test_sync_engine_missing_capability_fails_explicitly(self):
        with self.assertRaisesRegex(RuntimeError, 'does not support the native WebRTC policy patch'):
            launch(executable_path=LEGACY_BINARY, webrtc_policy='disable_non_proxied_udp')

    @unittest.skipUnless(LEGACY_BINARY, 'Set CUSTOM_BROWSER_LEGACY_EXECUTABLE to the historical two-patch engine')
    def test_async_engine_missing_capability_fails_explicitly(self):
        with self.assertRaisesRegex(RuntimeError, 'does not support the native WebRTC policy patch'):
            asyncio.run(launch_async(executable_path=LEGACY_BINARY, webrtc_policy='disable_non_proxied_udp'))

if __name__ == '__main__':
    unittest.main(verbosity=2)
