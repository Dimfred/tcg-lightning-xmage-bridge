import { BaseController } from '../base-controller';
import type { BaseClient } from '../../base-client';
import type {
  CreateTableRequest,
  CreateTableResponse,
  GetTablesResponse,
  GetUsersResponse,
  JoinTableRequest,
  JoinTableResponse,
  LeaveTableRequest,
  LeaveTableResponse,
  StartMatchRequest,
  StartMatchResponse,
} from '../../generated/lobby/lobby';

type TablesHandler = (tables: GetTablesResponse) => void;

export class LobbyController extends BaseController {
  private tablesHandler: TablesHandler | null = null;

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

  async leaveTable(options: LeaveTableRequest): Promise<LeaveTableResponse> {
    return this.client.request<LeaveTableResponse>('lobby.leaveTable', options);
  }

  subscribeTables(handler: TablesHandler): void {
    this.tablesHandler = handler;
    this.client.on('lobby.tablesUpdate', handler as (data: unknown) => void);
    this.client.send('lobby.subscribeTables');
  }

  unsubscribeTables(): void {
    this.client.send('lobby.unsubscribeTables');
    if (this.tablesHandler) {
      this.client.off('lobby.tablesUpdate', this.tablesHandler as (data: unknown) => void);
      this.tablesHandler = null;
    }
  }
}
