import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// 安装WebSocket成功响应拦截器
// @UseInterceptors(new WsServiceResponseInterceptor())
// // 安装WebSocket异常过滤器
// @UseFilters(new WsServiceExceptionFilter())
@WebSocketGateway(4000, {
  cors: {
    origin: '*',
  },
})
export class WSGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  afterInit(server: Server) {
    console.log('Socket.IO server initialized!');
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log('Client connected: ', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected: ', client.id);
  }

  @SubscribeMessage('client-send-message')
  handleMessage(client: Socket, data: any): string {
    if (!data) {
      throw new Error('WebSocket NO DATA!');
    }
    console.log('收到了');
    return 'received reqData';
  }
}
