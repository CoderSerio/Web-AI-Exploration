// downstream-socket.service.ts
import { Injectable } from '@nestjs/common';
import { BaseServiceSocket } from './base-service-socket';

@Injectable()
export class NodejsServiceSocketGateway extends BaseServiceSocket {
  constructor() {
    super('ws://');
    this.init();
  }

  protected handleConnect(): void {}

  protected handleMessage(message: any): void {}

  protected handleDisconnect(): void {}
}
