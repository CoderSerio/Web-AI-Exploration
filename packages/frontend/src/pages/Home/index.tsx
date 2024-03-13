import Guide from '@/components/Guide';
import { trim } from '@/utils/format';
import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { createVideoStreamWebSocketConnection } from '@/apis/index';
import { useEffect } from 'react';
import styles from './index.less';
import VideoCanvas from '@/components/VideoCanvas';

const HomePage: React.FC = () => {
  const { name } = useModel('global');


  useEffect(() => {
    const sendVideoStream = createVideoStreamWebSocketConnection()
    sendVideoStream('Hi')
  }, [])


  return (
    <PageContainer ghost>
      <div className={styles.container}>
        <Guide name={trim(name)} />
        <VideoCanvas></VideoCanvas>
      </div>
    </PageContainer>
  );
};

export default HomePage;
