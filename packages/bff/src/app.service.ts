import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}

@Injectable()
export class WebSocketService {
  processMessage(payload: string): string {
    // 这里可以编写处理消息的业务逻辑
    return `Processed message: ${payload}`;
  }
}
