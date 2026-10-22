#!/usr/bin/env node
import {getFontDirectory,verifyFonts} from './index.mjs';
const [command='path',...extra]=process.argv.slice(2);
try {
  if(extra.length)throw Error('Unexpected arguments');
  if(command==='path')console.log(getFontDirectory());
  else if(command==='verify')console.log(JSON.stringify(await verifyFonts(),null,2));
  else throw Error('Usage: silly-browser-fonts path | verify');
}catch(error){console.error(error.message);process.exitCode=1}
