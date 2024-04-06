import { initWebSocket } from '@/utils/request';
import { Socket } from 'socket.io-client';

const baseUrl = 'http://localhost:8811';

export const createVideoStreamWebSocketConnection = ({
  handleConnect = () => {
    console.log('ws连接成功');
  },
  handleMessage = (data: any) => {
    console.log('收到消息', data);
  },
}): Socket => {
  const websocket = initWebSocket({
    path: `${baseUrl}`,
    handleConnect,
    handleMessage,
  });

  return websocket;
};
