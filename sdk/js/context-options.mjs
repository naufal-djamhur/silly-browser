export const contextOptionKeys = Object.freeze(['locale', 'timezone', 'viewport']);

// Context emulation stays scoped to the caller's BrowserContext.
export function buildContextOptions(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options))
    throw new TypeError('Context options must be an object');
  for (const key of Object.keys(options))
    if (!contextOptionKeys.includes(key)) throw new TypeError(`Unknown context option: ${key}`);
  const result = {};
  for (const [key, target] of [['locale', 'locale'], ['timezone', 'timezoneId']]) {
    const value = options[key];
    if (value === undefined || value === null) continue;
    if (typeof value !== 'string' || !value || /[\s\x00]/u.test(value))
      throw new TypeError(`${key} must be a nonempty string without whitespace or NUL`);
    // The browser validates locale/timezone semantics against its own ICU data.
    result[target] = value;
  }
  const viewport = options.viewport;
  if (viewport === undefined || viewport === null) result.viewport = null;
  else {
    if (typeof viewport !== 'object' || Array.isArray(viewport) ||
        Object.keys(viewport).length !== 2 || !Object.hasOwn(viewport, 'width') || !Object.hasOwn(viewport, 'height') ||
        ![viewport.width, viewport.height].every(value => Number.isInteger(value) && value > 0 && value <= 2147483647))
      throw new TypeError('viewport must be null or contain positive int32 width and height');
    result.viewport = {width: viewport.width, height: viewport.height};
  }
  return result;
}
