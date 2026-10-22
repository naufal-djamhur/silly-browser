import {createHash} from 'node:crypto';
import {createReadStream, createWriteStream, existsSync, lstatSync, readFileSync} from 'node:fs';
import {mkdir, mkdtemp, open, rename, rm, stat, writeFile, lstat} from 'node:fs/promises';
import {homedir, platform, arch} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {Readable, Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import yauzl from 'yauzl';

const catalog = JSON.parse(readFileSync(new URL('./releases.json', import.meta.url), 'utf8'));
const marker = '.silly-browser-install.json';
const maxArchive = 2 * 1024 ** 3, maxTotal = 8 * 1024 ** 3;
const pending = 'No published Silly Browser runtime is available for this platform/revision yet. Use executablePath (or SILLY_BROWSER_EXECUTABLE_PATH) for a local build; see https://github.com/naufal-djamhur/silly-browser/releases.';

export function hostPlatform() {
  const os = {win32:'windows', darwin:'macos', linux:'linux'}[platform()];
  if (!os || !['x64','arm64'].includes(arch())) throw Error('Unsupported host platform/architecture');
  return `${os}-${arch()}`;
}

export function browserCacheDir() {
  if (process.env.SILLY_BROWSER_CACHE_DIR) return resolve(process.env.SILLY_BROWSER_CACHE_DIR);
  if (platform() === 'win32') return join(process.env.LOCALAPPDATA || join(homedir(),'AppData','Local'), 'silly-browser','Cache');
  if (platform() === 'darwin') return join(homedir(),'Library','Caches','silly-browser');
  return join(process.env.XDG_CACHE_HOME || join(homedir(),'.cache'),'silly-browser');
}

export function safeArchivePath(value) {
  if (typeof value !== 'string' || !value || value.length > 1024 || value.includes('\\')) throw Error('Unsafe archive path');
  const parts=value.split('/');
  if (parts.some(p=>!p || p==='.' || p==='..' || /[<>:"|?*\x00-\x1f]/.test(p) || /[. ]$/.test(p) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(p))) throw Error('Unsafe archive path');
  if (value===marker) throw Error('Reserved installer path');
  return parts;
}

function releaseUrl(value, redirect=false) {
  const url=new URL(value);
  if (url.protocol!=='https:' || url.username || url.password || url.hash || (url.port && url.port!=='443')) throw Error('Release downloads require an approved HTTPS URL');
  if (redirect && ['release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(url.hostname)) return url;
  if (url.hostname!=='github.com' || url.search || !/^\/naufal-djamhur\/silly-browser\/releases\/download\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\.zip$/.test(url.pathname)) throw Error('Release URL must belong to the official silly-browser repository');
  return url;
}

export function selectRelease(source=catalog, revision=process.env.SILLY_BROWSER_REVISION, host=hostPlatform()) {
  if (!/^(windows|linux|macos)-(x64|arm64)$/.test(host)) throw Error('Invalid host platform');
  if (source?.schemaVersion!==1 || !Array.isArray(source.releases)) throw Error('Unsupported release catalog');
  const selected=revision || source.defaultRevision;
  if (!selected) throw Error(pending);
  if (typeof selected!=='string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/.test(selected) || selected.includes('..')) throw Error('Invalid browser revision');
  const matches=source.releases.filter(r=>r.revision===selected && r.platform===host);
  if (matches.length!==1) throw Error(pending);
  const entry=matches[0];
  releaseUrl(entry.url);
  if (!/^[a-f0-9]{64}$/.test(entry.sha256) || !Number.isSafeInteger(entry.size) || entry.size<=0 || entry.size>maxArchive) throw Error('Invalid release archive metadata');
  const files=entry.files;
  if (!files || typeof files!=='object' || Array.isArray(files) || !Object.keys(files).length || Object.keys(files).length>20000) throw Error('Invalid release file inventory');
  let total=0; const names=new Set();
  for (const [name,metadata] of Object.entries(files)) {
    safeArchivePath(name);
    if (names.has(name.toLowerCase())) throw Error('Duplicate release path');
    names.add(name.toLowerCase());
    if (!/^[a-f0-9]{64}$/.test(metadata.sha256) || !Number.isSafeInteger(metadata.size) || metadata.size<0 || metadata.size>4*1024**3) throw Error('Invalid release file metadata');
    total+=metadata.size;
  }
  if (total>maxTotal || !Object.hasOwn(files,entry.executable)) throw Error('Invalid release runtime inventory');
  safeArchivePath(entry.executable);
  return entry;
}

const hash=async path=>{const h=createHash('sha256');for await(const chunk of createReadStream(path))h.update(chunk);return h.digest('hex')};
function location(entry, cacheDir) {return join(resolve(cacheDir),entry.revision,entry.platform)}
function cachedPath(entry, cacheDir) {
  const directory=location(entry,cacheDir), executable=join(directory,...safeArchivePath(entry.executable));
  if (!existsSync(directory)) return null;
  if (lstatSync(directory).isSymbolicLink()) throw Error('Browser cache must not be a symlink');
  const identity=JSON.parse(readFileSync(join(directory,marker),'utf8'));
  if (identity.archiveSha256!==entry.sha256 || !lstatSync(executable).isFile() || lstatSync(executable).isSymbolicLink()) throw Error('Incomplete or invalid browser cache');
  return executable;
}

export function browserPath({revision, cacheDir=browserCacheDir()}={}) {
  if (process.env.SILLY_BROWSER_EXECUTABLE_PATH) return resolve(process.env.SILLY_BROWSER_EXECUTABLE_PATH);
  const entry=selectRelease(catalog,revision);
  const path=cachedPath(entry,cacheDir);
  if (!path) throw Error('Browser is not installed. Run npx silly-browser install, or call installBrowser().');
  return path;
}

async function verifyFiles(directory, entry) {
  for (const [name,expected] of Object.entries(entry.files)) {
    const parts=safeArchivePath(name);
    for (let n=1;n<=parts.length;n++) if ((await lstat(join(directory,...parts.slice(0,n)))).isSymbolicLink()) throw Error('Symlink in browser cache');
    const path=join(directory,...parts), metadata=await stat(path);
    if (!metadata.isFile() || metadata.size!==expected.size || await hash(path)!==expected.sha256) throw Error(`Browser file integrity failure: ${name}`);
  }
}

async function download(entry, destination, fetchImpl) {
  let url=releaseUrl(entry.url), response;
  for (let i=0;i<6;i++) {
    response=await fetchImpl(url,{redirect:'manual',signal:AbortSignal.timeout(600000),headers:{'User-Agent':'silly-browser/0.1.0'}});
    if ([301,302,303,307,308].includes(response.status)) {
      const next=response.headers.get('location');await response.body?.cancel();
      if (!next) throw Error('Invalid download redirect');
      url=releaseUrl(new URL(next,url),true);continue;
    }
    break;
  }
  if (!response?.ok || !response.body) throw Error(`Browser download failed (HTTP ${response?.status})`);
  let received=0; const digest=createHash('sha256');
  const limiter=new Transform({transform(chunk,encoding,callback){received+=chunk.length;if(received>entry.size)return callback(Error('Browser download exceeds pinned size'));digest.update(chunk);callback(null,chunk)}});
  await pipeline(Readable.fromWeb(response.body),limiter,createWriteStream(destination,{flags:'wx',mode:0o600}));
  if (received!==entry.size || digest.digest('hex')!==entry.sha256) throw Error('Browser archive checksum/size mismatch');
}

export async function extractRuntime(archive, directory, entry) {
  const zip=await new Promise((yes,no)=>yauzl.open(archive,{lazyEntries:true,autoClose:false,validateEntrySizes:true},(e,z)=>e?no(e):yes(z)));
  const seen=new Set();let count=0;
  try {
    await new Promise((yes,no)=>{
      zip.on('error',no);zip.on('end',yes);
      zip.on('entry',member=>{
        (async()=>{
          if (++count>20000) throw Error('Too many archive entries');
          const isDirectory=member.fileName.endsWith('/'), name=isDirectory?member.fileName.slice(0,-1):member.fileName;
          const parts=safeArchivePath(name), kind=(member.externalFileAttributes>>>16)&0xf000;
          if ((kind!==0 && kind!==0x8000 && kind!==0x4000) || (member.generalPurposeBitFlag&1)) throw Error('Unsupported archive entry type');
          if (seen.has(name.toLowerCase())) throw Error('Duplicate archive entry');
          seen.add(name.toLowerCase());
          if (isDirectory) {zip.readEntry();return}
          const expected=entry.files[name];
          if (!expected || member.uncompressedSize!==expected.size) throw Error('Archive differs from release inventory');
          const target=join(directory,...parts);await mkdir(dirname(target),{recursive:true});
          const input=await new Promise((yes,no)=>zip.openReadStream(member,(e,s)=>e?no(e):yes(s)));
          let size=0;
          const limiter=new Transform({transform(chunk,encoding,callback){size+=chunk.length;callback(size>expected.size?Error('Archive entry exceeds pinned size'):null,chunk)}});
          await pipeline(input,limiter,createWriteStream(target,{flags:'wx',mode:name===entry.executable?0o755:0o644}));
          if (size!==expected.size) throw Error('Truncated archive entry');
          zip.readEntry();
        })().catch(no);
      });
      zip.readEntry();
    });
    await verifyFiles(directory,entry);
  } finally {zip.close()}
}

export async function installBrowser({revision, cacheDir=browserCacheDir(), releaseCatalog=catalog, fetchImpl=globalThis.fetch}={}) {
  const entry=selectRelease(releaseCatalog,revision), root=resolve(cacheDir), parent=join(root,entry.revision);
  const existing=cachedPath(entry,root);
  if (existing) {await verifyFiles(location(entry,root),entry);return existing}
  if (process.env.SILLY_BROWSER_SKIP_DOWNLOAD==='1') throw Error('Browser download disabled by SILLY_BROWSER_SKIP_DOWNLOAD=1');
  await mkdir(parent,{recursive:true});
  for (const path of [root,parent]) if ((await lstat(path)).isSymbolicLink()) throw Error('Browser cache must not be a symlink');
  const lockPath=join(parent,`${entry.platform}.lock`);
  let lock;
  try {lock=await open(lockPath,'wx',0o600)} catch(error) {if(error.code==='EEXIST')throw Error('Another browser installation is in progress. Retry when it finishes.');throw error}
  let temporary;
  try {
    await lock.writeFile(String(process.pid));
    temporary=await mkdtemp(join(parent,`.install-${entry.platform}-`));
    const archive=join(temporary,'browser.zip'), runtime=join(temporary,'runtime');await mkdir(runtime);
    await download(entry,archive,fetchImpl);await extractRuntime(archive,runtime,entry);
    await writeFile(join(runtime,marker),JSON.stringify({schemaVersion:1,archiveSha256:entry.sha256,revision:entry.revision,platform:entry.platform})+'\n',{flag:'wx'});
    await rename(runtime,location(entry,root));
    return join(location(entry,root),...safeArchivePath(entry.executable));
  } finally {
    try {if (temporary) await rm(temporary,{recursive:true,force:true})}
    finally {try {await lock.close()} finally {await rm(lockPath,{force:true})}}
  }
}

export async function ensureBrowser() {
  if (process.env.SILLY_BROWSER_EXECUTABLE_PATH) return resolve(process.env.SILLY_BROWSER_EXECUTABLE_PATH);
  return installBrowser();
}

export function browserStatus() {
  const status={platform:hostPlatform(),cacheDirectory:browserCacheDir(),revision:process.env.SILLY_BROWSER_REVISION||catalog.defaultRevision,downloadAvailable:false,installed:false};
  try {const entry=selectRelease();status.downloadAvailable=true;status.executablePath=cachedPath(entry,status.cacheDirectory);status.installed=Boolean(status.executablePath)} catch(error) {status.detail=error.message}
  return status;
}
