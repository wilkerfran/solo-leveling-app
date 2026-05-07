"use client"

import { useEffect, useState } from "react"

interface LevelUpModalProps {
  level: number
  onClose: () => void
}

export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 500)
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 text-center animate-level-up">
        {/* Rings decorativos */}
        <div className="absolute inset-0 -m-16 rounded-full border border-violet-500/20 animate-ping" />
        <div className="absolute inset-0 -m-8 rounded-full border border-violet-500/30" />

        <div className="relative bg-solo-card border border-solo-purple/50 rounded-3xl p-10 glow-purple">
          <p className="text-solo-purple-light text-sm font-medium tracking-widest uppercase mb-2">
            Level Up!
          </p>
          <p className="text-white text-8xl font-bold mb-2">{level}</p>
          <p className="text-solo-subtle text-sm">
            Você evoluiu! Continue sua jornada.
          </p>

          <button
            onClick={onClose}
            className="mt-6 px-6 py-2 rounded-xl border border-solo-purple/50 text-solo-purple-light text-sm hover:bg-solo-purple/10 transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}