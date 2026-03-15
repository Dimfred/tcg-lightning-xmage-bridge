import { BaseClient } from './base-client';
import { AuthController } from './controllers/auth/auth.controller';

export class XmageClient extends BaseClient {
  public readonly auth: AuthController;

  constructor(url: string) {
    super(url);
    this.auth = new AuthController(this);
  }
}
