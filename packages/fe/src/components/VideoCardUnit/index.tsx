
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import VideoCanvas from '../VideoCard';
import { Socket } from 'socket.io-client';
import { createVideoStreamWebSocketConnection } from '@/apis';
import styles from './index.module.css'
import { Select } from '@arco-design/web-react';
import { enum2expression, items } from '@/common/const';
const Option = Select.Option;

const VideoCardUnit: React.FC = () => {
  const socketRef = useRef<Socket>()
  const [predictions, setPredictions] = useState<Array<number>>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [solution, setSolution] = useState<number>(0)
  const solutionRef = useRef(0)

  useEffect(() => {
    solutionRef.current = solution
  }, [solution])


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


  const getLatestSolution = () => {
    return solutionRef.current
  }

  return (
    <div className={styles.wrapper}>
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
              <div>请选择推理方案：</div>
              <Select
                placeholder='请选择方案'
                style={{ width: '50%' }}
                onChange={(value) => {
                  setSolution(value)
                }}
                defaultValue={0}
              >
                {items.map((option, index) => (
                  <Option key={index} value={index}>
                    {option.text}
                  </Option>
                ))}
              </Select>

            </div>
            <div className={styles.bottom}>
              <div className={styles.title}>预测结果</div>
              {predictions?.map((prediction, index) => {
                return (
                  <div className={styles.expression} key={index}>{enum2expression[prediction]}</div>
                )
              })}
            </div>
            <div className={styles.top}>
              <VideoCanvas setPredictions={(e: Array<number>) => { setPredictions(e) }} getSolution={getLatestSolution} socketRef={socketRef as any}></VideoCanvas>
            </div>
          </div>
        )
      }
    </div>

  );
};

export default VideoCardUnit;
