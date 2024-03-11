import { Module } from '@nestjs/common';
import { AppController, webSocketController } from './app.controller';
import { AppService, WebSocketService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController, webSocketController],
  providers: [AppService, WebSocketService],
})
export class AppModule {}
