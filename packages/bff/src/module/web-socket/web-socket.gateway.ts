// import { NodejsServiceSocketGateway } from './../service-socket/nodejs-service-socket.gateway';
import { PythonServiceSocketGateway } from './python-service-socket.gateway';
import {
  SubscribeMessage,
  WebSocketGateway as WebSocketGatewayDecorator,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject } from '@nestjs/common';

@WebSocketGatewayDecorator(8811, {
  cors: {
    origin: '*',
  },
})
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private nextServerSocket: Socket;
  @WebSocketServer() server: Server;

  constructor(
    @Inject(PythonServiceSocketGateway)
    private readonly pythonServiceSocketGateway: PythonServiceSocketGateway,
  ) {}

  afterInit(server: Server) {
    console.log('ws服务初始化完毕');
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log('ws连接成功');
  }

  handleDisconnect(client: Socket) {
    console.log('ws连接已断开');
  }

  @SubscribeMessage('backend-for-frontend-message')
  handleMessage(client: Socket, data: any): string {
    console.log('收到了', data);
    this.pythonServiceSocketGateway.send('你好啊11');

    return 'received reqData';
  }
}
