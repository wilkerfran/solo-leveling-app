"use client"

import { Achievement } from "@/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useEffect, useState } from "react"

interface AchievementCardProps {
  achievement: Achievement
  onComplete?: (id: string) => void
  onDelete?: (id: string) => void
  index?: number
  isNew?: boolean
}

export function AchievementCard({
  achievement,
  onComplete,
  onDelete,
  index = 0,
  isNew = false,
}: AchievementCardProps) {
  const isUnlocked = achievement.isCompleted
  const [visible, setVisible] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const [completing, setCompleting] = useState(false)

  // Animação de entrada escalonada
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 80)
    return () => clearTimeout(timer)
  }, [index])

  // Partículas para conquistas novas
  useEffect(() => {
  if (isNew && isUnlocked) {
    queueMicrotask(() => {
      setShowParticles(true)
      setTimeout(() => setShowParticles(false), 2000)
    })
  }
}, [isNew, isUnlocked])

  async function handleComplete(id: string) {
    setCompleting(true)
    setTimeout(() => {
      onComplete?.(id)
    }, 600)
  }

  const particles = Array.from({ length: 8 }, (_, i) => ({
    angle: (i / 8) * 360,
    delay: i * 100,
  }))

  return (
    <div style={{
      position: "relative",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
    }}>
      {/* Partículas de desbloqueio */}
      {showParticles && (
        <div style={{
          position: "absolute", inset: 0,
          pointerEvents: "none", zIndex: 10,
          overflow: "hidden", borderRadius: "12px",
        }}>
          {particles.map((p, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%", left: "50%",
                width: "6px", height: "6px",
                borderRadius: "50%",
                backgroundColor: i % 2 === 0 ? "#A78BFA" : "#F59E0B",
                animation: `particle-${i} 1s ease-out forwards`,
                animationDelay: `${p.delay}ms`,
                transform: `rotate(${p.angle}deg) translateX(0)`,
              }}
            />
          ))}
          <style>{`
            ${particles.map((p, i) => `
              @keyframes particle-${i} {
                0% { transform: rotate(${p.angle}deg) translateX(0); opacity: 1; }
                100% { transform: rotate(${p.angle}deg) translateX(60px); opacity: 0; }
              }
            `).join("")}
          `}</style>
        </div>
      )}

      {/* Card */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "14px 16px",
        backgroundColor: isUnlocked
          ? completing
            ? "rgba(124,58,237,0.2)"
            : "rgba(124,58,237,0.08)"
          : "#0D1117",
        border: `1px solid ${
          isUnlocked
            ? completing ? "rgba(124,58,237,0.6)" : "rgba(124,58,237,0.25)"
            : "#1F2937"
        }`,
        borderRadius: "12px",
        opacity: isUnlocked ? 1 : 0.6,
        transform: completing ? "scale(1.02)" : "scale(1)",
        transition: "all 0.3s ease",
        boxShadow: isUnlocked && isNew
          ? "0 0 20px rgba(124,58,237,0.3)"
          : "none",
      }}>
        {/* Ícone */}
        <div style={{
          width: "44px", height: "44px",
          borderRadius: "12px", flexShrink: 0,
          backgroundColor: isUnlocked
            ? "rgba(124,58,237,0.2)"
            : "#1F2937",
          border: `1px solid ${isUnlocked ? "rgba(124,58,237,0.3)" : "#2D3748"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px",
          transition: "all 0.3s ease",
          transform: isUnlocked ? "scale(1)" : "scale(0.9)",
        }}>
          {isUnlocked ? "🏆" : achievement.isCustom ? "🎯" : "🔒"}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
            <p style={{
              color: isUnlocked ? "#A78BFA" : "#CBD5E1",
              fontSize: "14px",
              fontWeight: 600,
            }}>
              {achievement.title}
            </p>
            {isNew && isUnlocked && (
              <span style={{
                fontSize: "10px",
                backgroundColor: "rgba(245,158,11,0.2)",
                color: "#F59E0B",
                border: "1px solid rgba(245,158,11,0.3)",
                padding: "1px 6px",
                borderRadius: "99px",
                fontWeight: 600,
              }}>
                NOVO
              </span>
            )}
          </div>
          <p style={{ color: "#64748B", fontSize: "12px" }}>
            {achievement.description}
          </p>
          {achievement.goal && (
            <p style={{ color: "#475569", fontSize: "11px", marginTop: "3px" }}>
              Meta: {achievement.goal}
            </p>
          )}
          {isUnlocked && achievement.unlockedAt && (
            <p style={{ color: "#374151", fontSize: "11px", marginTop: "3px" }}>
              {format(new Date(achievement.unlockedAt), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          )}
        </div>

        {/* Ações */}
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          {achievement.isCustom && !achievement.isCompleted && onComplete && (
            <button
              onClick={() => handleComplete(achievement.$id)}
              disabled={completing}
              style={{
                backgroundColor: completing ? "rgba(124,58,237,0.3)" : "#7C3AED",
                color: "white",
                fontSize: "11px",
                padding: "5px 10px",
                borderRadius: "6px",
                border: "none",
                cursor: completing ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {completing ? "✓" : "Concluir"}
            </button>
          )}
          {achievement.isCustom && onDelete && (
            <button
              onClick={() => onDelete(achievement.$id)}
              style={{
                color: "#475569",
                fontSize: "11px",
                padding: "5px 8px",
                borderRadius: "6px",
                border: "1px solid #1F2937",
                backgroundColor: "transparent",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  )
}