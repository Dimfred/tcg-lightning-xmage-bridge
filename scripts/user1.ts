import { config } from '../src/config';
import { XmageClient } from '../src/client';
import { createLogger } from '../src/logger';
import { MatchTimeLimit, MulliganType, PlayerType, SkillLevel } from '../src/generated/common';
import { DeckType, GameType } from '../src/controllers/lobby/lobby.dto';
import { testDeck } from './deck';
import { attachGameUI } from './terminal-ui';

const logger = createLogger('user1');

async function main() {
  const client = new XmageClient(config.websocketUrl);
  client.on('*', (msg) => {
    const m = msg as { event?: string };
    // Only log callback events we might be missing
    if (m.event?.startsWith('callback.')) {
      logger.info({ event: m.event }, 'CALLBACK');
    }
  });

  await client.connect();
  await client.auth.login('user1');
  logger.info('Logged in');

  const table = await client.lobby.createTable({
    name: 'Test Game',
    gameType: GameType.TWO_PLAYER_DUEL,
    deckType: DeckType.PAUPER,
    winsNeeded: 1,
    rollbackTurnsAllowed: true,
    spectatorsAllowed: true,
    rated: false,
    password: '',
    timeLimit: MatchTimeLimit.MATCH_TIME_MIN_20,
    mulliganType: MulliganType.MULLIGAN_LONDON,
    freeMulligans: 0,
    quitRatio: 0,
    skillLevel: SkillLevel.SKILL_CASUAL,
  });
  const tableId = table.table!.tableId;
  logger.info({ tableId }, 'Created table');

  await client.lobby.joinTable({
    tableId,
    playerName: 'user1',
    playerType: PlayerType.PLAYER_HUMAN,
    skill: 1,
    deck: testDeck,
    password: '',
  });
  logger.info('Joined table. Waiting for opponent... run: make run-user2');

  attachGameUI(client, 'user1');

  let matchStarted = false;
  while (!matchStarted) {
    const result = await client.lobby.startMatch({ tableId });
    if (result.success) {
      matchStarted = true;
      logger.info('Match started!');
    } else {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Keep alive
  await new Promise(() => {});
}

main();
