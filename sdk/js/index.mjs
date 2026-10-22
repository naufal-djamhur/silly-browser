import { chromium } from 'playwright-core';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { humanizeBrowser,validateHumanConfig } from './humanize.mjs';
import {persistentSeed} from './profile-seed.mjs';
import {buildContextOptions, contextOptionKeys} from './context-options.mjs';
import {browserPath,ensureBrowser} from './browser-manager.mjs';
import {fontDirectoryFor} from './font-options.mjs';
export {installBrowser,browserPath,browserStatus} from './browser-manager.mjs';
export {buildContextOptions} from './context-options.mjs';
export { humanizeBrowser } from './humanize.mjs';
export {launchPuppeteer,launchPuppeteerPersistent,humanizePuppeteerBrowser} from './puppeteer.mjs';

export function normalizeProxy(input) {
  if (!input) return undefined;
  if (typeof input === 'object') {
    if (!input.server) throw new TypeError('Proxy server is required');
    if (input.bypass !== undefined && (typeof input.bypass !== 'string' || /[\r\n\x00]/.test(input.bypass)))
      throw new TypeError('Proxy bypass must be a string without CR, LF or NUL');
    const parsed = normalizeProxy(input.server);
    const result = {...parsed, ...input, server: parsed.server};
    if (result.server.startsWith('socks5:') && (result.username || result.password))
      throw new Error('Native authenticated SOCKS5 engine patch is not implemented yet');
    return result;
  }
  const url = new URL(input);
  if (!['http:', 'https:', 'socks5:'].includes(url.protocol) || !url.hostname || !url.port || !['','/'].includes(url.pathname) || url.search || url.hash)
    throw new TypeError('Proxy must be http(s) or socks5 with a host and explicit port');
  const username = decodeURIComponent(url.username), password = decodeURIComponent(url.password);
  if (url.protocol === 'socks5:' && (username || password))
    throw new Error('Native authenticated SOCKS5 engine patch is not implemented yet');
  return {server: `${url.protocol}//${url.host}`, ...(username ? {username} : {}), ...(password ? {password} : {})};
}

export function buildLaunchOptions(options = {}) {
  const known = new Set(['executablePath','engineMode','headless','proxy','platform','platformVersion','webrtcPolicy','extensionPaths','seed','args','geoip','humanize','humanConfig','locale','timezone','viewport','fontDirectory','fontPack']);
  for(const key of Object.keys(options)) if(!known.has(key)) throw new TypeError(`Unknown option: ${key}`);
  contextOptionsFor(options);
  if(options.humanize) validateHumanConfig(options.humanConfig??{});
  const {executablePath, engineMode = 'custom', headless = true, proxy, platform = 'native', extensionPaths = [], seed, args = [], geoip = false} = options;
  if (!['custom', 'baseline'].includes(engineMode)) throw new TypeError('Invalid engineMode');
  if (!['native','windows','linux','macos'].includes(platform)) throw new TypeError('Unsupported platform');
  const webrtcPolicy=options.webrtcPolicy??'native';
  if(!['native','default','default_public_interface_only','default_public_and_private_interfaces','disable_non_proxied_udp'].includes(webrtcPolicy)) throw new TypeError('Unsupported webrtcPolicy');
  if(engineMode==='baseline' && webrtcPolicy!=='native') throw new Error('WebRTC policy requires our compiled custom engine');
  if (engineMode === 'baseline' && platform !== 'native') throw new Error('Platform identity requires our compiled custom engine, not baseline mode');
  if (options.platformVersion !== undefined && (platform === 'native' || !/^\d+\.\d+\.\d+$/.test(options.platformVersion) || options.platformVersion.length > 32)) throw new TypeError('platformVersion requires a preset and major.minor.patch');
  if (geoip) throw new Error('GeoIP integration is not implemented yet');
  if (!Array.isArray(args) || !args.every(a => typeof a === 'string')) throw new TypeError('args must be strings');
  if (args.some(a => /^--(no-sandbox|disable-setuid-sandbox)(=|$)/.test(a))) throw new Error('Sandbox must remain enabled');
  if (args.some(a => /^--(custom-browser-seed|custom-browser-platform|custom-browser-platform-version|custom-browser-webrtc-policy|user-data-dir)(=|$)/.test(a))) throw new Error('Use typed options instead of duplicate lifecycle flags');
  if (!Array.isArray(extensionPaths) || !extensionPaths.every(p => typeof p === 'string' && !p.includes(','))) throw new TypeError('extensionPaths must be paths without commas');
  if (seed !== undefined && ((typeof seed === 'number' && !Number.isSafeInteger(seed)) || !/^\d+$/.test(String(seed)) || BigInt(seed) > 18446744073709551615n)) throw new TypeError('seed must be a uint64 decimal string');
  const fontDirectory=fontDirectoryFor(options);
  if(fontDirectory && engineMode==='baseline')throw Error('Native font configuration requires our compiled custom engine');
  if(fontDirectory && args.some(a=>/^--custom-browser-fonts-dir(=|$)/.test(a)))throw Error('Duplicate native font directory configuration');
  const launchArgs = [...args];
  if(fontDirectory)launchArgs.push(`--custom-browser-fonts-dir=${fontDirectory}`);
  if (platform !== 'native') launchArgs.push(`--custom-browser-platform=${platform}`);
  if (options.platformVersion !== undefined) launchArgs.push(`--custom-browser-platform-version=${options.platformVersion}`);
  if (webrtcPolicy!=='native') launchArgs.push(`--custom-browser-webrtc-policy=${webrtcPolicy}`);
  if (engineMode === 'custom' && seed !== undefined) launchArgs.push(`--custom-browser-seed=${seed}`);
  if (extensionPaths.length) {
    const paths = extensionPaths.map(p => resolve(p)).join(',');
    launchArgs.push(`--disable-extensions-except=${paths}`, `--load-extension=${paths}`);
  }
  if (!executablePath && engineMode==='baseline') throw Error('Baseline mode requires an explicit executablePath');
  return {executablePath: resolve(executablePath || browserPath()), headless, chromiumSandbox: true, args: launchArgs,
    ...(extensionPaths.length ? {ignoreDefaultArgs: ['--disable-extensions']} : {}),
    ...(proxy ? {proxy: normalizeProxy(proxy)} : {})};
}

export async function verifyCustomBinary(options) {
  if (options.engineMode === 'baseline') return;
  // Refuse to silently advertise a stock executable as our custom engine.
  const {execFile} = await import('node:child_process');
  const {promisify} = await import('node:util');
  const {stdout} = await promisify(execFile)(options.executablePath,
    ['--headless', '--custom-browser-engine-info'], {timeout: 10000, windowsHide: true});
  const info = JSON.parse(stdout.trim());
  if (info.engine !== 'custom-browser' || info.policyVersion !== 1) throw new Error('Custom engine handshake failed');
  if (options.args.some(a=>a.startsWith('--custom-browser-platform=')) && (info.sourcePatchCount??0) < 2) throw new Error('Compiled engine does not support platform identity');
  if (options.args.some(a=>a.startsWith('--custom-browser-webrtc-policy=')) && !info.capabilities?.includes('webrtc-policy')) throw new Error('Compiled engine does not support the native WebRTC policy patch');
  if (options.args.some(a=>a.startsWith('--custom-browser-fonts-dir=')) && !info.capabilities?.includes('font-directory-windows')) throw new Error('Compiled engine does not support native Windows font-directory loading');
}

export async function launch(options = {}) {
  if (contextOptionKeys.some(key => Object.hasOwn(options, key)))
    throw new TypeError('Context options require launchContext, launchPersistentContext or browser.newContext(buildContextOptions(...))');
  if (options.extensionPaths?.length) throw new Error('Extensions require launchContext or launchPersistentContext; Browser.newContext is incognito');
  options=await prepareExecutable(options);
  const launchOptions = buildLaunchOptions(options);
  await verifyCustomBinary({...launchOptions, engineMode: options.engineMode});
  const browser = await chromium.launch(launchOptions);
  if (options.humanize) humanizeBrowser(browser, options.humanConfig);
  return browser;
}

// Validate before any download or profile creation. Pure option builders never download.
export async function prepareExecutable(options={}) {
  buildLaunchOptions({...options,executablePath:options.executablePath || '__validate_only__'});
  if (options.executablePath) return options;
  if (options.engineMode==='baseline') throw Error('Baseline mode requires an explicit executablePath');
  return {...options,executablePath:await ensureBrowser()};
}

function contextOptionsFor(options) {
  return buildContextOptions(Object.fromEntries(contextOptionKeys.filter(key => Object.hasOwn(options, key)).map(key => [key, options[key]])));
}

export async function launchPersistentContext(userDataDir, options = {}) {
  const directory = resolve(userDataDir);
  // Validate options before writing profile state.
  options=await prepareExecutable(options);
  const seed = await persistentSeed(directory, options.seed);
  const launchOptions = buildLaunchOptions({...options, seed});
  await verifyCustomBinary({...launchOptions, engineMode: options.engineMode});
  const context = await chromium.launchPersistentContext(directory, {
    ...launchOptions, ...contextOptionsFor(options)
  });
  if (options.humanize) humanizeBrowser(context, options.humanConfig);
  return context;
}

export async function launchContext(options = {}) {
  options=await prepareExecutable(options);
  const directory = await mkdtemp(join(tmpdir(), 'custom-browser-'));
  try {
    const context = await launchPersistentContext(directory, options);
    const close = context.close.bind(context);
    context.close = async (...args) => {try {return await close(...args);} finally {await rm(directory, {recursive: true, force: true});}};
    return context;
  } catch(error) {await rm(directory, {recursive: true, force: true}); throw error;}
}
