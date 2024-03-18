import { WebSocketGateway } from './web-socket.gateway';
import { Module } from '@nestjs/common';

@Module({
  providers: [WebSocketGateway],
})
export class WebSocketModule {}
