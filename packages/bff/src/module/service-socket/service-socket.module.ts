import { PythonServiceSocketGateway } from './python-service-socket.gateway';
import { Module } from '@nestjs/common';
import { NodejsServiceSocketGateway } from './nodejs-service-socket.gateway';

@Module({
  providers: [NodejsServiceSocketGateway, PythonServiceSocketGateway],
})
export class ServiceSocketModule {}
