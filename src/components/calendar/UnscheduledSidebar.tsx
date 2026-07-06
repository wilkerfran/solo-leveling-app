"use client"

import { useState } from "react"
import { Quest } from "@/types"
import { questService } from "@/services/quest.service"
import { RecurringPicker } from "@/components/quests/RecurringPicker"

const DIFFICULTY_COLORS = {
  easy:      { color: "#22C55E", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)" },
  medium:    { color: "#EAB308", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.2)" },
  hard:      { color: "#F97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)" },
  legendary: { color: "#A78BFA", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
}

const DIFFICULTY_LABELS = {
  easy: "Fácil", medium: "Médio", hard: "Difícil", legendary: "Lendário"
}

const XP_REWARDS = { easy: 25, medium: 75, hard: 150, legendary: 300 }

const CATEGORIES = [
  { value: "saude",     label: "Saúde" },
  { value: "exercicio", label: "Exercício" },
  { value: "estudos",   label: "Estudos" },
  { value: "carreira",  label: "Carreira" },
  { value: "habito",    label: "Hábito" },
  { value: "criativo",  label: "Criativo" },
  { value: "outro",     label: "Outro" },
]

const RECURRING_LABELS: Record<string, string> = {
  daily: "Diária",
  specificDays: "Dias específicos",
  weekly: "Semanal",
  monthly: "Mensal",
}

interface UnscheduledSidebarProps {
  quests: Quest[]
  isLoading: boolean
  characterId: string
  onQuestCreated: () => void
}

export function UnscheduledSidebar({ quests, isLoading, characterId, onQuestCreated }: UnscheduledSidebarProps) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [difficulty, setDifficulty] = useState<Quest["difficulty"]>("medium")
  const [category, setCategory] = useState("outro")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringType, setRecurringType] = useState<Quest["recurringType"]>("daily")
  const [recurringDays, setRecurringDays] = useState<number[]>([])
  const [recurringFrequency, setRecurringFrequency] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleDragStart(e: React.DragEvent, quest: Quest) {
    e.dataTransfer.setData("questId", quest.$id)
    e.dataTransfer.setData("type", "unscheduled")
  }

  async function handleDelete(e: React.MouseEvent, questId: string) {
    e.stopPropagation()
    e.preventDefault()
    setDeletingId(questId)
    try {
      await questService.delete(questId)
      onQuestCreated()
    } finally {
      setDeletingId(null)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setIsSaving(true)
    try {
      await questService.create(characterId, {
        title: title.trim(),
        description: description.trim(),
        difficulty,
        category,
        isRecurring,
        recurringType: isRecurring ? recurringType : undefined,
        recurringDays: isRecurring && recurringType === "specificDays" ? recurringDays : undefined,
        recurringFrequency: isRecurring && recurringType === "monthly" ? recurringFrequency : undefined,
      })
      setTitle("")
      setDescription("")
      setDifficulty("medium")
      setCategory("outro")
      setIsRecurring(false)
      setRecurringType("daily")
      setRecurringDays([])
      setRecurringFrequency(1)
      setShowForm(false)
      onQuestCreated()
    } finally {
      setIsSaving(false)
    }
  }

  const input: React.CSSProperties = {
    width: "100%", backgroundColor: "#080B14",
    border: "1px solid #1F2937", borderRadius: "6px",
    padding: "7px 10px", color: "white", fontSize: "12px",
    outline: "none", boxSizing: "border-box",
  }

  return (
    <div style={{ width: "200px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <p style={{ color: "#64748B", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Não agendadas
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            color: showForm ? "#EF4444" : "#A78BFA",
            background: "none", border: "none", cursor: "pointer",
            fontSize: "18px", lineHeight: 1, padding: "2px",
          }}
        >
          {showForm ? "×" : "+"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{
          backgroundColor: "#111827", border: "1px solid #1F2937",
          borderRadius: "10px", padding: "12px",
          display: "flex", flexDirection: "column", gap: "8px",
          maxHeight: "70vh", overflowY: "auto",
        }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" required style={input} />
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição" style={input} />
          <select value={category} onChange={e => setCategory(e.target.value)} style={input}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value as Quest["difficulty"])} style={input}>
            {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v} — +{XP_REWARDS[k as Quest["difficulty"]]} XP</option>
            ))}
          </select>

          <RecurringPicker
            size="sm"
            isRecurring={isRecurring}
            recurringType={recurringType}
            recurringDays={recurringDays}
            recurringFrequency={recurringFrequency}
            onIsRecurringChange={setIsRecurring}
            onTypeChange={setRecurringType}
            onDaysChange={setRecurringDays}
            onFrequencyChange={setRecurringFrequency}
          />

          <button type="submit" disabled={isSaving} style={{
            padding: "8px", backgroundColor: "#7C3AED",
            border: "none", borderRadius: "6px",
            color: "white", fontSize: "12px", fontWeight: 600,
            cursor: isSaving ? "not-allowed" : "pointer",
            opacity: isSaving ? 0.6 : 1,
          }}>
            {isSaving ? "Criando..." : "Criar quest"}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
      ) : quests.length === 0 && !showForm ? (
        <p style={{ color: "#374151", fontSize: "12px", textAlign: "center", padding: "16px 0" }}>
          Todas agendadas ✓
        </p>
      ) : (
        quests.map(quest => {
          const style = DIFFICULTY_COLORS[quest.difficulty]
          return (
            <div
              key={quest.$id}
              draggable
              onDragStart={e => handleDragStart(e, quest)}
              style={{
                padding: "10px 12px",
                backgroundColor: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: "8px",
                cursor: "grab",
                userSelect: "none",
                position: "relative",
                opacity: deletingId === quest.$id ? 0.5 : 1,
              }}
            >
              {/* Botão deletar */}
              <button
                onClick={e => handleDelete(e, quest.$id)}
                disabled={deletingId === quest.$id}
                style={{
                  position: "absolute", top: "5px", right: "5px",
                  color: "#374151", background: "none", border: "none",
                  cursor: "pointer", fontSize: "15px", lineHeight: 1,
                  padding: "2px 4px",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                onMouseLeave={e => e.currentTarget.style.color = "#374151"}
              >
                ×
              </button>

              <p style={{ color: "white", fontSize: "12px", fontWeight: 500, marginBottom: "4px", paddingRight: "16px" }}>
                {quest.title}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: style.color, fontSize: "10px" }}>{DIFFICULTY_LABELS[quest.difficulty]}</span>
                <span style={{ color: "#475569", fontSize: "10px" }}>+{quest.xpReward} XP</span>
              </div>
              {quest.isRecurring && quest.recurringType && (
                <p style={{ color: "#374151", fontSize: "10px", marginTop: "3px" }}>
                  🔄 {RECURRING_LABELS[quest.recurringType] ?? quest.recurringType}
                </p>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}