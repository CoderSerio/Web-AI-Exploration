import Guide from '@/components/Guide';
import { trim } from '@/utils/format';
import { PageContainer } from '@ant-design/pro-components';
// import { useModel } from '@umijs/max';
import { createVideoStreamWebSocketConnection } from '@/apis/index';
import { useLayoutEffect, useRef, useState } from 'react';
import styles from './index.less';
import VideoCanvas from '@/components/VideoCanvas';
import { Socket } from 'socket.io-client';

const HomePage: React.FC = () => {
  // const { name } = useModel('global');
  const socketRef = useRef<Socket>()
  const [predictions, setPredictions] = useState([])

  useLayoutEffect(() => {
    socketRef.current = createVideoStreamWebSocketConnection({
      handleMessage: (data) => {
        console.log('前端收到了数据', data)
      }
    })
  }, [])


  return (
    <PageContainer ghost>
      <div className={styles.container}>
        <VideoCanvas socketRef={socketRef as any}></VideoCanvas>
      </div>
      <div>{predictions}</div>
    </PageContainer>
  );
};

export default HomePage;
