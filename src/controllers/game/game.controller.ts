import { BaseController } from '../base-controller';
import type { BaseClient } from '../../base-client';
import type {
  SendPlayerActionResponse,
  SendPlayerBooleanRequest,
  SendPlayerIntegerRequest,
  SendPlayerStringRequest,
  SendPlayerUuidRequest,
} from '../../generated/game/game';

export class GameController extends BaseController {
  constructor(client: BaseClient) {
    super(client);
  }

  get prefix(): string {
    return 'game';
  }

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

  async passPriority(gameId: string): Promise<SendPlayerActionResponse> {
    return this.sendPlayerBoolean({ gameId, data: false });
  }
}
