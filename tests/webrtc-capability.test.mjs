import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLaunchOptions, launch} from '../sdk/js/index.mjs';

test('WebRTC native mode is inert; unsafe or conflicting policies are rejected', () => {
  assert.deepEqual(buildLaunchOptions({executablePath:'chrome.exe',webrtcPolicy:'native'}).args,[]);
  assert.throws(()=>buildLaunchOptions({executablePath:'chrome.exe',webrtcPolicy:'spoof_ip'}),/Unsupported/);
  assert.throws(()=>buildLaunchOptions({executablePath:'chrome.exe',engineMode:'baseline',webrtcPolicy:'disable_non_proxied_udp'}),/compiled custom engine/);
  assert.throws(()=>buildLaunchOptions({executablePath:'chrome.exe',args:['--custom-browser-webrtc-policy=default']}),/typed options/);
});

test('unpatched custom engine cannot silently accept a new WebRTC policy', {skip:!process.env.CUSTOM_BROWSER_LEGACY_EXECUTABLE}, async () => {
  await assert.rejects(launch({executablePath:process.env.CUSTOM_BROWSER_LEGACY_EXECUTABLE,webrtcPolicy:'disable_non_proxied_udp'}),/does not support the native WebRTC policy patch/);
});
