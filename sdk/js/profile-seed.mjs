import {randomBytes} from 'node:crypto';
import {mkdir,readFile,open,link,rm} from 'node:fs/promises';
import {join} from 'node:path';

export async function persistentSeed(directory,explicit){
  await mkdir(directory,{recursive:true});
  if(explicit!==undefined)return String(explicit);
  const file=join(directory,'.custom-browser-seed');
  try {
    const value=(await readFile(file,'utf8')).trim();
    if(!/^\d+$/.test(value)||BigInt(value)>18446744073709551615n)throw Error('Corrupt persistent seed; repair it explicitly');
    return value;
  } catch(error){if(error.code!=='ENOENT')throw error}
  const temporary=`${file}.${randomBytes(12).toString('hex')}.tmp`;
  const value=randomBytes(8).readBigUInt64LE().toString();
  try {
    const handle=await open(temporary,'wx',0o600);
    try {await handle.writeFile(value+'\n');await handle.sync()} finally {await handle.close()}
    // Publishing a fully written inode avoids a reader observing an empty file.
    // link() is atomic and cannot overwrite the winner of a concurrent launch.
    try {await link(temporary,file)}
    catch(error){if(error.code!=='EEXIST')throw new Error('Profile filesystem must support atomic hard-link seed publication',{cause:error})}
  } finally {await rm(temporary,{force:true})}
  return persistentSeed(directory);
}
