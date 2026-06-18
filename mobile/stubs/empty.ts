// Empty stub — replaces server-only modules in the mobile SPA build
const noop = () => {};
const noopObj: any = {};

// Common named exports expected from various TanStack Start server packages
export const AsyncLocalStorage = class {};
export const getStartContext = noop;
export const setStartContext = noop;
export const createStartContext = noop;
export const createServerFn = () => ({
  handler: () => ({}),
  inputValidator: () => ({ handler: () => ({}) }),
  validator: () => ({ handler: () => ({}) }),
});
export const useServerFn = (fn: any) => fn;
export const getRouterManifest = noop;
export const mergeHeaders = noop;
export const getRequestHeaders = noop;
export const getResponseHeaders = noop;
export const getEvent = noop;
export const defineMiddleware = noop;

export default noopObj;
