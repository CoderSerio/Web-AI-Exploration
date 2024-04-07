import { useEffect, useLayoutEffect, useRef } from 'react'
import styles from './index.module.css'
import { init, start } from './utils'
import VideoCardUnit from '../VideoCardUnit'

const Scene = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const lecRef = useRef<any>(null)
  const css3dRef = useRef<any>(null)

  useEffect(() => {
    const { lec, css3d } = init()
    lecRef.current = lec
    css3dRef.current = css3d
  }, []);

  useLayoutEffect(() => {
    if (lecRef.current && css3dRef.current && containerRef.current) {
      start(lecRef.current, css3dRef.current, containerRef.current, <VideoCardUnit></VideoCardUnit>)
    }
  }, [])

  return (
    <div ref={containerRef} id={styles.sceneContainer}></div>
  )
}

export default Scene
