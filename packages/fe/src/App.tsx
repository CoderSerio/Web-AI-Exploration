import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import VideoCardUnit from './components/VideoCardUnit'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <VideoCardUnit></VideoCardUnit>
    </>
  )
}

export default App
