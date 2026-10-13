import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm,readFile } from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {launchContext,launchPersistentContext,humanizeBrowser} from '../sdk/js/index.mjs';
const executablePath=process.env.TEST_CHROMIUM_EXECUTABLE;
test('real browser: paced input, actionability, persistence and cleanup',{skip:!executablePath,timeout:60000},async()=>{
  const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<input id="field"><button disabled id="go">Go</button><div id="result"></div><script>setTimeout(()=>go.disabled=false,400);go.onclick=()=>result.textContent=field.value</script>');});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${server.address().port}`;
  const directory=await mkdtemp(join(tmpdir(),'custom-browser-test-'));
  let context;
  try {
    const options={executablePath,engineMode:'baseline',humanize:true,humanConfig:{durationMs:32,typingDelayMs:1}};
    context=await launchPersistentContext(directory,options);
    humanizeBrowser(context); // Idempotence must not duplicate input.
    const page=await context.newPage();await page.goto(url);
    await page.humanType(page.locator('#field'),'Hello');
    await page.humanClick(page.locator('#go'));
    assert.equal(await page.locator('#result').innerText(),'Hello');
    await page.evaluate(()=>localStorage.setItem('persisted','yes'));
    await context.addCookies([{name:'persistent',value:'yes',url,expires:Math.floor(Date.now()/1000)+3600}]);
    const seed=await readFile(join(directory,'.custom-browser-seed'),'utf8');
    await context.close();context=await launchPersistentContext(directory,options);
    const reopened=await context.newPage();await reopened.goto(url);
    assert.equal(await reopened.evaluate(()=>localStorage.getItem('persisted')),'yes');
    assert((await context.cookies()).some(c=>c.name==='persistent'));
    assert.equal(await readFile(join(directory,'.custom-browser-seed'),'utf8'),seed);
    await context.close();context=await launchContext(options);await context.close();context=null;
  } finally {if(context)await context.close();await new Promise(r=>server.close(r));await rm(directory,{recursive:true,force:true});}
});
