import { PythonServiceSocketGateway } from './python-service-socket.gateway';
import { NodejsServiceSocketGateway } from './nodejs-service-socket.gateway';
import { WebSocketGateway } from './web-socket.gateway';
import { Module } from '@nestjs/common';

@Module({
  providers: [
    WebSocketGateway,
    NodejsServiceSocketGateway,
    PythonServiceSocketGateway,
  ],
})
export class WebSocketModule {}
