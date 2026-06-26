'use client'

import { useEffect, useState } from 'react'
import TeaCatLogo from './TeaCatLogo'

export default function SplashScreen() {
  const [show, setShow] = useState(false)
  const [fading, setFading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('tc_splash')) {
      setDone(true)
      return
    }
    setShow(true)
    const out = setTimeout(() => {
      setFading(true)
      setTimeout(() => {
        sessionStorage.setItem('tc_splash', '1')
        setDone(true)
      }, 300)
    }, 2200)
    return () => clearTimeout(out)
  }, [])

  if (done || !show) return null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#111111] flex flex-col items-center justify-center"
      style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease' }}
    >
      <style>{`
        @keyframes tc-scale { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes tc-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tc-shimmer { from { transform: translateX(-100%); } to { transform: translateX(200%); } }
      `}</style>

      <div style={{ animation: 'tc-scale 0.6s ease forwards' }}>
        <TeaCatLogo size={120} />
      </div>

      <div className="flex items-center mt-6" style={{ animation: 'tc-fade 0.4s ease 0.3s both' }}>
        <span className="text-[#7B2EFF] font-black text-4xl tracking-tight">Tea</span>
        <span className="text-[#A3FF12] font-black text-4xl tracking-tight">Cat</span>
      </div>

      <p
        className="text-gray-400 text-sm text-center max-w-xs mt-3 px-8"
        style={{ animation: 'tc-fade 0.4s ease 0.7s both' }}
      >
        Other platforms sell tickets. TeaCat finds your next adventure.
      </p>

      <div className="absolute bottom-20 left-0 right-0 h-px overflow-hidden" style={{ opacity: 0.2 }}>
        <div style={{
          height: '100%',
          backgroundColor: '#7B2EFF',
          animation: 'tc-shimmer 1.2s ease 0.8s forwards',
          transform: 'translateX(-100%)',
        }} />
      </div>
    </div>
  )
}
