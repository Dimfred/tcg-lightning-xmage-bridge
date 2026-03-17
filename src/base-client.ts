import { createLogger } from './logger';
import type { DisconnectInfo, ServerError, ServerMessage, XmageMessage } from './types';

export type EventHandler = (data: unknown) => void;

export class BaseClient {
  private readonly logger = createLogger('BaseClient');
  private ws: WebSocket | null = null;
  private readonly url: string;
  private readonly handlers = new Map<string, EventHandler[]>();
  private readonly namedHandlers = new Map<string, EventHandler>();

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.info({ url: this.url }, 'Connecting to WebSocket');
      this.ws = new WebSocket(this.url);

      this.ws.addEventListener('open', () => {
        this.logger.info('WebSocket connected');
        this.emit('ws.connected', null);
        resolve();
      });

      this.ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data as string) as XmageMessage;
        this.emit(msg.type, msg.payload);
      });

      this.ws.addEventListener('close', (event) => {
        this.logger.info({ code: event.code, reason: event.reason }, 'WebSocket disconnected');
        this.emit('ws.disconnected', { code: event.code, reason: event.reason });
        this.ws = null;
      });

      this.ws.addEventListener('error', (event) => {
        this.logger.error({ event }, 'WebSocket error');
        this.emit('ws.error', event);
        reject(event);
      });
    });
  }

  disconnect(): void {
    if (!this.ws) return;
    this.ws.close();
    this.ws = null;
  }

  send(type: string, payload?: unknown): void {
    if (!this.ws) throw new Error('Not connected');
    this.logger.debug({ type, payload }, 'Sending message');
    const msg: XmageMessage = { type, payload };
    this.ws.send(JSON.stringify(msg));
  }

  request<T>(type: string, payload?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const responseType = type.replace(/\.[^.]+$/, '.response');
      const errorType = type.replace(/\.[^.]+$/, '.error');

      const cleanup = () => {
        this.off(responseType, onResponse);
        this.off(errorType, onError);
      };

      const onResponse = (data: unknown) => {
        cleanup();
        resolve(data as T);
      };

      const onError = (data: unknown) => {
        cleanup();
        const err = data as { error?: string };
        reject(new Error(err?.error ?? 'Unknown error'));
      };

      this.on(responseType, onResponse);
      this.on(errorType, onError);
      this.send(type, payload);
    });
  }

  // -- Typed client-level subscriptions --
  // Call with handler to subscribe, call without to unsubscribe

  onDisconnected(handler?: (info: DisconnectInfo) => void): void {
    this.toggleHandler('ws.disconnected', handler);
  }

  onError(handler?: (event: unknown) => void): void {
    this.toggleHandler('ws.error', handler);
  }

  onServerError(handler?: (error: ServerError) => void): void {
    this.toggleHandler('server.error', handler);
  }

  onServerMessage(handler?: (msg: ServerMessage) => void): void {
    this.toggleHandler('server.message', handler);
  }

  onAny(handler?: (event: string, data: unknown) => void): void {
    if (handler) {
      const wrapped: EventHandler = (data) => {
        const { event, data: eventData } = data as { event: string; data: unknown };
        handler(event, eventData);
      };
      this.namedHandlers.set('*', wrapped);
      this.on('*', wrapped);
      return;
    }

    const existing = this.namedHandlers.get('*');
    if (existing) {
      this.off('*', existing);
      this.namedHandlers.delete('*');
    }
  }

  // -- Internal helpers --

  /** @internal */
  // biome-ignore lint: handler accepts any function signature
  toggleHandler(event: string, handler?: (...args: any[]) => void): void {
    if (handler) {
      const wrapped: EventHandler = (data) => handler(data as never);
      this.namedHandlers.set(event, wrapped);
      this.on(event, wrapped);
      return;
    }

    const existing = this.namedHandlers.get(event);
    if (existing) {
      this.off(event, existing);
      this.namedHandlers.delete(event);
    }
  }

  /** @internal */
  on(event: string, handler: EventHandler): void {
    const existing = this.handlers.get(event) ?? [];
    existing.push(handler);
    this.handlers.set(event, existing);
  }

  /** @internal */
  off(event: string, handler: EventHandler): void {
    const existing = this.handlers.get(event);
    if (!existing) return;
    const idx = existing.indexOf(handler);
    if (idx !== -1) existing.splice(idx, 1);
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private emit(event: string, data: unknown): void {
    const handlers = this.handlers.get(event);
    const wildcardHandlers = this.handlers.get('*');

    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        handler({ event, data });
      }
    }

    if (!handlers) {
      if (!wildcardHandlers) {
        this.logger.warn({ event, data }, 'No handler registered for event');
      }
      return;
    }
    for (const handler of handlers) {
      handler(data);
    }
  }
}
