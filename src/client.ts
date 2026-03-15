import { BaseClient } from './base-client';
import { AuthController } from './controllers/auth/auth.controller';
import { LobbyController } from './controllers/lobby/lobby.controller';

export class XmageClient extends BaseClient {
  public readonly auth: AuthController;
  public readonly lobby: LobbyController;

  constructor(url: string) {
    super(url);
    this.auth = new AuthController(this);
    this.lobby = new LobbyController(this);
  }
}
