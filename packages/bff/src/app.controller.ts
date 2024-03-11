import { Controller, Get } from '@nestjs/common';
import { AppService, WebSocketService } from './app.service';
import {
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

@Controller()
export class webSocketController
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly webSocketService: WebSocketService) {}

  @WebSocketServer() server: any;

  afterInit(server: any) {
    console.log('afterInit');
  }

  handleDisconnect(client: any) {
    console.log('handleDisconnect');
  }

  handleConnection(client: any, ...args: any[]) {
    console.log('handleConnection');
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: string): WsResponse<string> {
    const processedMessage = this.webSocketService.processMessage(payload);
    return { event: 'message', data: processedMessage };
  }
}
