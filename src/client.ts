import { BaseClient } from './base-client';
import { AuthController } from './controllers/auth/auth.controller';
import { GameController } from './controllers/game/game.controller';
import { LobbyController } from './controllers/lobby/lobby.controller';

export class XmageClient extends BaseClient {
  public readonly auth: AuthController;
  public readonly lobby: LobbyController;
  public readonly game: GameController;

  constructor(url: string) {
    super(url);
    this.auth = new AuthController(this);
    this.lobby = new LobbyController(this);
    this.game = new GameController(this);
  }
}
