import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {persistentSeed} from '../sdk/js/profile-seed.mjs';
test('concurrent first callers observe one complete seed and no temporary files',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'custom-browser-seed-test-'));
  try {
    const values=await Promise.all(Array.from({length:48},()=>persistentSeed(directory)));
    assert.equal(new Set(values).size,1);
    assert.equal(await readFile(join(directory,'.custom-browser-seed'),'utf8'),values[0]+'\n');
    assert.deepEqual(await readdir(directory),['.custom-browser-seed']);
    assert.equal(await persistentSeed(directory),values[0]);
  } finally {await rm(directory,{recursive:true,force:true})}
});
test('corrupt seed remains intact; explicit overrides do not rotate stored identity',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'custom-browser-seed-test-'));
  try {
    const file=join(directory,'.custom-browser-seed');await writeFile(file,'broken\n');
    await assert.rejects(persistentSeed(directory),/Corrupt/);
    assert.equal(await persistentSeed(directory,'42'),'42');
    assert.equal(await readFile(file,'utf8'),'broken\n');
  } finally {await rm(directory,{recursive:true,force:true})}
});
