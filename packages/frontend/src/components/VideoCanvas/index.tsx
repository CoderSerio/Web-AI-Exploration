import { useRef, useLayoutEffect, MutableRefObject, useEffect } from "react"
import { Socket } from "socket.io-client"
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/face-landmarks-detection';
import * as faceApi from '@vladmandic/face-api';


const MODEL_URLS = {
  ssdMobilenetv1: '../models/ssd_mobilenet_v1_model',
};



interface VideoCanvasProps {
  socketRef: MutableRefObject<Socket>
}

const VideoCanvas = ({ socketRef }: VideoCanvasProps) => {

  const canvasForCaptureRef = useRef<HTMLCanvasElement>(null)
  const canvasForDisplayRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const isFaceMarkLoadedRef = useRef<boolean>(false)

  /** 获取视频帧 */
  const getSingleFrame = () => {
    if (!videoRef.current) {
      throw '获取视频源失败'
    }
    canvasForCaptureRef.current?.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvasForCaptureRef.current.width, canvasForCaptureRef.current.height)
    const frameData = canvasForCaptureRef.current?.toDataURL('image/png', 0.8)
    // console.log(frameData)
    return frameData
  }

  /** 初始化摄像头 */
  const setupCamera = async () => {
    if (navigator?.mediaDevices?.getUserMedia as unknown as boolean && videoRef.current && canvasForDisplayRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      videoRef.current.srcObject = stream
    } else {
      throw '获取摄像头权限失败！请刷新重试！'
    }
  }

  /** 初始化模型 */
  const initFaceMark = async () => {
    try {
      // await faceApi.loadTinyFaceDetectorModel(
      //   '/models',
      // )

      await faceApi.loadSsdMobilenetv1Model('/models');
      await faceApi.loadFaceLandmarkModel('/models');
      await faceApi.loadFaceExpressionModel('/models');
      isFaceMarkLoadedRef.current = true
    } catch (err) {
      throw `模型加载失败: ${err}`
    }
    // await faceApi.loadSsdMobilenetv1Model(
    //   '/models',
    // )

  }

  const updateFaceMark = async (base64: string) => {
    const image = new Image()
    image.src = base64
    image.onload = async () => {
      if (canvasForCaptureRef.current && isFaceMarkLoadedRef.current) {
        const options = new faceApi.SsdMobilenetv1Options()
        // new faceApi.TinyFaceDetectorOptions()
        const faces = await faceApi.detectAllFaces(image, options).withFaceLandmarks().withFaceExpressions()
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
      socketRef.current.emit('client-send-message', frameData)
    }, 1500)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return (
    <div>
      <video ref={videoRef} autoPlay></video>
      <canvas ref={canvasForDisplayRef}></canvas>
      <canvas ref={canvasForCaptureRef}></canvas>
    </div>
  )
}

export default VideoCanvas