import {createRequire} from 'node:module';
import {dirname,join,resolve} from 'node:path';
import {realpathSync} from 'node:fs';
const require=createRequire(import.meta.url);

export function fontDirectoryFor(options) {
  const {fontDirectory,fontPack}=options;
  if(fontDirectory!==undefined && fontPack!==undefined)throw TypeError('Choose fontDirectory or fontPack');
  if(fontDirectory!==undefined){
    if(typeof fontDirectory!=='string' || !fontDirectory || fontDirectory.includes('\x00'))throw TypeError('fontDirectory must be a nonempty path');
    return resolve(fontDirectory);
  }
  if(fontPack===undefined)return undefined;
  if(fontPack!=='noto-core')throw TypeError('Supported fontPack: noto-core');
  let metadata;
  try {metadata=require.resolve('silly-browser-fonts/package.json')}
  catch(error){if(error.code==='MODULE_NOT_FOUND')throw Error('Install the optional font pack: npm install silly-browser-fonts');throw error}
  return realpathSync(join(dirname(metadata),'silly_browser_fonts','fonts'));
}
