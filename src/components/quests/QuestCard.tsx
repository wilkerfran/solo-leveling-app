"use client"

import { Quest } from "@/types"

const DIFFICULTY_STYLES = {
  easy:      { label: "Fácil",    color: "text-green-400",  bg: "bg-green-950/30 border-green-900" },
  medium:    { label: "Médio",    color: "text-yellow-400", bg: "bg-yellow-950/30 border-yellow-900" },
  hard:      { label: "Difícil",  color: "text-orange-400", bg: "bg-orange-950/30 border-orange-900" },
  legendary: { label: "Lendário", color: "text-purple-400", bg: "bg-purple-950/30 border-purple-900" },
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
    <div className={`rounded-xl border p-4 transition-all ${diff.bg}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${diff.color}`}>
              {diff.label}
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-500">+{quest.xpReward} XP</span>
            {quest.isRecurring && (
              <>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-500">
                  {quest.recurringType === "daily" ? "Diária" : "Semanal"}
                </span>
              </>
            )}
          </div>
          <p className="text-white font-medium">{quest.title}</p>
          {quest.description && (
            <p className="text-slate-400 text-sm mt-1">{quest.description}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onComplete(quest)}
          disabled={isCompleting}
          className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {isCompleting ? "Completando..." : "Completar"}
        </button>
        <button
          onClick={() => onArchive(quest.$id)}
          className="px-3 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-sm transition-colors"
        >
          Arquivar
        </button>
      </div>
    </div>
  )
}