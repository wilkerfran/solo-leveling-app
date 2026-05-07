"use client"

import { Quest } from "@/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:      "#22C55E",
  medium:    "#EAB308",
  hard:      "#F97316",
  legendary: "#A78BFA",
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy:      "Fácil",
  medium:    "Médio",
  hard:      "Difícil",
  legendary: "Lendário",
}

interface QuestHistoryProps {
  quests: Quest[]
  isLoading: boolean
}

export function QuestHistory({ quests, isLoading }: QuestHistoryProps) {
  if (isLoading) {
    return (
      <div style={{ padding: "24px 0", textAlign: "center" }}>
        <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (quests.length === 0) {
    return (
      <div style={{
        padding: "32px 20px",
        textAlign: "center",
        border: "1px dashed #1F2937",
        borderRadius: "12px",
      }}>
        <p style={{ color: "#64748B", fontSize: "14px" }}>
          Nenhuma quest concluída ainda
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {quests.map(quest => (
        <div
          key={quest.$id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            backgroundColor: "#0D1117",
            border: "1px solid #1F2937",
            borderRadius: "10px",
            gap: "12px",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              color: "#CBD5E1",
              fontSize: "14px",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {quest.title}
            </p>
            <p style={{ color: "#475569", fontSize: "12px", marginTop: "3px" }}>
              {quest.completedAt
                ? format(new Date(quest.completedAt), "dd 'de' MMM, HH:mm", { locale: ptBR })
                : "—"
              }
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <span style={{
              fontSize: "11px",
              fontWeight: 600,
              color: DIFFICULTY_COLORS[quest.difficulty],
            }}>
              {DIFFICULTY_LABELS[quest.difficulty]}
            </span>
            <span style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#A78BFA",
              backgroundColor: "rgba(124,58,237,0.1)",
              padding: "3px 8px",
              borderRadius: "6px",
            }}>
              +{quest.xpReward} XP
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}