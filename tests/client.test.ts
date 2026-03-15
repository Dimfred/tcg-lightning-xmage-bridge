import { describe, it, expect } from 'bun:test';
import { XmageClient } from '../src/client';

describe('XmageClient', () => {
  it('should connect to the websocket proxy', async () => {
    const client = new XmageClient('ws://localhost:17280/ws');

    await client.connect();
    expect(client.connected).toBe(true);

    client.disconnect();
    expect(client.connected).toBe(false);
  });
});
