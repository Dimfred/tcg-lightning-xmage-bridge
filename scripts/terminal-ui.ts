import * as readline from 'node:readline';
import { createLogger } from '../src/logger';
import type { XmageClient } from '../src/client';

const logger = createLogger('ui');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let _waitingForInput = false;

function ask(question: string): Promise<string> {
  _waitingForInput = true;
  return new Promise((r) =>
    rl.question(question, (answer) => {
      _waitingForInput = false;
      r(answer);
    }),
  );
}

interface CallbackData {
  method?: string;
  messageId?: number;
  objectId?: string;
  data?: Record<string, unknown>;
}

interface PlayableRecord {
  id?: string;
  value?: string;
}

interface PlayableStats {
  basicManaAbilities?: PlayableRecord[];
  basicPlayAbilities?: PlayableRecord[];
  basicCastAbilities?: PlayableRecord[];
  other?: PlayableRecord[];
}

interface CardInfo {
  name?: string;
  displayName?: string;
  manaCostLeftStr?: string[];
  cardTypes?: string[];
  power?: string;
  toughness?: string;
}

function printGameState(gameView: Record<string, unknown>) {
  const players = gameView.players as Array<Record<string, unknown>>;
  const me = players.find((p) => p.controlled === true);
  const opp = players.find((p) => p.controlled === false);
  const turn = gameView.turn;
  const active = gameView.activePlayerName;
  const priority = gameView.priorityPlayerName;

  const phase = gameView.phase ?? '';
  const step = gameView.step ?? '';
  const phaseStr = step ? `${phase} > ${step}` : `${phase}`;

  console.log(`\n  Turn ${turn} | ${phaseStr} | Active: ${active} | Priority: ${priority}`);
  if (me) console.log(`  You (${me.name}): ${me.life} life, ${me.handCount} cards, ${me.libraryCount} library`);
  if (opp) console.log(`  Opp (${opp.name}): ${opp.life} life, ${opp.handCount} cards, ${opp.libraryCount} library`);
}

function printHand(gameView: Record<string, unknown>) {
  const hand = gameView.myHand as Record<string, CardInfo> | undefined;
  if (!hand) return;

  const cards = Object.values(hand);
  if (cards.length === 0) return;

  console.log('  Hand:');
  for (const card of cards) {
    const mana = card.manaCostLeftStr?.join('') ?? '';
    const pt = card.power && card.toughness && card.power !== '0' ? ` ${card.power}/${card.toughness}` : '';
    console.log(`    ${card.displayName ?? card.name}  ${mana}${pt}`);
  }
}

function printStack(gameView: Record<string, unknown>) {
  const stack = gameView.stack as Record<string, CardInfo> | undefined;
  if (!stack) return;
  const items = Object.values(stack);
  if (items.length === 0) return;

  console.log('  Stack:');
  for (const item of items) {
    const rules = ((item as Record<string, unknown>).rules as string[]) ?? [];
    const cleanRule = rules[0]?.replace(/<[^>]*>/g, '').substring(0, 60) ?? '';
    console.log(`    ${item.displayName ?? item.name}${cleanRule ? ` - ${cleanRule}` : ''}`);
  }
}

function printBattlefield(gameView: Record<string, unknown>) {
  const players = gameView.players as Array<Record<string, unknown>>;
  for (const player of players) {
    const bf = player.battlefield as Record<string, CardInfo> | undefined;
    if (!bf) continue;
    const cards = Object.values(bf);
    if (cards.length === 0) continue;

    console.log(`  ${player.name}'s battlefield:`);
    for (const card of cards) {
      const pt = card.power && card.toughness && card.power !== '0' ? ` ${card.power}/${card.toughness}` : '';
      const tapped = (card as Record<string, unknown>).tapped ? ' (tapped)' : '';
      console.log(`    ${card.displayName ?? card.name}${pt}${tapped}`);
    }
  }
}

export function attachGameUI(client: XmageClient, playerName: string) {
  let gameId: string | null = null;
  let lastUpdateMsg = '';

  // Suppress chatmessage noise
  client.on('callback.chatmessage', () => {});

  client.on('callback.game_target', async (raw) => {
    const cb = raw as CallbackData;
    gameId = cb.objectId ?? gameId;
    const data = cb.data as Record<string, unknown> | undefined;
    if (!data) return;

    const message = data.message as string;
    const targets = (data.targets as string[]) ?? [];
    const gameView = data.gameView as Record<string, unknown> | undefined;

    // Check for card views (used for ordering, searching library, etc.)
    const cardsView1 = data.cardsView1 as Record<string, CardInfo> | undefined;
    const cardEntries = cardsView1 ? Object.entries(cardsView1) : [];

    if (targets.length === 0 && cardEntries.length > 0) {
      // Card selection (e.g. ordering library, searching)
      console.log('\n===================================');
      console.log(`ACTION: ${message}`);
      console.log('===================================');
      if (gameView) printGameState(gameView);
      console.log('-----------------------------------');
      cardEntries.forEach(([, card], i) => {
        const mana = card.manaCostLeftStr?.join('') ?? '';
        console.log(`  ${i + 1}: ${card.displayName ?? card.name}  ${mana}`);
      });
      console.log('===================================');

      const answer = await ask('Choose (number): ');
      const idx = parseInt(answer, 10) - 1;
      if (idx >= 0 && idx < cardEntries.length) {
        const [cardId] = cardEntries[idx]!;
        await client.game.sendPlayerUuid({ gameId: gameId!, data: cardId });
        logger.info({ card: cardEntries[idx]![1].displayName }, 'Selected card');
      }
      return;
    }

    if (targets.length === 0 && cardEntries.length === 0) {
      // No targets and no cards — confirm/done
      if (gameView) printGameState(gameView);
      console.log(`  > ${message}`);
      await client.game.sendPlayerBoolean({ gameId: gameId!, data: true });
      return;
    }

    const players = (gameView?.players as Array<Record<string, unknown>>) ?? [];
    const targetNames = targets.map((id) => {
      const p = players.find((pl) => pl.playerId === id);
      return p ? `${p.name} (${id})` : id;
    });

    console.log('\n===================================');
    console.log(`ACTION: ${message}`);
    console.log('===================================');
    if (gameView) {
      printGameState(gameView);
      printHand(gameView);
      printBattlefield(gameView);
      printStack(gameView);
    }
    console.log('-----------------------------------');
    targetNames.forEach((t, i) => console.log(`  ${i + 1}: ${t}`));
    console.log('===================================');

    const answer = await ask('Choose (number): ');
    const idx = parseInt(answer, 10) - 1;
    if (idx < 0 || idx >= targets.length) {
      console.log('Invalid choice');
      return;
    }

    await client.game.sendPlayerUuid({ gameId: gameId!, data: targets[idx]! });
    logger.info({ target: targets[idx] }, 'Sent target');
  });

  client.on('callback.game_ask', async (raw) => {
    const cb = raw as CallbackData;
    gameId = cb.objectId ?? gameId;
    const data = cb.data as Record<string, unknown> | undefined;
    if (!data) return;

    const message = data.message as string;
    const gameView = data.gameView as Record<string, unknown> | undefined;

    console.log('\n===================================');
    console.log(`QUESTION: ${message}`);
    console.log('===================================');
    if (gameView) {
      printGameState(gameView);
      printHand(gameView);
    }
    console.log('-----------------------------------');
    console.log('  1: Yes');
    console.log('  2: No');
    console.log('===================================');

    const answer = await ask('Choose (1/2): ');
    const yes = answer.trim() === '1';

    await client.game.sendPlayerBoolean({ gameId: gameId!, data: yes });
    logger.info({ answer: yes }, 'Sent answer');
  });

  client.on('callback.game_select', async (raw) => {
    const cb = raw as CallbackData;
    gameId = cb.objectId ?? gameId;
    const data = cb.data as Record<string, unknown> | undefined;
    if (!data) return;

    const message = data.message as string;
    const gameView = data.gameView as Record<string, unknown> | undefined;

    console.log('\n===================================');
    console.log(`SELECT: ${message}`);
    console.log('===================================');
    if (gameView) {
      printGameState(gameView);
      printBattlefield(gameView);
      printStack(gameView);
    }

    // Show hand cards and battlefield permanents as options
    const hand = gameView?.myHand as Record<string, CardInfo> | undefined;
    const handEntries = hand ? Object.entries(hand) : [];

    const players = (gameView?.players as Array<Record<string, unknown>>) ?? [];
    const me = players.find((p) => p.controlled === true);
    const bf = me?.battlefield as Record<string, CardInfo> | undefined;
    const bfEntries = bf ? Object.entries(bf) : [];

    const allOptions: Array<{ id: string; label: string }> = [];

    for (const [id, card] of handEntries) {
      const mana = card.manaCostLeftStr?.join('') ?? '';
      const pt = card.power && card.toughness && card.power !== '0' ? ` ${card.power}/${card.toughness}` : '';
      const type = card.cardTypes?.includes('LAND') ? 'Play' : 'Cast';
      allOptions.push({ id, label: `${type} ${card.displayName ?? card.name}  ${mana}${pt}` });
    }

    for (const [id, card] of bfEntries) {
      allOptions.push({ id, label: `Activate ${card.displayName ?? card.name}` });
    }

    console.log('-----------------------------------');
    allOptions.forEach((opt, i) => console.log(`  ${i + 1}: ${opt.label}`));
    console.log(`  0: Pass priority`);
    console.log('===================================');

    const answer = await ask('Choose (number, 0 to pass): ');
    const choice = parseInt(answer, 10);

    if (choice === 0 || isNaN(choice)) {
      await client.game.sendPlayerBoolean({ gameId: gameId!, data: false });
      logger.info('Passed priority');
    } else {
      const idx = choice - 1;
      if (idx >= 0 && idx < allOptions.length) {
        await client.game.sendPlayerUuid({ gameId: gameId!, data: allOptions[idx]!.id });
        logger.info({ action: allOptions[idx]!.label }, 'Playing');
      } else {
        console.log('Invalid choice, passing');
        await client.game.sendPlayerBoolean({ gameId: gameId!, data: false });
      }
    }
  });

  client.on('callback.game_choose_choice', async (raw) => {
    const cb = raw as CallbackData;
    gameId = cb.objectId ?? gameId;
    const data = cb.data as Record<string, unknown> | undefined;
    if (!data) return;

    const message = data.message as string;
    const choices = data.choices as string[];

    console.log('\n===================================');
    console.log(`CHOOSE: ${message}`);
    console.log('===================================');
    choices.forEach((c, i) => console.log(`  ${i + 1}: ${c}`));
    console.log('===================================');

    const answer = await ask('Choose (number): ');
    const idx = parseInt(answer, 10) - 1;
    if (idx < 0 || idx >= choices.length) {
      console.log('Invalid choice');
      return;
    }

    await client.game.sendPlayerString({ gameId: gameId!, data: choices[idx]! });
    logger.info({ choice: choices[idx] }, 'Sent choice');
  });

  client.on('callback.game_choose_ability', async (raw) => {
    const cb = raw as CallbackData;
    gameId = cb.objectId ?? gameId;
    const data = cb.data as Record<string, unknown> | undefined;
    if (!data) return;

    const message = data.message as string;
    const abilities = data.abilities as Array<{ id: string; rule: string; source: string }>;

    console.log('\n===================================');
    console.log(`CHOOSE ABILITY: ${message}`);
    console.log('===================================');
    abilities.forEach((a, i) => console.log(`  ${i + 1}: ${a.rule} (${a.source})`));
    console.log('===================================');

    const answer = await ask('Choose (number): ');
    const idx = parseInt(answer, 10) - 1;
    if (idx < 0 || idx >= abilities.length) {
      console.log('Invalid choice');
      return;
    }

    await client.game.sendPlayerUuid({ gameId: gameId!, data: abilities[idx]!.id });
    logger.info({ ability: abilities[idx]!.rule }, 'Sent ability');
  });

  client.on('callback.game_play_mana', async (raw) => {
    const cb = raw as CallbackData;
    gameId = cb.objectId ?? gameId;
    const data = cb.data as Record<string, unknown> | undefined;
    if (!data) return;

    const message = data.message as string;
    const gameView = data.gameView as Record<string, unknown> | undefined;

    console.log('\n===================================');
    console.log(`PAY MANA: ${message}`);
    console.log('===================================');

    // Show mana pool
    const players = (gameView?.players as Array<Record<string, unknown>>) ?? [];
    const me = players.find((p) => p.controlled === true);
    if (me) {
      const pool = me.manaPool as Record<string, number> | undefined;
      if (pool) {
        const parts = [];
        if (pool.white) parts.push(`W:${pool.white}`);
        if (pool.blue) parts.push(`U:${pool.blue}`);
        if (pool.black) parts.push(`B:${pool.black}`);
        if (pool.red) parts.push(`R:${pool.red}`);
        if (pool.green) parts.push(`G:${pool.green}`);
        if (pool.colorless) parts.push(`C:${pool.colorless}`);
        console.log(`  Mana pool: ${parts.length > 0 ? parts.join(' ') : 'empty'}`);
      }
    }

    // Show tappable lands/sources from battlefield
    const bf = me?.battlefield as Record<string, CardInfo & { tapped?: boolean }> | undefined;
    const sources: Array<{ id: string; label: string }> = [];
    if (bf) {
      for (const [id, card] of Object.entries(bf)) {
        if (card.tapped) continue;
        const rules = (card as Record<string, unknown>).rules as string[] | undefined;
        const manaRules = rules?.filter((r) => r.includes('Add {')) ?? [];
        if (manaRules.length > 0 || card.cardTypes?.includes('LAND')) {
          const cleanRules = manaRules.map((r) => r.replace(/<[^>]*>/g, '').replace('{T}: ', '')).join(', ');
          sources.push({ id, label: `${card.displayName ?? card.name} (${cleanRules})` });
        }
      }
    }

    console.log('-----------------------------------');
    sources.forEach((s, i) => console.log(`  ${i + 1}: Tap ${s.label}`));
    console.log(`  0: Cancel`);
    console.log('===================================');

    const answer = (await ask('Choose (number, 0 to cancel): ')).trim();
    const choice = parseInt(answer, 10);

    if (choice === 0) {
      await client.game.sendPlayerBoolean({ gameId: gameId!, data: false });
      logger.info('Cancelled mana payment');
    } else {
      const idx = choice - 1;
      if (idx >= 0 && idx < sources.length) {
        await client.game.sendPlayerUuid({ gameId: gameId!, data: sources[idx]!.id });
        logger.info({ source: sources[idx]!.label }, 'Tapped for mana');
      } else {
        console.log('Invalid choice, cancelling');
        await client.game.sendPlayerBoolean({ gameId: gameId!, data: false });
      }
    }
  });

  client.on('callback.game_update', (raw) => {
    if (_waitingForInput) return;
    const cb = raw as CallbackData;
    const key = `update-${cb.data?.messageId}`;
    if (key === lastUpdateMsg) return;
    lastUpdateMsg = key;

    const data = cb.data as Record<string, unknown> | undefined;
    const gameView = data ?? {};
    printGameState(gameView);
    printBattlefield(gameView);
    printStack(gameView);
  });

  client.on('callback.game_update_and_inform', (raw) => {
    if (_waitingForInput) return;
    const cb = raw as CallbackData;
    const data = cb.data as Record<string, unknown> | undefined;
    if (!data) return;

    const message = data.message as string;
    const gameView = data.gameView as Record<string, unknown> | undefined;
    if (!gameView) return;

    const cleanMsg = message?.replace(/<[^>]*>/g, '') ?? '';
    const turn = gameView.turn;
    const phase = gameView.phase ?? '';
    const key = `inform-${turn}-${phase}-${cleanMsg}`;
    if (key === lastUpdateMsg) return;
    lastUpdateMsg = key;

    printGameState(gameView);
    printBattlefield(gameView);
    printStack(gameView);
    if (cleanMsg) console.log(`  > ${cleanMsg}`);
  });

  client.on('callback.game_over', (raw) => {
    const cb = raw as CallbackData;
    const data = cb.data as Record<string, unknown> | undefined;
    console.log('\n===================================');
    console.log('GAME OVER');
    if (data?.message) console.log(`  ${data.message}`);
    console.log('===================================');
    rl.close();
    process.exit(0);
  });
}
