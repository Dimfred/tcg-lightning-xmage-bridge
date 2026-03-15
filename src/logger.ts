import pino from 'pino';

export const glogger = pino({ transport: { target: 'pino-pretty' } });

export function createLogger(origin: string) {
  return glogger.child({ origin });
}
