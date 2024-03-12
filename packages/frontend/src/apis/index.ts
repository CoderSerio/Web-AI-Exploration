import { initWebSocket } from '@/utils/request';

const baseUrl = 'http://localhost:4000/';

export const createVideoStreamWebSocketConnection = () => {
  const websocket = initWebSocket({
    path: `${baseUrl}`,
    handleConnect: () => {
      console.log('ws连接成功');
    },
    handleMessage: () => {
      console.log('前端收到数据');
    },
  });

  const sendVideoStream = (msg: string) => {
    websocket.emit('client-send-message', msg);
  };

  return sendVideoStream;
};
