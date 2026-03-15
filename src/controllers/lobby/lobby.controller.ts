import { BaseController } from '../base-controller';
import type { BaseClient } from '../../base-client';
import type { GetTablesResponse, GetUsersResponse } from '../../generated/lobby/lobby';

export class LobbyController extends BaseController {
  constructor(client: BaseClient) {
    super(client);
  }

  get prefix(): string {
    return 'lobby';
  }

  async getTables(): Promise<GetTablesResponse> {
    return this.client.request<GetTablesResponse>('lobby.getTables');
  }

  async getUsers(): Promise<GetUsersResponse> {
    return this.client.request<GetUsersResponse>('lobby.getUsers');
  }
}
