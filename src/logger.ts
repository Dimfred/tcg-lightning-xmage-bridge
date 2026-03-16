export interface Logger {
  info(msg: string, ...args: unknown[]): void;
  info(obj: object, msg: string, ...args: unknown[]): void;
  debug(msg: string, ...args: unknown[]): void;
  debug(obj: object, msg: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;
  warn(obj: object, msg: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;
  error(obj: object, msg: string, ...args: unknown[]): void;
}

export type LoggerFactory = (origin: string) => Logger;

function consoleLoggerFactory(origin: string): Logger {
  const prefix = `[${origin}]`;
  return {
    info: (...args: unknown[]) => console.log(new Date().toISOString(), prefix, ...args),
    debug: (...args: unknown[]) => console.debug(new Date().toISOString(), prefix, ...args),
    warn: (...args: unknown[]) => console.warn(new Date().toISOString(), prefix, ...args),
    error: (...args: unknown[]) => console.error(new Date().toISOString(), prefix, ...args),
  };
}

let _factory: LoggerFactory = consoleLoggerFactory;

export function setLoggerFactory(factory: LoggerFactory): void {
  _factory = factory;
}

export function createLogger(origin: string): Logger {
  return _factory(origin);
}
