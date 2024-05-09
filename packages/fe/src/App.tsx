import { useState } from 'react'
import './App.css'
import VideoCardUnit from './components/VideoCardUnit'
import Scene from './components/Scene'

function App() {

  const [isWaiting, setIsWaiting] = useState(false)
  return (
    <div style={{ background: '#000' }}>
      {/* <VideoCardUnit></VideoCardUnit> */}
      {/* <Scene setIsWaiting={() => setIsWaiting(false)}></Scene> */}
      {!isWaiting && <VideoCardUnit></VideoCardUnit>}
    </div>
  )
}

export default App
