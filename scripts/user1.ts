import { config } from '../src/config';
import { XmageClient } from '../src/client';
import { createLogger } from '../src/logger';

const logger = createLogger('user1');

async function main() {
  const client = new XmageClient(config.websocketUrl);

  await client.connect();
  logger.info('Connected to proxy');

  const result = await client.auth.login('user1');
  logger.info({ result }, 'Logged in');

  client.disconnect();
}

main();
