
import { useLayoutEffect, useRef, useState } from 'react';
// import styles from './index.less';
import VideoCanvas from '../VideoCard';
import { Socket } from 'socket.io-client';
import { createVideoStreamWebSocketConnection } from '@/apis';
import styles from './index.module.css'

const enum2expression = [
  '生气😡', '厌恶🤢', '担忧😟', '开心🥳', '平静😐', '伤心😢', '惊讶🙀'
]


const VideoCardUnit: React.FC = () => {
  // const { name } = useModel('global');
  const socketRef = useRef<Socket>()
  const [predictions, setPredictions] = useState([])

  useLayoutEffect(() => {
    socketRef.current = createVideoStreamWebSocketConnection({
      handleMessage: (data) => {
        console.log('前端收到了数据', data)
        setPredictions(data.content)
      }
    })
  }, [])


  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <VideoCanvas socketRef={socketRef as any}></VideoCanvas>
      </div>
      <div className={styles.bottom}>
        <div className={styles.title}>预测结果</div>
        {predictions.map((prediction) => {
          return (
            <div className={styles.expression}>{enum2expression[prediction]}</div>
          )
        })}
      </div>
    </div>
  );
};

export default VideoCardUnit;
