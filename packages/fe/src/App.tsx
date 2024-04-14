import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import VideoCardUnit from './components/VideoCardUnit'
import Scene from './components/Scene'

function App() {

  const [isWaiting, setIsWaiting] = useState(true)
  return (
    <div style={{ background: '#000' }}>
      {/* <VideoCardUnit></VideoCardUnit> */}
      <Scene setIsWaiting={() => setIsWaiting(false)}></Scene>
      {!isWaiting && <VideoCardUnit></VideoCardUnit>}
    </div>
  )
}

export default App
