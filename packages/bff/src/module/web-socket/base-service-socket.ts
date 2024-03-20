// downstream-socket.service.ts
import { Injectable } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';

@Injectable()
export abstract class BaseServiceSocket {
  protected socket: Socket;

  constructor(private readonly url: string) {}

  protected abstract handleConnect(): void;
  protected abstract handleMessage(message: any): void;
  protected abstract handleDisconnect(): void;
  protected abstract send(data: any): void;

  public init(eventName: string) {
    this.socket = io(this.url);

    this.socket.on('connect', () => {
      this.handleConnect();
    });

    this.socket.on(eventName, (data: any) => {
      this.handleMessage(data);
    });

    this.socket.on('error', (err: Error) => {
      console.error('Error connecting to downstream Socket.IO server:', err);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from downstream Socket.IO server');
    });
  }
}
