import type { BaseClient } from '../base-client';

export abstract class BaseController {
  protected readonly client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  abstract get prefix(): string;
}
