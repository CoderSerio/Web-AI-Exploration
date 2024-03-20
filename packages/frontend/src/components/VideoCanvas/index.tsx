import { useRef, useLayoutEffect, MutableRefObject, useEffect } from "react"
import { Socket } from "socket.io-client"
import * as faceApi from '@vladmandic/face-api';

const testData = [1]

interface VideoCanvasProps {
  socketRef: MutableRefObject<Socket>
}

const VideoCanvas = ({ socketRef }: VideoCanvasProps) => {
  const testDataRef = useRef<Array<number>>([])
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

  const updateFaceMark = async (base64: string) => {
    const image = new Image()
    image.src = base64
    image.onload = async () => {
      if (canvasForCaptureRef.current && isFaceMarkLoadedRef.current) {
        const options = new faceApi.SsdMobilenetv1Options()
        const faces = await faceApi.detectAllFaces(image, options).withFaceLandmarks().withFaceExpressions()
        faces.forEach((face) => {

          const { width, height, x, y } = face.detection.box as any
          let scale;
          if (width / height >= 48 / 48) {
            scale = 48 / width;
          } else {
            scale = 48 / height;
          }
          const scaledWidth = width * scale;
          const scaledHeight = height * scale;
          const offsetX = (48 - scaledWidth) / 2;
          const offsetY = (48 - scaledHeight) / 2;

          const canvas = canvasForResizedCaptureRef.current as HTMLCanvasElement
          const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
          ctx?.drawImage(
            image, x, y, width, height, offsetX, offsetY, scaledWidth, scaledHeight
          )
          const frameData = canvas.toDataURL('image/jpeg', 0.8)
          socketRef.current.emit('backend-for-frontend-message', { id: 'frontend', content: frameData })
        })
        faceApi.draw.drawDetections(canvasForCaptureRef.current, faces)
      }
    }
  }

  useLayoutEffect(() => {
    initFaceMark()
    setupCamera();

    let timer: NodeJS.Timeout
    timer = setInterval(() => {
      const frameData = getSingleFrame()
      updateFaceMark(frameData as string)
    }, 2000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return (
    <div>
      <video ref={videoRef} autoPlay></video>
      <canvas width={640} height={480} ref={canvasForCaptureRef}></canvas>
      <canvas width={48} height={48} ref={canvasForResizedCaptureRef} style={{ scale: 3 }}></canvas>
    </div>
  )
}

export default VideoCanvas