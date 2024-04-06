import { useEffect, useLayoutEffect, useRef } from 'react'
import styles from './index.module.css'
import { init, start } from './utils'

const Scene = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const lecRef = useRef<any>(null)

  useEffect(() => {
    lecRef.current = init()
  }, []);

  useLayoutEffect(() => {
    if (lecRef.current && containerRef.current) {
      start(lecRef.current, containerRef.current)
    }
  }, [])

  return (
    <div ref={containerRef} id={styles.sceneContainer}></div>
  )
}

export default Scene
