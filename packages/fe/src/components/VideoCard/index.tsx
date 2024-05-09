import { useRef, useLayoutEffect, MutableRefObject } from "react"
import { Socket } from "socket.io-client"
import * as faceApi from '@vladmandic/face-api';
import { expression2num, items } from "@/common/const";

interface VideoCanvasProps {
  socketRef: MutableRefObject<Socket>
  getSolution: () => number
  setPredictions: (e: Array<number>) => void
}

const sizeHeight = 128, sizeWidth = 96, time = 1000
const VideoCanvas = ({ socketRef, getSolution, setPredictions }: VideoCanvasProps) => {
  const canvasForCaptureRef = useRef<HTMLCanvasElement>(null)
  const canvasForResizedCaptureRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const isFaceMarkLoadedRef = useRef<boolean>(false)

  /** 获取视频帧 */
  const getSingleFrame = () => {
    if (!videoRef.current) {
      throw '获取视频源失败'
    }
    canvasForCaptureRef.current?.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvasForCaptureRef.current.width, canvasForCaptureRef.current.height)
    const frameData = canvasForCaptureRef.current?.toDataURL('image/jpeg', 0.8)
    return frameData
  }

  /** 初始化摄像头 */
  const setupCamera = async () => {
    if (navigator?.mediaDevices?.getUserMedia as unknown as boolean && videoRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      videoRef.current.srcObject = stream
    } else {
      throw '获取摄像头权限失败！请刷新重试！'
    }
  }

  /** 初始化模型 */
  const initFaceMark = async () => {
    try {
      await faceApi.loadSsdMobilenetv1Model('/models');
      await faceApi.loadFaceLandmarkModel('/models');
      await faceApi.loadFaceExpressionModel('/models');
      isFaceMarkLoadedRef.current = true
    } catch (err) {
      throw `模型加载失败: ${err}`
    }
  }

  /** 用于静态化模型在前端 */
  const getMostPossibleKey = (obj: Record<string, number>) => {
    const keys = Object.keys(obj)
    let max = -1, maxIndex = 0

    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      console.log('max', obj[key], +max)
      if (+obj[key] > +max) {
        maxIndex = index
        max = obj[key]
      }
    }

    return keys[maxIndex]
  }

  const updateFaceMark = async (base64: string) => {
    const image = new Image()
    image.src = base64
    image.onload = async () => {
      if (canvasForCaptureRef.current && isFaceMarkLoadedRef.current) {
        const options = new faceApi.SsdMobilenetv1Options()
        const faces = await faceApi.detectAllFaces(image, options).withFaceLandmarks().withFaceExpressions()
        const solution = getSolution()
        const text = items?.[solution as unknown as number].text


        console.log('faces', faces)
        faces.forEach((face) => {

          const { width, height, x, y } = face.detection.box as any
          let scale;
          if (width / height >= 1) {
            scale = sizeWidth / width;
          } else {
            scale = sizeHeight / height;
          }
          const scaledWidth = width * scale;
          const scaledHeight = height * scale;
          const offsetX = (sizeWidth - scaledWidth) / 2;
          const offsetY = (sizeHeight - scaledHeight) / 2;

          const canvas = canvasForResizedCaptureRef.current as HTMLCanvasElement
          const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
          ctx?.drawImage(
            image, x, y, width, height, offsetX, offsetY, scaledWidth, scaledHeight
          )

          if (solution === 2 && face?.expressions) {
            const key = getMostPossibleKey(face.expressions as unknown as Record<string, number>)
            console.log('face', face.expressions, key)
            const res = expression2num[key] ?? -1
            setPredictions([res])
          } else {
            const frameData = canvas.toDataURL('image/jpeg', 1)
            socketRef.current.emit('backend-for-frontend-message', { id: 'frontend', type: text, content: frameData })
          }

        })
        faceApi.draw.drawDetections(canvasForCaptureRef.current, faces)
      }
    }
  }

  useLayoutEffect(() => {
    initFaceMark()
    setupCamera();

    const timer = setInterval(() => {
      const frameData = getSingleFrame()
      updateFaceMark(frameData as string)
    }, time)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return (
    <div>

      <canvas width={sizeWidth} height={sizeHeight} ref={canvasForResizedCaptureRef} style={{
        width: sizeWidth,
        height: sizeHeight,
      }}></canvas>
      <div>
        <video ref={videoRef} autoPlay></video>
        <canvas width={640} height={480} ref={canvasForCaptureRef}></canvas>
      </div>
    </div>
  )
}

export default VideoCanvas