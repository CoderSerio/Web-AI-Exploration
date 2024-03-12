import { WSGateway } from './websocket.gateway';
import { Module } from '@nestjs/common';

@Module({
  providers: [WSGateway],
})
export class WSModule {}
