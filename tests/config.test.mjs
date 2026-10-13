import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLaunchOptions,normalizeProxy} from '../sdk/js/index.mjs';
import {parseFingerprintScan,findRecaptchaScore} from '../benchmarks/adapters.mjs';
test('inline HTTP credentials do not reach proxy address or process flags',()=>{
  const p=normalizeProxy('http://name:p%40ss@[::1]:8080');
  assert.equal(p.server,'http://[::1]:8080');assert.equal(p.password,'p@ss');
  const options=buildLaunchOptions({executablePath:'chrome.exe',proxy:'http://name:secret@localhost:8080',engineMode:'baseline'});
  assert(!JSON.stringify(options.args).includes('secret'));
});
test('unimplemented engine capabilities and insecure sandbox options fail explicitly',()=>{
  assert.throws(()=>normalizeProxy('socks5://user:pass@localhost:1080'),/not implemented/);
  assert.throws(()=>buildLaunchOptions({executablePath:'chrome.exe',engineMode:'baseline',platform:'macos'}),/compiled custom engine/);
  assert.deepEqual(buildLaunchOptions({executablePath:'chrome.exe',platform:'macos',platformVersion:'15.2.0'}).args,['--custom-browser-platform=macos','--custom-browser-platform-version=15.2.0']);
  assert.throws(()=>buildLaunchOptions({executablePath:'chrome.exe',args:['--no-sandbox']}),/Sandbox/);
  assert.throws(()=>buildLaunchOptions({executablePath:'chrome.exe',seed:'18446744073709551616'}),/uint64/);
});
test('missing data and uncollected scanner values cannot become passing scores',()=>{
  assert.equal(parseFingerprintScan('Not collected Bot score 0/100'),null);
  assert.equal(parseFingerprintScan('Bot score 999/100'),null);
  assert.equal(parseFingerprintScan('Bot score 62/100'),62);
  assert.equal(findRecaptchaScore({score:0.9}),null);
  assert.equal(findRecaptchaScore({success:true,score:0.9,action:'wrong'}),null);
  assert.equal(findRecaptchaScore({success:true,score:0.9,action:'examples/v3scores'}),0.9);
});
