import { NodejsServiceSocketGateway } from './nodejs-service-socket.gateway';
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
  @WebSocketServer() server: Server;

  constructor(
    @Inject(PythonServiceSocketGateway)
    private readonly pythonServiceSocketGateway: PythonServiceSocketGateway,
    private readonly nodejsServiceSocketGateway: NodejsServiceSocketGateway,
  ) {}

  afterInit(server: Server) {
    console.log('ws服务初始化完毕');
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log('ws连接成功');
  }

  handleDisconnect(client: Socket) {
    console.log('ws连接已断开');
    this.pythonServiceSocketGateway.removeClient(client as any);
  }

  @SubscribeMessage('backend-for-frontend-message')
  handleMessage(client: Socket, data: any): string {
    console.log(`收到了来自[${data.id}]的数据\n`);

    // if (data.type === 'Python-Server') {
    this.pythonServiceSocketGateway.send(data);
    this.pythonServiceSocketGateway.addClient(client as any);
    // } else if (data.type === 'LLM-Server') {
    //   this.nodejsServiceSocketGateway.send(data);
    //   this.nodejsServiceSocketGateway.addClient(client as any);
    // }
    return 'data received';
  }
}
