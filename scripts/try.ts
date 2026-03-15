import { config } from '../src/config';
import { XmageClient } from '../src/client';
import { createLogger } from '../src/logger';
import { MatchTimeLimit, MulliganType, PlayerType, SkillLevel } from '../src/generated/common';
import type { CreateTableRequest } from '../src/generated/lobby/lobby';
import { DeckType, GameType } from '../src/controllers/lobby/lobby.dto';

const logger = createLogger('try');

const testDeck = {
  name: 'Test Deck',
  cards: [
    { cardName: 'Lightning Bolt', setCode: 'M10', cardNumber: '146', amount: 4 },
    { cardName: 'Mountain', setCode: 'M10', cardNumber: '242', amount: 56 },
  ],
  sideboard: [],
};

async function main() {
  // --- User 1: create table and join ---
  const user1 = new XmageClient(config.websocketUrl);
  await user1.connect();
  await user1.auth.login('user1');
  logger.info('User1 logged in');

  const createTableOptions: CreateTableRequest = {
    name: 'Test Game',
    gameType: GameType.TWO_PLAYER_DUEL,
    deckType: DeckType.STANDARD,
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
  };

  const table = await user1.lobby.createTable(createTableOptions);
  logger.info({ tableId: table.table!.tableId }, 'User1 created table');

  await user1.lobby.joinTable({
    tableId: table.table!.tableId,
    playerName: 'user1',
    playerType: PlayerType.PLAYER_HUMAN,
    skill: 1,
    deck: testDeck,
    password: '',
  });
  logger.info('User1 joined table');

  // --- User 2: join the same table ---
  const user2 = new XmageClient(config.websocketUrl);
  await user2.connect();
  await user2.auth.login('user2');
  logger.info('User2 logged in');

  await user2.lobby.joinTable({
    tableId: table.table!.tableId,
    playerName: 'user2',
    playerType: PlayerType.PLAYER_HUMAN,
    skill: 1,
    deck: testDeck,
    password: '',
  });
  logger.info('User2 joined table');

  // keep connections alive to see what happens
  logger.info('Both users joined. Waiting for game events...');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  user1.disconnect();
  user2.disconnect();
  logger.info('Done');
}

main();
