"use client"

import { Achievement } from "@/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AchievementCardProps {
  achievement: Achievement
  onComplete?: (id: string) => void
  onDelete?: (id: string) => void
}

export function AchievementCard({ achievement, onComplete, onDelete }: AchievementCardProps) {
  const isUnlocked = achievement.isCompleted

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "14px",
      padding: "14px 16px",
      backgroundColor: isUnlocked ? "rgba(124,58,237,0.08)" : "#0D1117",
      border: `1px solid ${isUnlocked ? "rgba(124,58,237,0.25)" : "#1F2937"}`,
      borderRadius: "12px",
      opacity: isUnlocked ? 1 : 0.7,
    }}>
      {/* Ícone */}
      <div style={{
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        backgroundColor: isUnlocked ? "rgba(124,58,237,0.2)" : "#1F2937",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
        flexShrink: 0,
      }}>
        {isUnlocked ? "🏆" : achievement.isCustom ? "🎯" : "🔒"}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          color: isUnlocked ? "#A78BFA" : "#CBD5E1",
          fontSize: "14px",
          fontWeight: 600,
          marginBottom: "2px",
        }}>
          {achievement.title}
        </p>
        <p style={{ color: "#64748B", fontSize: "12px" }}>
          {achievement.description}
        </p>
        {achievement.goal && (
          <p style={{ color: "#475569", fontSize: "11px", marginTop: "3px" }}>
            Meta: {achievement.goal}
          </p>
        )}
        {isUnlocked && achievement.unlockedAt && (
          <p style={{ color: "#4B5563", fontSize: "11px", marginTop: "3px" }}>
            Desbloqueado em {format(new Date(achievement.unlockedAt), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        )}
      </div>

      {/* Ações */}
      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
        {achievement.isCustom && !achievement.isCompleted && onComplete && (
          <button
            onClick={() => onComplete(achievement.$id)}
            style={{
              backgroundColor: "#7C3AED",
              color: "white",
              fontSize: "11px",
              padding: "5px 10px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Concluir
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
  )
}