// Centralized dev-friendly logging helpers to avoid RN RedBox overlays from console.error in dev

export const devLog = (...args: any[]) => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
};

// Creates a module-local console that redirects error -> devLog (no overlay in dev)
export const createLocalConsole = () => ({
  ...globalThis.console,
  error: (...args: any[]) => devLog(...args),
}) as Console;

