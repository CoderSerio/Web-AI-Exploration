import { Socket } from 'socket.io-client';
import { Injectable } from '@nestjs/common';
import { BaseServiceSocket } from './base-service-socket';

@Injectable()
export class PythonServiceSocketGateway extends BaseServiceSocket {
  private clients: Set<Socket> = new Set();

  constructor() {
    super('http://127.0.0.1:8820');
    this.init('python-server-message');
  }

  public addClient(client: Socket) {
    this.clients.add(client);
  }

  public removeClient(client: Socket) {
    this.clients.delete(client);
  }

  public send(data: any) {
    this.socket.emit('python-server-message', data);
  }

  protected handleConnect(): void {
    console.log('py-server 连接成功');
  }

  public handleMessage(message: any): void {
    console.log('这是什么', message);
    for (const client of this.clients) {
      client.emit('frontend-message', message);
    }
  }

  protected handleDisconnect(): void {}
}
