"use client"

import { useState } from "react"
import { Quest } from "@/types"

const DAYS_OF_WEEK = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
]

const EVENT_COLORS = [
  "#7C3AED", "#2563EB", "#059669",
  "#D97706", "#DC2626", "#DB2777",
]

export interface EventSaveData {
  type: "quest" | "event"
  questId?: string
  title: string
  description?: string
  date: string
  time: string
  duration: number
  color?: string
  isRecurring: boolean
  recurringDays?: number[]
}

interface EventModalProps {
  initialDate: string
  initialTime: string
  unscheduledQuests: Quest[]
  onSave: (data: EventSaveData) => Promise<void>
  onClose: () => void
}

export function EventModal({
  initialDate, initialTime, unscheduledQuests, onSave, onClose
}: EventModalProps) {
  const [type, setType] = useState<"quest" | "event">("event")
  const [questId, setQuestId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState(initialTime)
  const [duration, setDuration] = useState(60)
  const [color, setColor] = useState("#7C3AED")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringDays, setRecurringDays] = useState<number[]>([])
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (type === "quest" && !questId) return
    if (type === "event" && !title.trim()) return
    setIsSaving(true)
    try {
      const selectedQuest = unscheduledQuests.find(q => q.$id === questId)
      await onSave({
        type,
        questId: type === "quest" ? questId : undefined,
        title: type === "quest" ? (selectedQuest?.title ?? "") : title,
        description,
        date,
        time,
        duration,
        color: type === "event" ? color : undefined,
        isRecurring,
        recurringDays: isRecurring ? recurringDays : undefined,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const input: React.CSSProperties = {
    width: "100%", backgroundColor: "#080B14",
    border: "1px solid #1F2937", borderRadius: "8px",
    padding: "10px 12px", color: "white", fontSize: "14px",
    outline: "none", boxSizing: "border-box",
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
    }}>
      <div style={{
        width: "100%", maxWidth: "440px",
        backgroundColor: "#0D1117", border: "1px solid #1F2937",
        borderRadius: "16px", overflow: "hidden",
      }}>
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #1F2937",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h3 style={{ color: "white", fontSize: "15px", fontWeight: 700 }}>Novo item</h3>
          <button onClick={onClose} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>×</button>
        </div>

        <form onSubmit={handleSave} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Tipo */}
          <div style={{ display: "flex", gap: "8px" }}>
            {(["event", "quest"] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)} style={{
                flex: 1, padding: "8px", borderRadius: "8px", fontSize: "13px", cursor: "pointer",
                backgroundColor: type === t ? "rgba(124,58,237,0.2)" : "transparent",
                border: `1px solid ${type === t ? "rgba(124,58,237,0.4)" : "#1F2937"}`,
                color: type === t ? "#A78BFA" : "#64748B",
              }}>
                {t === "event" ? "📅 Evento" : "⚔️ Quest"}
              </button>
            ))}
          </div>

          {/* Quest selector ou título */}
          {type === "quest" ? (
            <div>
              <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "6px" }}>
                Selecionar quest não agendada
              </label>
              <select value={questId} onChange={e => setQuestId(e.target.value)} required style={input}>
                <option value="">Escolha uma quest...</option>
                {unscheduledQuests.map(q => (
                  <option key={q.$id} value={q.$id}>{q.title}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "6px" }}>Título</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Reunião, consulta, etc..." required style={input} />
            </div>
          )}

          {/* Descrição */}
          <div>
            <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "6px" }}>Descrição (opcional)</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes..." style={input} />
          </div>

          {/* Data e hora */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "6px" }}>Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={input} />
            </div>
            <div>
              <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "6px" }}>Horário</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} required style={input} />
            </div>
          </div>

          {/* Duração */}
          <div>
            <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "6px" }}>
              Duração: {duration >= 60 ? `${Math.floor(duration/60)}h${duration%60 > 0 ? ` ${duration%60}min` : ""}` : `${duration}min`}
            </label>
            <input type="range" min={15} max={240} step={15} value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#7C3AED" }}
            />
          </div>

          {/* Cor */}
          {type === "event" && (
            <div>
              <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "6px" }}>Cor</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {EVENT_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)} style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    backgroundColor: c, border: "none", cursor: "pointer",
                    outline: color === c ? "3px solid white" : "none", outlineOffset: "2px",
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Recorrente */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: isRecurring ? "10px" : "0" }}>
              <button type="button" onClick={() => setIsRecurring(!isRecurring)} style={{
                width: "36px", height: "20px", borderRadius: "99px",
                backgroundColor: isRecurring ? "#7C3AED" : "#1F2937",
                border: "none", cursor: "pointer", position: "relative", transition: "all 0.2s",
              }}>
                <span style={{
                  position: "absolute", top: "2px",
                  left: isRecurring ? "18px" : "2px",
                  width: "16px", height: "16px",
                  backgroundColor: "white", borderRadius: "50%", transition: "left 0.2s",
                }} />
              </button>
              <span style={{ color: "#94A3B8", fontSize: "13px" }}>Recorrente</span>
            </div>
            {isRecurring && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {DAYS_OF_WEEK.map(d => (
                  <button key={d.value} type="button"
                    onClick={() => setRecurringDays(prev =>
                      prev.includes(d.value) ? prev.filter(x => x !== d.value) : [...prev, d.value]
                    )}
                    style={{
                      padding: "4px 10px", borderRadius: "6px", fontSize: "12px", cursor: "pointer",
                      backgroundColor: recurringDays.includes(d.value) ? "rgba(124,58,237,0.2)" : "transparent",
                      border: `1px solid ${recurringDays.includes(d.value) ? "rgba(124,58,237,0.4)" : "#1F2937"}`,
                      color: recurringDays.includes(d.value) ? "#A78BFA" : "#64748B",
                    }}>
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={isSaving} style={{
            padding: "12px", backgroundColor: "#7C3AED",
            border: "none", borderRadius: "10px", color: "white",
            fontSize: "14px", fontWeight: 600,
            cursor: isSaving ? "not-allowed" : "pointer",
            opacity: isSaving ? 0.6 : 1, marginTop: "4px",
          }}>
            {isSaving ? "Salvando..." : "Adicionar ao calendário"}
          </button>
        </form>
      </div>
    </div>
  )
}