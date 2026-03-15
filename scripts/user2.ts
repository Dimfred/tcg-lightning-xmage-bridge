import { config } from '../src/config';
import { XmageClient } from '../src/client';
import { createLogger } from '../src/logger';
import { PlayerType } from '../src/generated/common';
import { testDeck } from './deck';
import { attachGameUI } from './terminal-ui';

const logger = createLogger('user2');

async function main() {
  const client = new XmageClient(config.websocketUrl);
  client.on('*', (msg) => {
    const m = msg as { event?: string };
    if (m.event?.startsWith('callback.')) {
      logger.info({ event: m.event }, 'CALLBACK');
    }
  });

  await client.connect();
  await client.auth.login('user2');
  logger.info('Logged in');

  const tables = await client.lobby.getTables();
  if (!tables.tables || tables.tables.length === 0) {
    logger.error('No tables found, start user1 first');
    process.exit(1);
  }

  const tableId = tables.tables[0]!.tableId;
  logger.info({ tableId }, 'Found table');

  await client.lobby.joinTable({
    tableId,
    playerName: 'user2',
    playerType: PlayerType.PLAYER_HUMAN,
    skill: 1,
    deck: testDeck,
    password: '',
  });
  logger.info('Joined table');

  attachGameUI(client, 'user2');

  // Keep alive
  await new Promise(() => {});
}

main();
