import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fontManifest,verifyFonts} from 'silly-browser-fonts';
import {launch} from '../sdk/js/index.mjs';

const executablePath=process.env.CUSTOM_BROWSER_EXECUTABLE;
const release=process.env.CUSTOM_BROWSER_RELEASE??'155.0.8059.80';
const hash=async path=>{const h=createHash('sha256');for await(const chunk of createReadStream(path))h.update(chunk);return h.digest('hex')};

test('native optional Noto pack loads and renders ten real faces in both modes',{skip:!executablePath,timeout:180000},async()=>{
  await verifyFonts();
  const observations=[];let completed=false;
  const server=createServer((request,response)=>{response.setHeader('Content-Type','text/html');response.end('<!doctype html><title>Native Noto font fixture</title>')});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  async function sample(headless,configured) {
    const browser=await launch({executablePath,headless,...(configured?{fontPack:'noto-core'}:{})});
    try {
      assert.equal(browser.version(),release);
      const page=await browser.newPage();await page.goto(url);
      return await page.evaluate(async files=>{
        const results=[];
        for(const [index,entry] of files.entries()){
          const family=`NativePackFixture${index}`;
          const face=new FontFace(family,`local("${entry.postscriptName}")`);
          try {
            await face.load();document.fonts.add(face);
            const canvas=document.createElement('canvas'),context=canvas.getContext('2d');context.font=`20px ${family}`;context.fontKerning='none';
            results.push({file:entry.file,available:true,width:context.measureText('MMMM').width});
            document.fonts.delete(face);
          }catch(error){results.push({file:entry.file,available:false,error:error.name})}
        }
        return results;
      },fontManifest.files);
    }finally{await browser.close()}
  }
  try {
    for(const headless of [true,false]){
      const baseline=await sample(headless,false),configured=await sample(headless,true);
      for(const [index,entry] of fontManifest.files.entries()){
        assert.equal(configured[index].available,true,`Native local() load failed: ${entry.file}`);
        const expected=80*entry.capitalMAdvanceUnits/entry.unitsPerEm;
        assert(Math.abs(configured[index].width-expected)<0.2,`${entry.file}: expected ${expected}, got ${configured[index].width}`);
      }
      observations.push({headless,status:'passed',baseline,configured,previouslyUnavailable:baseline.filter(face=>!face.available).map(face=>face.file)});
    }
    completed=true;
  }finally{
    await new Promise(resolve=>server.close(resolve));
    const output=resolve(process.env.CUSTOM_FONT_PACK_REPORT??'artifacts/native-font-pack/results.json');
    await mkdir(dirname(output),{recursive:true});
    await writeFile(output,JSON.stringify({completed,release,fontPackVersion:fontManifest.version,upstreamFontCommit:fontManifest.upstreamCommit,binarySha256:await hash(executablePath),runtimeSha256:await hash(join(dirname(executablePath),'chrome.dll')),observations,scope:'Native local() loading and advance-width checks for ten packaged fonts in both modes. If a face exists in the baseline, that face does not independently prove package origin. No detector or universal font fallback claim.'},null,2)+'\n');
  }
});
