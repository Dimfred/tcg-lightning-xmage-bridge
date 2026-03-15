import { config } from '../src/config';
import { XmageClient } from '../src/client';
import { createLogger } from '../src/logger';

const logger = createLogger('user1');

async function main() {
  const client = new XmageClient(config.websocketUrl);

  await client.connect();
  logger.info('Connected to proxy');

  const loginResult = await client.auth.login('user1');
  logger.info({ loginResult }, 'Logged in');

  const tables = await client.lobby.getTables();
  logger.info({ tables }, 'Tables');

  const users = await client.lobby.getUsers();
  logger.info({ users }, 'Users');

  client.disconnect();
}

main();
