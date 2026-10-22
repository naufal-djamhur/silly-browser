#!/usr/bin/env node
import {browserPath,browserStatus,installBrowser} from './browser-manager.mjs';

const [command='help',...args]=process.argv.slice(2);
try {
  if (args.length) throw Error('Unexpected arguments. Use SILLY_BROWSER_REVISION and SILLY_BROWSER_CACHE_DIR for configuration.');
  if (command==='install') console.log(await installBrowser());
  else if (command==='path') console.log(browserPath());
  else if (command==='status') console.log(JSON.stringify(browserStatus(),null,2));
  else if (['help','--help','-h'].includes(command)) console.log('silly-browser install | path | status\nThe SDK installs a pinned runtime automatically on first launch when a qualified release is available.\nEnvironment: SILLY_BROWSER_EXECUTABLE_PATH, SILLY_BROWSER_CACHE_DIR, SILLY_BROWSER_REVISION, SILLY_BROWSER_SKIP_DOWNLOAD=1');
  else throw Error(`Unknown command: ${command}`);
} catch(error) {console.error(error.message);process.exitCode=1}
