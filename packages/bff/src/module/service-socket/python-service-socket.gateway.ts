import { Injectable } from '@nestjs/common';
import { BaseServiceSocket } from './base-service-socket';

@Injectable()
export class PythonServiceSocketGateway extends BaseServiceSocket {
  constructor() {
    super('ws://');
    this.init();
  }

  protected handleConnect(): void {}

  protected handleMessage(message: any): void {}

  protected handleDisconnect(): void {}
}
