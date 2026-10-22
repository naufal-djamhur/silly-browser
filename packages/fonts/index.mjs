import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {readFileSync,realpathSync,createReadStream,readdirSync,lstatSync} from 'node:fs';
import {join} from 'node:path';

export const fontManifest=JSON.parse(readFileSync(new URL('./silly_browser_fonts/manifest.json',import.meta.url),'utf8'));
export function getFontDirectory() {return realpathSync(fileURLToPath(new URL('./silly_browser_fonts/fonts/',import.meta.url)))}
export async function verifyFonts() {
  const directory=getFontDirectory();
  if(JSON.stringify(readdirSync(directory).sort())!==JSON.stringify(fontManifest.files.map(e=>e.file).sort()))throw Error('Font directory differs from the inventory');
  for (const entry of fontManifest.files) {
    const metadata=lstatSync(join(directory,entry.file));
    if(!metadata.isFile() || metadata.isSymbolicLink())throw Error(`Invalid font file: ${entry.file}`);
    const digest=createHash('sha256');let size=0;
    for await(const chunk of createReadStream(join(directory,entry.file))){digest.update(chunk);size+=chunk.length}
    if(size!==entry.size || digest.digest('hex')!==entry.sha256)throw Error(`Font integrity failure: ${entry.file}`);
  }
  return {pack:fontManifest.pack,fonts:fontManifest.files.length,directory,verified:true};
}
