import { useEffect, useLayoutEffect, useRef } from 'react'
import styles from './index.module.css'
import { init, start } from './utils'
import VideoCardUnit from '../VideoCardUnit'

interface A {
  [key: string]: string
}

const Scene = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const lecRef = useRef<any>(null)
  const css3dRef = useRef<any>(null)
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    const { lec, css3d, controls } = init()
    lecRef.current = lec
    css3dRef.current = css3d
    controlsRef.current = controls
  }, []);

  useLayoutEffect(() => {
    let unloadEventHandlers: Record<string, Array<(e: Event) => void>> = {}
    if (lecRef.current && css3dRef.current && containerRef.current) {
      unloadEventHandlers = start(
        lecRef.current,
        css3dRef.current,
        controlsRef.current,
        containerRef.current,
        <VideoCardUnit key={lecRef.current}></VideoCardUnit>,
      ) as unknown as Record<string, Array<(e: Event) => void>>
    }

    return () => {
      for (const key in unloadEventHandlers) {
        unloadEventHandlers[key].forEach((handler) => {
          window.removeEventListener(key, handler)
        })
      }
    }
  }, [])

  return (
    <div ref={containerRef} id={styles.sceneContainer}></div>
  )
}

export default Scene
