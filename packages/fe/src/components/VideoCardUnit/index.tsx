
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
// import styles from './index.less';
import VideoCanvas from '../VideoCard';
import { Socket } from 'socket.io-client';
import { createVideoStreamWebSocketConnection } from '@/apis';
import styles from './index.module.css'

const enum2expression = [
  '生气😡', '平静😐', '厌恶🤢', '害怕😨', '开心🥳', '伤心😢', '惊讶🙀'
]

const items = [
  { text: "Python-Server" },
  { text: "LLM-Server" },
  { text: "TODO" },
]


const VideoCardUnit: React.FC = () => {
  const socketRef = useRef<Socket>()
  const [predictions, setPredictions] = useState([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [solution, setSolution] = useState<string>(items[0].text)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      clearTimeout(timer)
    }, 3000)
  }, [])

  useLayoutEffect(() => {
    socketRef.current = createVideoStreamWebSocketConnection({
      handleMessage: (data) => {
        setPredictions(data.content)
      }
    })
  }, [])

  return (
    <div className={styles.window}>
      {isLoading ?
        (
          <div className={styles.loadingWrapper}>
            <h1>🤔</h1>
            <h2>基于 Web 的人脸表情识别系统</h2>
            <div>加载中...</div>
          </div>
        ) : (
          <div className={styles.container}>
            <div className={styles.header}>
              <select id="Select" onChange={(e) => {
                setSolution(e.target.value)
              }}>
                {items.map((item) => {
                  return (
                    <option key={item.text} value={item.text}>{item.text}</option>
                  )
                })}

              </select>
            </div>
            <div className={styles.bottom}>
              <div className={styles.title}>预测结果</div>
              {predictions?.map((prediction) => {
                return (
                  <div className={styles.expression}>{enum2expression[prediction]}</div>
                )
              })}
            </div>
            <div className={styles.top}>
              <VideoCanvas solution={solution} socketRef={socketRef as any}></VideoCanvas>
            </div>
          </div>
        )
      }
    </div>

  );
};

export default VideoCardUnit;
