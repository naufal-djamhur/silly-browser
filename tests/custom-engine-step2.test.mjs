import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {mkdtemp, mkdir, readFile, writeFile, rm, stat} from 'node:fs/promises';
import {tmpdir, platform, arch} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {launch, launchContext, launchPersistentContext} from '../sdk/js/index.mjs';

const exec = promisify(execFile), executablePath = process.env.CUSTOM_BROWSER_EXECUTABLE;
if (!executablePath) throw new Error('Set CUSTOM_BROWSER_EXECUTABLE to the built engine; skipped checks cannot qualify a release.');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(process.env.CUSTOM_ENGINE_REPORT ?? join(root, 'artifacts/engine-validation/windows-146-step2/results.json'));
const report = {schemaVersion: 1, iteration: 2, engineMode: 'custom', startedAt: new Date().toISOString(), host: {platform: platform(), arch: arch()}, results: []};
const controls = new Map();
let server, origin;

async function readIdentity() {
  const headers = await (await fetch('/headers')).json();
  return {platform: navigator.platform, ua: navigator.userAgent,
    hints: await navigator.userAgentData.getHighEntropyValues(['platformVersion', 'architecture', 'bitness', 'fullVersionList']),
    headers: Object.fromEntries(Object.entries(headers).filter(([key]) => key === 'user-agent' || key.startsWith('sec-ch-ua')))};
}

async function observe(page) {
  await page.goto(origin);
  const frame = page.frames().find(value => value !== page.mainFrame());
  assert(frame, 'Fixture iframe is missing'); await frame.waitForLoadState();
  const observed = {document: await page.evaluate(() => window.readIdentity()), frame: await frame.evaluate(() => window.readIdentity())};
  Object.assign(observed, await page.evaluate(async () => {
    function message(target, cleanup) {
      return new Promise((resolve, reject) => {
        const channel = new MessageChannel();
        const timer = setTimeout(() => {channel.port1.close(); cleanup?.(); reject(Error('Worker identity timed out'));}, 15000);
        channel.port1.onmessage = event => {clearTimeout(timer); channel.port1.close(); cleanup?.(); resolve(event.data);};
        target.postMessage('identity', [channel.port2]);
      });
    }
    const dedicated = new Worker('/dedicated.js');
    const dedicatedWorker = await message(dedicated, () => dedicated.terminate());
    const shared = new SharedWorker('/shared.js'); shared.port.start();
    const sharedWorker = await message(shared.port, () => shared.port.close());
    const registration = await navigator.serviceWorker.register('/service.js'); await navigator.serviceWorker.ready;
    try {return {dedicatedWorker, sharedWorker, serviceWorker: await message(registration.active)};}
    finally {await registration.unregister();}
  }));
  return observed;
}

function verifySurface(surface, expected, reference) {
  assert.equal(surface.platform, expected.navigator); assert.equal(surface.hints.platform, expected.hint);
  assert.equal(surface.hints.platformVersion, expected.version); assert(surface.ua.includes(expected.ua));
  assert.equal(surface.headers['user-agent'], surface.ua);
  // This Chromium revision omits Client Hints on native worker fetches.
  // Preserve that baseline availability rather than requiring invented headers.
  for (const [key, value] of [['sec-ch-ua-platform', surface.hints.platform], ['sec-ch-ua-platform-version', surface.hints.platformVersion]]) {
    assert.equal(surface.headers[key], reference.headers[key] === undefined ? undefined : JSON.stringify(value));
  }
  for (const field of ['architecture', 'bitness']) {
    assert.equal(surface.hints[field], reference.hints[field]);
    const key = `sec-ch-ua-${field === 'architecture' ? 'arch' : field}`;
    assert.equal(surface.headers[key], reference.headers[key] === undefined ? undefined : JSON.stringify(surface.hints[field]));
  }
  assert.deepEqual(surface.hints.fullVersionList, reference.hints.fullVersionList);
  assert.equal(surface.headers['sec-ch-ua-full-version-list'], reference.headers['sec-ch-ua-full-version-list']);
}

function check(name, operation) {
  test(name, {skip: !executablePath, timeout: 120000}, async () => {
    const start = Date.now();
    try {report.results.push({name, status: 'passed', observed: await operation()});}
    catch (error) {report.results.push({name, status: 'failed', error: error.message}); throw error;}
    finally {report.results.at(-1).elapsedMs = Date.now() - start;}
  });
}

before(async () => {
  if (!executablePath) return;
  for (const filename of ['chrome.exe', 'chrome.dll']) report[filename === 'chrome.exe' ? 'binarySha256' : 'runtimeSha256'] = createHash('sha256').update(await readFile(join(dirname(executablePath), filename))).digest('hex');
  const lock = JSON.parse(await readFile(join(root, 'engine/upstream.lock.json'), 'utf8'));
  report.upstreamCommit = lock.commit; report.expectedVersion = lock.tag; report.node = process.version;
  report.playwright = JSON.parse(await readFile(join(root, 'node_modules/playwright-core/package.json'), 'utf8')).version;
  report.engineInfo = JSON.parse((await exec(executablePath, ['--headless', '--custom-browser-engine-info'], {timeout: 10000, windowsHide: true})).stdout.trim());
  assert.equal(report.engineInfo.engine, 'custom-browser'); assert.equal(report.engineInfo.sourcePatchCount, 2);
  server = createServer((req, res) => {
    res.setHeader('Accept-CH', 'Sec-CH-UA-Platform-Version, Sec-CH-UA-Arch, Sec-CH-UA-Bitness, Sec-CH-UA-Full-Version-List');
    if (req.url === '/headers') {res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(req.headers)); return;}
    if (req.url?.endsWith('.js')) {
      res.setHeader('Content-Type', 'text/javascript'); const reader = `const readIdentity = ${readIdentity.toString()};`;
      const responder = 'async event => event.ports[0].postMessage(await readIdentity())';
      if (req.url === '/shared.js') res.end(`${reader} onconnect = event => {event.ports[0].onmessage = ${responder}; event.ports[0].start();};`);
      else if (req.url === '/service.js') res.end(`${reader} oninstall = () => self.skipWaiting(); onactivate = event => event.waitUntil(clients.claim()); onmessage = ${responder};`);
      else res.end(`${reader} onmessage = ${responder};`);
      return;
    }
    res.setHeader('Content-Type', 'text/html');
    res.end(`<!doctype html><title>Engine identity fixture</title>${req.url === '/frame' ? '' : '<iframe src="/frame"></iframe>'}<script>window.readIdentity = ${readIdentity.toString()};</script>`);
  });
  await new Promise(value => server.listen(0, '127.0.0.1', value)); origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!executablePath) return;
  if (server) await new Promise(value => server.close(value));
  report.completedAt = new Date().toISOString(); report.passed = report.results.filter(value => value.status === 'passed').length;
  report.failed = report.results.filter(value => value.status !== 'passed').length;
  report.scope = 'Local identity, native-mode preservation, seed lifecycle, renderer-switch propagation and startup rejection. No rendering/network privacy or detector qualification.';
  await mkdir(dirname(output), {recursive: true}); await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(`Engine evidence: ${output}`);
});

const identities = [
  {platform: 'windows', navigator: 'Win32', hint: 'Windows', ua: 'Windows NT 10.0', version: '13.0.0'},
  {platform: 'linux', navigator: 'Linux x86_64', hint: 'Linux', ua: 'Linux x86_64', version: ''},
  {platform: 'macos', navigator: 'MacIntel', hint: 'macOS', ua: 'Macintosh', version: '15.0.0'}
];
for (const headless of [true, false]) {
  const mode = headless ? 'headless' : 'headed';
  check(`native control ${mode}`, async () => {
    const browser = await chromium.launch({executablePath, headless, chromiumSandbox: true});
    try {assert.equal(browser.version(), report.expectedVersion); const observed = await observe(await browser.newPage()); controls.set(mode, observed); return observed;}
    finally {await browser.close();}
  });
  check(`SDK native identity preserved ${mode}`, async () => {
    const context = await launchContext({executablePath, headless});
    try {const observed = await observe(await context.newPage()); assert.deepEqual(observed, controls.get(mode)); return observed;}
    finally {await context.close();}
  });
  for (const preset of identities) for (const explicit of [false, true]) {
    const expected = {...preset, version: explicit ? '12.3.4' : preset.version};
    check(`${preset.platform} ${explicit ? 'explicit' : 'default'} platformVersion ${mode}`, async () => {
      const context = await launchContext({executablePath, headless, platform: preset.platform, ...(explicit ? {platformVersion: expected.version} : {})});
      try {const observed = await observe(await context.newPage()); for (const [name, surface] of Object.entries(observed)) verifySurface(surface, expected, controls.get(mode)[name]); return observed;}
      finally {await context.close();}
    });
  }
  check(`persistent seed and storage lifecycle ${mode}`, async () => {
    const directory = await mkdtemp(join(tmpdir(), 'custom-engine-profile-')); let context; const launchedSeeds = [];
    try {
      for (const [index, override] of [undefined, undefined, '0', undefined].entries()) {
        context = await launchPersistentContext(directory, {executablePath, headless, args: ['--enable-automation'], ...(override === undefined ? {} : {seed: override})});
        const page = await context.newPage(); await page.goto(origin);
        const stored = (await readFile(join(directory, '.custom-browser-seed'), 'utf8')).trim();
        const cdp = await context.newCDPSession(page); const args = (await cdp.send('Browser.getBrowserCommandLine')).arguments;
        const seed = args.find(value => value.startsWith('--custom-browser-seed='))?.split('=')[1]; assert.equal(seed, override ?? stored); launchedSeeds.push(seed);
        if (index === 0) {
          await page.evaluate(() => localStorage.setItem('custom-engine-persistence', 'retained'));
          await context.addCookies([{name: 'custom-engine-cookie', value: 'retained', url: origin, expires: Math.floor(Date.now() / 1000) + 3600}]);
        } else {
          assert.equal(await page.evaluate(() => localStorage.getItem('custom-engine-persistence')), 'retained');
          assert((await context.cookies()).some(value => value.name === 'custom-engine-cookie' && value.value === 'retained')); assert.equal(stored, launchedSeeds[0]);
        }
        await context.close(); context = null;
      }
      await writeFile(join(directory, '.custom-browser-seed'), 'corrupt-seed\n');
      await assert.rejects(launchPersistentContext(directory, {executablePath, headless}), /Corrupt persistent seed/);
      assert.equal(await readFile(join(directory, '.custom-browser-seed'), 'utf8'), 'corrupt-seed\n');
      context = await launchContext({executablePath, headless, args: ['--enable-automation']}); const page = await context.newPage();
      const cdp = await context.newCDPSession(page); const args = (await cdp.send('Browser.getBrowserCommandLine')).arguments;
      const profile = args.find(value => value.startsWith('--user-data-dir='))?.slice('--user-data-dir='.length);
      assert(profile); await stat(profile); await context.close(); context = null; await assert.rejects(stat(profile), {code: 'ENOENT'});
      return {launchedSeeds, diagnosticFlag: '--enable-automation', overridePreservesStoredSeed: true, cookiesAndStorageRetained: true, corruptSeedPreserved: true, temporaryProfileRemoved: true};
    } finally {if (context) await context.close(); await rm(directory, {recursive: true, force: true});}
  });
}

check('seed boundaries and generated startup seed', async () => {
  const generated = [];
  for (const seed of [undefined, undefined, '0', '18446744073709551615', '0001']) {
    const args = ['--headless', '--custom-browser-engine-info', ...(seed === undefined ? [] : [`--custom-browser-seed=${seed}`])];
    const info = JSON.parse((await exec(executablePath, args, {timeout: 10000, windowsHide: true})).stdout.trim());
    assert(/^[0-9]+$/.test(info.seed)); assert(BigInt(info.seed) <= 18446744073709551615n);
    if (seed === undefined) generated.push(info.seed); else assert.equal(info.seed, seed);
  }
  return {generated, acceptsZero: true, acceptsUint64Maximum: true, preservesLeadingZeroRepresentation: true};
});

for (const flags of [
  ['--custom-browser-seed='], ['--custom-browser-seed=-1'], ['--custom-browser-seed=18446744073709551616'], ['--custom-browser-seed=1.0'],
  ['--custom-browser-platform=freebsd'], ['--custom-browser-platform-version=12.3.4'],
  ['--custom-browser-platform=windows', '--custom-browser-platform-version=broken'], ['--custom-browser-platform=macos', '--custom-browser-platform-version=']
]) check(`engine rejects ${flags.join(' ')}`, async () => {
  let failure; try {await exec(executablePath, ['--headless', '--custom-browser-engine-info', ...flags], {timeout: 10000, windowsHide: true});} catch (error) {failure = error;}
  assert(failure && Number.isInteger(failure.code) && failure.code !== 0, 'Expected actual nonzero exit, rather than a timeout');
  assert(!failure.stdout?.includes('"engine":"custom-browser"')); return {flags, exitCode: failure.code};
});

check('browser and renderer receive typed seed/platform switches', async () => {
  const expected = ['--custom-browser-seed=18446744073709551615', '--custom-browser-platform=macos', '--custom-browser-platform-version=12.3.4'];
  const browser = await launch({executablePath, args: ['--enable-automation'], seed: '18446744073709551615', platform: 'macos', platformVersion: '12.3.4'});
  try {
    const page = await browser.newPage(); await page.goto(origin); const cdp = await browser.newBrowserCDPSession();
    const args = (await cdp.send('Browser.getBrowserCommandLine')).arguments; for (const flag of expected) assert(args.includes(flag));
    const ids = (await cdp.send('SystemInfo.getProcessInfo')).processInfo.filter(value => value.type === 'renderer').map(value => value.id);
    assert(ids.length && ids.every(Number.isSafeInteger)); const filter = ids.map(id => `ProcessId=${id}`).join(' OR ');
    const script = `$items = @(Get-CimInstance Win32_Process -Filter '${filter}' | ForEach-Object { [ordered]@{ id=$_.ProcessId; flags=@([regex]::Matches($_.CommandLine, '--custom-browser-[a-z-]+=[^\\s"]+') | ForEach-Object {$_.Value}) } }); ConvertTo-Json -InputObject $items -Depth 4 -Compress`;
    const {stdout} = await exec(process.env.CUSTOM_ENGINE_POWERSHELL ?? 'powershell.exe', ['-NoProfile', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], {timeout: 15000, windowsHide: true});
    const renderers = JSON.parse(stdout.trim()); assert.equal(renderers.length, ids.length);
    for (const renderer of renderers) for (const flag of expected) assert(renderer.flags.includes(flag));
    return {browserFlags: args.filter(value => value.startsWith('--custom-browser-')), rendererCount: renderers.length, rendererFlags: renderers.map(value => value.flags)};
  } finally {await browser.close();}
});
