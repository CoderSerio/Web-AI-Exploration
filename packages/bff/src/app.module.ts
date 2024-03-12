import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WSGateway } from './module/websocket/websocket.gateway';
import { WSModule } from './module/websocket/websocket.module';

@Module({
  imports: [WSModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
