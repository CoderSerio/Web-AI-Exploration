import Guide from '@/components/Guide';
import { trim } from '@/utils/format';
import { PageContainer } from '@ant-design/pro-components';
// import { useModel } from '@umijs/max';
import { createVideoStreamWebSocketConnection } from '@/apis/index';
import { useLayoutEffect, useRef } from 'react';
import styles from './index.less';
import VideoCanvas from '@/components/VideoCanvas';
import { Socket } from 'socket.io-client';

const HomePage: React.FC = () => {
  // const { name } = useModel('global');
  const socketRef = useRef<Socket>()

  useLayoutEffect(() => {
    socketRef.current = createVideoStreamWebSocketConnection()
  }, [])


  return (
    <PageContainer ghost>
      <div className={styles.container}>
        <VideoCanvas socketRef={socketRef as any}></VideoCanvas>
      </div>
    </PageContainer>
  );
};

export default HomePage;
