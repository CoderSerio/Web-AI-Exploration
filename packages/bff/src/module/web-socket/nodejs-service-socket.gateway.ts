// downstream-socket.service.ts
import { Injectable } from '@nestjs/common';
import { BaseServiceSocket } from './base-service-socket';

@Injectable()
export class NodejsServiceSocketGateway extends BaseServiceSocket {
  constructor() {
    super('http://127.0.0.1:8830');
    this.init();
  }

  public send(data: any) {
    this.socket.emit('nodejs-server-message', data);
  }

  protected handleConnect(): void {}

  protected handleMessage(message: any): void {}

  protected handleDisconnect(): void {}
}
