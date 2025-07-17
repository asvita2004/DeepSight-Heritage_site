
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import image from '../assets/intro.jpg'
import music from '../assets/intromusic.mp3'    
import music2 from '../assets/3_sec.mp3' 

export default function Intro() {
  const navigate = useNavigate()
  const [showClickPrompt, setShowClickPrompt] = useState(false)

  const startIntro = async () => {
    const audio = new Audio(music)
    
    // Set the audio to stop at 3 seconds
    const handleTimeUpdate = () => {
      if (audio.currentTime >= 3) {
        audio.pause()
      }
    }
    
    audio.addEventListener('timeupdate', handleTimeUpdate)
    
    try {
      await audio.play()
      setShowClickPrompt(false)
    } catch (error) {
      console.log('Autoplay blocked:', error)
      setShowClickPrompt(true)
      return
    }
    
    const timer = setTimeout(() => {
      audio.pause()
      navigate('/home')
    }, 3000)
  }

  useEffect(() => {
    startIntro()
  }, [navigate])

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden"
      style={{ overflow: 'hidden', height: '100vh', width: '100vw' }}
      onClick={showClickPrompt ? startIntro : undefined}
    >
      <img
        src={image}
        alt="Heritage Intro"
        className="w-full h-full object-cover object-center pointer-events-none select-none"
        style={{ width: '100vw', height: '100vh', userSelect: 'none' }}
        draggable={false}
      />
      {showClickPrompt && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <p className="text-white text-lg">Click to start</p>
        </div>
      )}
    </div>
  )
}