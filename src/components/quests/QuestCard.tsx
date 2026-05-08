"use client"

import { Quest } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

const DIFFICULTY_STYLES = {
  easy:      { label: "Fácil",    color: "#22C55E",  bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.2)" },
  medium:    { label: "Médio",    color: "#EAB308",  bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.2)" },
  hard:      { label: "Difícil",  color: "#F97316",  bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.2)" },
  legendary: { label: "Lendário", color: "#A78BFA",  bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
}

interface QuestCardProps {
  quest: Quest
  onComplete: (quest: Quest) => void
  onArchive: (questId: string) => void
  isCompleting?: boolean
}

export function QuestCard({ quest, onComplete, onArchive, isCompleting }: QuestCardProps) {
  const diff = DIFFICULTY_STYLES[quest.difficulty]

  return (
    <div style={{
      backgroundColor: diff.bg,
      border: `1px solid ${diff.border}`,
      borderRadius: "12px",
      padding: "14px 16px",
      transition: "all 0.2s",
    }}>
      {/* Header da quest */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
          <span style={{ color: diff.color, fontSize: "11px", fontWeight: 600 }}>
            {diff.label}
          </span>
          <span style={{ color: "#475569", fontSize: "11px" }}>•</span>
          <span style={{ color: "#475569", fontSize: "11px" }}>+{quest.xpReward} XP</span>
          {quest.isRecurring && (
            <>
              <span style={{ color: "#475569", fontSize: "11px" }}>•</span>
              <span style={{ color: "#475569", fontSize: "11px" }}>
                {quest.recurringType === "daily" ? "Diária" : "Semanal"}
              </span>
            </>
          )}
        </div>
        <p style={{ color: "white", fontSize: "14px", fontWeight: 600, marginBottom: "2px" }}>
          {quest.title}
        </p>
        {quest.isRecurring && quest.nextResetAt && (
  <p style={{ color: "#475569", fontSize: "11px", marginTop: "4px" }}>
    Reseta em {formatDistanceToNow(new Date(quest.nextResetAt), { locale: ptBR, addSuffix: true })}
  </p>
)}
        
        {quest.description && (
          <p style={{ color: "#64748B", fontSize: "12px", marginTop: "4px" }}>
            {quest.description}
          </p>
        )}
      </div>

      {/* Ações */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => onComplete(quest)}
          disabled={isCompleting}
          style={{
            flex: 1,
            backgroundColor: isCompleting ? "rgba(124,58,237,0.3)" : "#7C3AED",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "9px 16px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: isCompleting ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            boxShadow: isCompleting ? "none" : "0 0 12px rgba(124,58,237,0.25)",
          }}
          onMouseEnter={e => {
            if (!isCompleting) e.currentTarget.style.backgroundColor = "#6D28D9"
          }}
          onMouseLeave={e => {
            if (!isCompleting) e.currentTarget.style.backgroundColor = "#7C3AED"
          }}
        >
          {isCompleting ? "Completando..." : "Completar ✓"}
        </button>
        <button
          onClick={() => onArchive(quest.$id)}
          disabled={isCompleting}
          style={{
            backgroundColor: "transparent",
            color: "#475569",
            border: "1px solid #1F2937",
            borderRadius: "8px",
            padding: "9px 14px",
            fontSize: "13px",
            cursor: isCompleting ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = "white"
            e.currentTarget.style.borderColor = "#374151"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = "#475569"
            e.currentTarget.style.borderColor = "#1F2937"
          }}
        >
          Arquivar
        </button>
      </div>
    </div>
  )
}