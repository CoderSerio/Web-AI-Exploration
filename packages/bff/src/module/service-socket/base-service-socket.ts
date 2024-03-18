// downstream-socket.service.ts
import { Injectable } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';

@Injectable()
export abstract class BaseServiceSocket {
  private socket: Socket;

  constructor(private readonly url: string) {}

  protected abstract handleConnect(): void;
  protected abstract handleMessage(message: any): void;
  protected abstract handleDisconnect(): void;

  public init() {
    this.socket = io(this.url);

    this.socket.on('connect', () => {
      this.handleConnect();
    });

    this.socket.on('message', (data: any) => {
      this.handleMessage(data);
    });

    this.socket.on('error', (err: Error) => {
      console.error('Error connecting to downstream Socket.IO server:', err);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from downstream Socket.IO server');
    });
  }

  public send(key: string, data: any) {
    if (this.socket.connected) {
      this.socket.emit(key, data);
    } else {
      console.error(
        'Unable to send message to downstream server, connection is not open',
      );
    }
  }
}
