import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServiceSocketModule } from './module/service-socket/service-socket.module';
import { WebSocketModule } from './module/web-socket/web-socket.module';

@Module({
  imports: [WebSocketModule, ServiceSocketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
