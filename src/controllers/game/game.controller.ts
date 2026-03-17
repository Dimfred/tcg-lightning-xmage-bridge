import { BaseController } from '../base-controller';
import type { BaseClient } from '../../base-client';
import type {
  ChatMessageEvent,
  EndGameInfoEvent,
  GameAskEvent,
  GameChooseAbilityEvent,
  GameChooseChoiceEvent,
  GameOverEvent,
  GamePlayManaEvent,
  GameSelectEvent,
  GameStateEvent,
  GameView,
  GameTargetEvent,
  GameUpdateAndInformEvent,
  SendPlayerActionResponse,
  SendPlayerBooleanRequest,
  SendPlayerIntegerRequest,
  SendPlayerStringRequest,
  SendPlayerUuidRequest,
  StartGameEvent,
} from '../../generated/game/game';
import { type PlayerAction, playerActionToJSON } from '../../generated/common';
import type { CallbackPayload } from '../../types';

type CallbackHandler<T> = (gameId: string, data: T) => void;

export class GameController extends BaseController {
  constructor(client: BaseClient) {
    super(client);

    // Register a single handler for chat messages, dispatch to specific handlers
    this.toggleCallback<ChatMessageEvent>('callback.chatmessage', (_gameId, data) => {
      const expiredMatch = data.message?.match(/^(.+) session expired$/);
      if (expiredMatch) {
        this._sessionExpiredHandler?.(_gameId, expiredMatch[1]);
        return;
      }

      this._chatMessageHandler?.(_gameId, data);
    });
  }

  get prefix(): string {
    return 'game';
  }

  // -- Actions --

  async sendPlayerUuid(request: SendPlayerUuidRequest): Promise<SendPlayerActionResponse> {
    return this.client.request<SendPlayerActionResponse>('game.sendPlayerUuid', request);
  }

  async sendPlayerBoolean(request: SendPlayerBooleanRequest): Promise<SendPlayerActionResponse> {
    return this.client.request<SendPlayerActionResponse>('game.sendPlayerBoolean', request);
  }

  async sendPlayerInteger(request: SendPlayerIntegerRequest): Promise<SendPlayerActionResponse> {
    return this.client.request<SendPlayerActionResponse>('game.sendPlayerInteger', request);
  }

  async sendPlayerString(request: SendPlayerStringRequest): Promise<SendPlayerActionResponse> {
    return this.client.request<SendPlayerActionResponse>('game.sendPlayerString', request);
  }

  async sendPlayerAction(gameId: string, action: PlayerAction): Promise<SendPlayerActionResponse> {
    // The Java proxy expects the Java enum name (e.g. "PASS_PRIORITY_UNTIL_NEXT_TURN").
    // playerActionToJSON returns proto name with PLAYER_ACTION_ prefix, strip it.
    const actionName = playerActionToJSON(action).replace('PLAYER_ACTION_', '');
    return this.client.request<SendPlayerActionResponse>('game.sendPlayerAction', {
      gameId,
      action: actionName,
    });
  }

  async passPriority(gameId: string): Promise<SendPlayerActionResponse> {
    return this.sendPlayerBoolean({ gameId, data: false });
  }

  // -- Callback subscriptions --
  // Call with handler to subscribe, call without to unsubscribe

  onStartGame(handler?: CallbackHandler<StartGameEvent>): void {
    this.toggleCallback('callback.start_game', handler);
  }

  onGameInit(handler?: CallbackHandler<GameStateEvent>): void {
    this.toggleCallback('callback.game_init', handler);
  }

  onGameUpdate(handler?: CallbackHandler<GameStateEvent>): void {
    if (!handler) {
      this.toggleCallback<GameStateEvent>('callback.game_update');
      return;
    }
    // Server sends GameView fields at top level for game_update, not nested in gameView
    this.toggleCallback<GameStateEvent>('callback.game_update', (gameId, data) => {
      if (!data.gameView && (data as Record<string, unknown>).players) {
        handler(gameId, { gameView: data as unknown as GameView, message: '' });
        return;
      }
      handler(gameId, data);
    });
  }

  onGameUpdateAndInform(handler?: CallbackHandler<GameUpdateAndInformEvent>): void {
    this.toggleCallback('callback.game_update_and_inform', handler);
  }

  onGameTarget(handler?: CallbackHandler<GameTargetEvent>): void {
    this.toggleCallback('callback.game_target', handler);
  }

  onGameSelect(handler?: CallbackHandler<GameSelectEvent>): void {
    this.toggleCallback('callback.game_select', handler);
  }

  onGameAsk(handler?: CallbackHandler<GameAskEvent>): void {
    this.toggleCallback('callback.game_ask', handler);
  }

  onGamePlayMana(handler?: CallbackHandler<GamePlayManaEvent>): void {
    this.toggleCallback('callback.game_play_mana', handler);
  }

  onGameChooseAbility(handler?: CallbackHandler<GameChooseAbilityEvent>): void {
    this.toggleCallback('callback.game_choose_ability', handler);
  }

  onGameChooseChoice(handler?: CallbackHandler<GameChooseChoiceEvent>): void {
    this.toggleCallback('callback.game_choose_choice', handler);
  }

  onGameOver(handler?: CallbackHandler<GameOverEvent>): void {
    this.toggleCallback('callback.game_over', handler);
  }

  onEndGameInfo(handler?: CallbackHandler<EndGameInfoEvent>): void {
    this.toggleCallback('callback.end_game_info', handler);
  }

  onChatMessage(handler?: CallbackHandler<ChatMessageEvent>): void {
    this._chatMessageHandler = handler;
  }

  /** Fires when a player's session expires (filtered from chat messages) */
  onSessionExpired(handler?: (gameId: string, playerName: string) => void): void {
    this._sessionExpiredHandler = handler;
  }

  // -- Internal --

  private _chatMessageHandler?: CallbackHandler<ChatMessageEvent>;
  private _sessionExpiredHandler?: (gameId: string, playerName: string) => void;

  private toggleCallback<T>(event: string, handler?: CallbackHandler<T>): void {
    if (handler) {
      const wrapped = (data: unknown) => {
        const cb = data as CallbackPayload<T>;
        const gameId = cb.objectId ?? '';
        if (cb.data) {
          handler(gameId, cb.data);
        }
      };
      this.client.toggleHandler(event, wrapped);
      return;
    }

    this.client.toggleHandler(event);
  }
}
