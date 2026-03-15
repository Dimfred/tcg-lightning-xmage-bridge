import { BaseController } from '../base-controller';
import type { BaseClient } from '../../base-client';
import type {
  CreateTableRequest,
  CreateTableResponse,
  GetTablesResponse,
  GetUsersResponse,
  JoinTableRequest,
  JoinTableResponse,
  StartMatchRequest,
  StartMatchResponse,
} from '../../generated/lobby/lobby';

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

  async createTable(options: CreateTableRequest): Promise<CreateTableResponse> {
    return this.client.request<CreateTableResponse>('lobby.createTable', options);
  }

  async joinTable(options: JoinTableRequest): Promise<JoinTableResponse> {
    return this.client.request<JoinTableResponse>('lobby.joinTable', options);
  }

  async startMatch(options: StartMatchRequest): Promise<StartMatchResponse> {
    return this.client.request<StartMatchResponse>('lobby.startMatch', options);
  }
}
