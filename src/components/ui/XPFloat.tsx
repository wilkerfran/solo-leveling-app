"use client"

import { useEffect, useState } from "react"

interface XPFloatProps {
  amount: number
  onDone: () => void
}

export function XPFloat({ amount, onDone }: XPFloatProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 400)
    }, 800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className={`fixed top-1/3 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-all duration-400 ${
      visible ? "opacity-100 -translate-y-0" : "opacity-0 -translate-y-8"
    }`}>
      <div className="bg-solo-purple/20 border border-solo-purple/50 rounded-xl px-4 py-2 glow-purple">
        <p className="text-solo-purple-light font-bold text-xl">+{amount} XP</p>
      </div>
    </div>
  )
}