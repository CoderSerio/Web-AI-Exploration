import {
  SubscribeMessage,
  WebSocketGateway as WebSocketGatewayDecorator,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGatewayDecorator(4000, {
  cors: {
    origin: '*',
  },
})
export class WebSocketGateway
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
