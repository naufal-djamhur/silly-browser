const wrapped = new WeakSet();
const originalClicks = new WeakMap();
const allowed = new Set(['durationMs', 'typingDelayMs', 'scrollSteps', 'seed']);
function config(defaults = {}, overrides = {}) {
  const c = {durationMs: 300, typingDelayMs: 55, scrollSteps: 8, seed: 1, ...defaults, ...overrides};
  for (const key of Object.keys(c)) if (!allowed.has(key)) throw new TypeError(`Unknown humanConfig key: ${key}`);
  for (const key of allowed) if (!Number.isFinite(c[key]) || c[key] < 0) throw new TypeError(`Invalid ${key}`);
  if (!Number.isInteger(c.scrollSteps) || c.scrollSteps < 1 || c.scrollSteps > 1000 || c.durationMs > 10000 || c.typingDelayMs > 5000) throw new TypeError('humanConfig out of bounds');
  return c;
}
export const validateHumanConfig = defaults => config(defaults);
function random(seed) {let s = seed >>> 0; return () => {s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296;};}
export function motionPoints(start, end, settings) {
  if (![start.x,start.y,end.x,end.y].every(Number.isFinite)) throw new TypeError('Mouse coordinates must be finite');
  const bend=(random(settings.seed)()-0.5)*80;
  const p1={x:start.x+(end.x-start.x)/3,y:start.y+(end.y-start.y)/3+bend};
  const p2={x:start.x+2*(end.x-start.x)/3,y:start.y+2*(end.y-start.y)/3-bend};
  return Array.from({length:Math.max(1,Math.ceil(settings.durationMs/16))},(_,index)=>{
    const t=(index+1)/Math.max(1,Math.ceil(settings.durationMs/16)),u=1-t;
    return {x:u*u*u*start.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*end.x,y:u*u*u*start.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*end.y};
  });
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function wrapPage(page, defaults) {
  if (wrapped.has(page)) return;
  wrapped.add(page);
  let position = {x: 0, y: 0};
  const nativeMove = page.mouse.move.bind(page.mouse);
  const nativeWheel = page.mouse.wheel.bind(page.mouse);
  const nativeMouseClick = page.mouse.click.bind(page.mouse);
  const nativeType = page.keyboard.type.bind(page.keyboard);
  page.mouse.move = async (x, y, opts = {}) => {
    const {humanConfig, ...native} = opts, c = config(defaults, humanConfig);
    const points=motionPoints(position,{x,y},c);
    for (const point of points) {
      if (page.isClosed()) throw new Error('Page closed during motion');
      position = point;
      await nativeMove(position.x, position.y, native);
      await sleep(c.durationMs / points.length);
    }
  };
  page.mouse.wheel = async (dx, dy, opts = {}) => {
    const c = config(defaults, opts.humanConfig);
    for(let i=0;i<c.scrollSteps;i++) {await nativeWheel(dx/c.scrollSteps, dy/c.scrollSteps); await sleep(c.durationMs/c.scrollSteps);}
  };
  page.mouse.click = async (x,y,opts={}) => {
    const {humanConfig,...native}=opts;
    await page.mouse.move(x,y,{humanConfig});
    return nativeMouseClick(x,y,native);
  };
  page.keyboard.type = async (text, opts = {}) => {
    const {humanConfig, ...native} = opts, c = config(defaults, humanConfig), r=random(c.seed);
    for(const char of text) {await nativeType(char, {...native, delay:0}); await sleep(c.typingDelayMs*(0.7+0.6*r()));}
  };
  // Explicit helpers preserve Playwright's normal methods and auto-wait semantics.
  page.humanClick = async (locator, opts = {}) => {
    const {humanConfig, ...native} = opts;
    const deadline = Date.now() + (native.timeout ?? 30000);
    const remaining = () => {const n=deadline-Date.now(); if(n<=0) throw new Error('Humanized action timed out'); return n;};
    const nativeClick=originalClicks.get(locator)??locator.click.bind(locator);
    await nativeClick({...native, trial:true, timeout:remaining()});
    await locator.scrollIntoViewIfNeeded({timeout:remaining()});
    const box=await locator.boundingBox();
    if(!box) throw new Error('Target no longer has a bounding box');
    await page.mouse.move(box.x+box.width/2, box.y+box.height/2, {humanConfig});
    // Playwright revalidates moved/covered targets immediately before dispatch.
    await nativeClick({...native, timeout:remaining()});
  };
  page.humanType = async (locator, text, opts = {}) => {
    await locator.fill('', {timeout:opts.timeout});
    await locator.focus({timeout:opts.timeout});
    await page.keyboard.type(text, {humanConfig:opts.humanConfig});
  };
  function wrapLocator(locator) {
    if(originalClicks.has(locator))return locator;
    originalClicks.set(locator,locator.click.bind(locator));
    locator.click=opts=>page.humanClick(locator,opts);
    for(const name of ['locator','getByRole','getByText','getByLabel','getByPlaceholder','getByTestId','filter','first','last','nth']) {
      if(typeof locator[name]!=='function')continue;
      const native=locator[name].bind(locator);
      locator[name]=(...args)=>wrapLocator(native(...args));
    }
    return locator;
  }
  for(const name of ['locator','getByRole','getByText','getByLabel','getByPlaceholder','getByTestId']) {
    const native=page[name].bind(page);
    page[name]=(...args)=>wrapLocator(native(...args));
  }
}
export function humanizeBrowser(browserOrContext, humanConfig = {}) {
  config(humanConfig);
  if(wrapped.has(browserOrContext)) return browserOrContext;
  wrapped.add(browserOrContext);
  const wrapContext = context => {
    for(const page of context.pages()) wrapPage(page,humanConfig);
    context.on('page', page=>wrapPage(page,humanConfig));
  };
  if(typeof browserOrContext.contexts === 'function') {
    for(const context of browserOrContext.contexts()) wrapContext(context);
    const newContext=browserOrContext.newContext.bind(browserOrContext);
    browserOrContext.newContext=async (...args)=>{const c=await newContext(...args);wrapContext(c);return c;};
    const newPage=browserOrContext.newPage.bind(browserOrContext);
    browserOrContext.newPage=async (...args)=>{const p=await newPage(...args);wrapPage(p,humanConfig);return p;};
  } else wrapContext(browserOrContext);
  return browserOrContext;
}
