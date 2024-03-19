import { Injectable } from '@nestjs/common';
import { BaseServiceSocket } from './base-service-socket';

@Injectable()
export class PythonServiceSocketGateway extends BaseServiceSocket {
  constructor() {
    super('http://127.0.0.1:8820');
    this.init();
  }

  public send(data: any) {
    this.socket.emit('python-server-message', data);
  }

  protected handleConnect(): void {
    console.log('py-server 连接成功');
  }

  protected handleMessage(message: any): void {}

  protected handleDisconnect(): void {}
}
