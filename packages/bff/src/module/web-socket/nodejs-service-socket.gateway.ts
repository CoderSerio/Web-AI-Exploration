// downstream-socket.service.ts
import { Socket } from 'socket.io-client';
import { Injectable } from '@nestjs/common';
import { BaseServiceSocket } from './base-service-socket';

@Injectable()
export class NodejsServiceSocketGateway extends BaseServiceSocket {
  private clients: Set<Socket> = new Set();
  constructor() {
    super('http://127.0.0.1:8840');
    this.init('backend-for-frontend-message');
  }

  public send(data: any) {
    this.socket.emit('llm-server-message', data);
  }

  public addClient(client: Socket) {
    this.clients.add(client);
  }

  public removeClient(client: Socket) {
    this.clients.delete(client);
  }

  protected handleConnect(): void {}

  public handleMessage(message: any): void {
    for (const client of this.clients) {
      client.emit('frontend-message', message);
    }
  }

  protected handleDisconnect(): void {}
}
