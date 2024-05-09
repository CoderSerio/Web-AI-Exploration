import { useState } from 'react'
import './App.css'
import VideoCardUnit from './components/VideoCardUnit'
import Scene from './components/Scene'

function App() {

  const [isWaiting, setIsWaiting] = useState(false)
  return (
    <div style={{ background: '#000' }}>
      <Scene setIsWaiting={() => setIsWaiting(false)}></Scene>
    </div>
  )
}

export default App
