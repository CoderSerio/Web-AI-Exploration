import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebSocketModule } from './module/web-socket/web-socket.module';

@Module({
  imports: [WebSocketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
