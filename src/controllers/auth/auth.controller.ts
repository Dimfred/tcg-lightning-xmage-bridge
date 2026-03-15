import { BaseController } from '../base-controller';
import type { BaseClient } from '../../base-client';
import type { LoginRequest, LoginResponse } from '../../generated/auth/auth';

export class AuthController extends BaseController {
  constructor(client: BaseClient) {
    super(client);
  }

  get prefix(): string {
    return 'auth';
  }

  async login(username: string): Promise<LoginResponse> {
    const req: LoginRequest = { username };
    return this.client.request<LoginResponse>('auth.login', req);
  }
}
