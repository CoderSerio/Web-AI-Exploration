import { useRef, useLayoutEffect } from "react"

const VideoCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)


  const setupCamera = async () => {
    if (navigator?.mediaDevices?.getUserMedia as unknown as boolean && videoRef.current && canvasRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      videoRef.current.srcObject = stream

    } else {
      throw '获取摄像头权限失败！请刷新重试！'
    }
  }


  useLayoutEffect(() => {

    setupCamera();

    return () => {

    }
  }, [])

  return (
    <div>
      <video ref={videoRef} autoPlay></video>
      <canvas ref={canvasRef}></canvas>
    </div>
  )
}

export default VideoCanvas