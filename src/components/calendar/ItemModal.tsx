"use client"

import { useState } from "react"
import { CalendarItem, Quest } from "@/types"
import { questService } from "@/services/quest.service"
import { RecurringPicker } from "@/components/quests/RecurringPicker"

interface ItemModalProps {
  item: CalendarItem
  onComplete: () => void
  onEdit: (data: { title?: string; description?: string; time?: string; duration?: number }) => Promise<void>
  onDelete: () => Promise<void>
  onQuestUpdated: () => void
  onClose: () => void
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Fácil", medium: "Médio", hard: "Difícil", legendary: "Lendário"
}

const XP_REWARDS = { easy: 25, medium: 75, hard: 150, legendary: 300 }

const RECURRING_LABELS: Record<string, string> = {
  daily: "Diária",
  specificDays: "Dias específicos",
  weekly: "Semanal",
  monthly: "Mensal",
}

export function ItemModal({ item, onComplete, onEdit, onDelete, onQuestUpdated, onClose }: ItemModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description ?? "")
  const [time, setTime] = useState(item.time ?? "")
  const [duration, setDuration] = useState(item.duration ?? 60)

  const [questTitle, setQuestTitle] = useState(item.title)
  const [questDescription, setQuestDescription] = useState(item.description ?? "")
  const [questDifficulty, setQuestDifficulty] = useState<Quest["difficulty"]>(
    (item.difficulty as Quest["difficulty"]) ?? "medium"
  )
  const [questIsRecurring, setQuestIsRecurring] = useState(item.isRecurring ?? false)
  const [questRecurringType, setQuestRecurringType] = useState<Quest["recurringType"]>(
    (item.recurringType as Quest["recurringType"]) ?? "daily"
  )
  const [questRecurringDays, setQuestRecurringDays] = useState<number[]>([])
  const [questRecurringFrequency, setQuestRecurringFrequency] = useState(1)

  const isQuest = item.type === "quest"

  // ID real da quest (remove sufixo de data para itens virtuais como "questId-2024-05-20")
// ID real da quest — sempre os primeiros 20 caracteres
const realQuestId = item.id.length > 20 ? item.id.substring(0, 20) : item.id
    ? item.id.split("-").slice(0, 5).join("-")
    : item.id

  async function handleSaveEvent() {
    setIsSaving(true)
    await onEdit({ title, description, time, duration })
    setIsSaving(false)
  }

  async function handleSaveQuest() {
    setIsSaving(true)
    try {
      await questService.update(realQuestId, {
        title: questTitle,
        description: questDescription,
        difficulty: questDifficulty,
        isRecurring: questIsRecurring,
        recurringType: questIsRecurring ? questRecurringType : undefined,
        recurringDays: questIsRecurring && questRecurringType === "specificDays"
          ? questRecurringDays : [],
        recurringFrequency: questIsRecurring && questRecurringType === "monthly"
          ? questRecurringFrequency : undefined,
        xpReward: XP_REWARDS[questDifficulty],
      })
      onQuestUpdated()
    } catch (err) {
      console.error("Erro ao salvar quest:", err)
    } finally {
      setIsSaving(false)
    }
  }

  function handleDeleteClick() {
    if (item.isRecurring) {
      setShowCancelModal(true)
    } else {
      handleDeleteForever()
    }
  }

  async function handleDeleteForever() {
    setIsDeleting(true)
    setShowCancelModal(false)
    try {
      await questService.delete(realQuestId)
      onQuestUpdated()
    } finally {
      setIsDeleting(false)
    }
  }

  function handleCancelThisDay() {
    // Quest virtual — só fecha o modal, não faz nada no banco
    setShowCancelModal(false)
    onClose()
  }

  async function handleDelete() {
    setIsDeleting(true)
    await onDelete()
    setIsDeleting(false)
  }

  const input: React.CSSProperties = {
    backgroundColor: "#080B14", border: "1px solid #1F2937",
    borderRadius: "8px", padding: "10px 12px",
    color: "white", fontSize: "14px", outline: "none",
    width: "100%", boxSizing: "border-box",
  }

  return (
    <>
      {/* Modal de confirmação de cancelamento */}
      {showCancelModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 300,
          backgroundColor: "rgba(0,0,0,0.9)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
        }}>
          <div style={{
            width: "100%", maxWidth: "360px",
            backgroundColor: "#0D1117", border: "1px solid #1F2937",
            borderRadius: "16px", padding: "24px",
          }}>
            <h3 style={{ color: "white", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>
              Cancelar quest recorrente
            </h3>
            <p style={{ color: "#64748B", fontSize: "13px", marginBottom: "24px", lineHeight: 1.5 }}>
              <strong style={{ color: "#CBD5E1" }}>{item.title}</strong> é uma quest recorrente. O que deseja fazer?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={handleCancelThisDay}
                style={{
                  padding: "12px 16px", backgroundColor: "rgba(124,58,237,0.1)",
                  border: "1px solid rgba(124,58,237,0.3)", borderRadius: "10px",
                  color: "#A78BFA", cursor: "pointer", fontSize: "14px", textAlign: "left",
                }}
              >
                <div style={{ fontWeight: 600 }}>Pular só hoje</div>
                <div style={{ color: "#64748B", fontSize: "12px", marginTop: "2px" }}>
                  A quest continua nos próximos dias
                </div>
              </button>
              <button
                onClick={handleDeleteForever}
                disabled={isDeleting}
                style={{
                  padding: "12px 16px", backgroundColor: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px",
                  color: "#EF4444", cursor: isDeleting ? "not-allowed" : "pointer",
                  fontSize: "14px", textAlign: "left",
                  opacity: isDeleting ? 0.6 : 1,
                }}
              >
                <div style={{ fontWeight: 600 }}>{isDeleting ? "Removendo..." : "Cancelar para sempre"}</div>
                <div style={{ color: "#64748B", fontSize: "12px", marginTop: "2px" }}>
                  Remove a quest completamente
                </div>
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  padding: "10px", backgroundColor: "transparent",
                  border: "1px solid #1F2937", borderRadius: "10px",
                  color: "#64748B", cursor: "pointer", fontSize: "13px",
                }}
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal principal */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 200,
        backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
      }}>
        <div style={{
          width: "100%", maxWidth: "400px",
          backgroundColor: "#0D1117", border: "1px solid #1F2937",
          borderRadius: "16px", overflow: "hidden",
          maxHeight: "90vh", display: "flex", flexDirection: "column",
        }}>
          <div style={{
            padding: "14px 18px", borderBottom: "1px solid #1F2937",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            backgroundColor: isQuest ? "rgba(124,58,237,0.08)" : "rgba(37,99,235,0.08)",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>{isQuest ? "⚔️" : "📅"}</span>
              <span style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {isQuest ? "Quest" : "Evento"}
              </span>
              {item.isRecurring && (
                <span style={{
                  fontSize: "10px", color: "#A78BFA",
                  backgroundColor: "rgba(124,58,237,0.15)",
                  padding: "2px 6px", borderRadius: "99px",
                }}>🔄 Recorrente</span>
              )}
            </div>
            <button onClick={onClose} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>×</button>
          </div>

          <div style={{ padding: "18px", overflowY: "auto", flex: 1 }}>

            {!isEditing && (
              <>
                <h3 style={{ color: "white", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>
                  {item.title}
                </h3>
                {item.description && (
                  <p style={{ color: "#64748B", fontSize: "13px", marginBottom: "12px", lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                )}
                <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                  {item.time && (
                    <div>
                      <p style={{ color: "#475569", fontSize: "11px" }}>Horário</p>
                      <p style={{ color: "#94A3B8", fontSize: "13px" }}>{item.time}</p>
                    </div>
                  )}
                  {item.duration && (
                    <div>
                      <p style={{ color: "#475569", fontSize: "11px" }}>Duração</p>
                      <p style={{ color: "#94A3B8", fontSize: "13px" }}>
                        {item.duration >= 60
                          ? `${Math.floor(item.duration / 60)}h${item.duration % 60 > 0 ? ` ${item.duration % 60}min` : ""}`
                          : `${item.duration}min`}
                      </p>
                    </div>
                  )}
                  {isQuest && item.difficulty && (
                    <div>
                      <p style={{ color: "#475569", fontSize: "11px" }}>Dificuldade</p>
                      <p style={{ color: "#A78BFA", fontSize: "13px" }}>{DIFFICULTY_LABELS[item.difficulty]}</p>
                    </div>
                  )}
                  {isQuest && item.xpReward && (
                    <div>
                      <p style={{ color: "#475569", fontSize: "11px" }}>Recompensa</p>
                      <p style={{ color: "#A78BFA", fontSize: "13px" }}>+{item.xpReward} XP</p>
                    </div>
                  )}
                  {isQuest && item.isRecurring && item.recurringType && (
                    <div>
                      <p style={{ color: "#475569", fontSize: "11px" }}>Recorrência</p>
                      <p style={{ color: "#94A3B8", fontSize: "13px" }}>
                        🔄 {RECURRING_LABELS[item.recurringType] ?? item.recurringType}
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {isQuest && !item.isCompleted && (
                    <button onClick={onComplete} style={{
                      flex: 1, padding: "10px", backgroundColor: "#7C3AED",
                      border: "none", borderRadius: "8px", color: "white",
                      cursor: "pointer", fontSize: "13px", fontWeight: 600,
                    }}>
                      Completar ✓
                    </button>
                  )}
                  <button onClick={() => setIsEditing(true)} style={{
                    flex: 1, padding: "10px", backgroundColor: "transparent",
                    border: "1px solid #1F2937", borderRadius: "8px", color: "#94A3B8",
                    cursor: "pointer", fontSize: "13px",
                  }}>
                    Editar
                  </button>
                  <button
                    onClick={isQuest ? handleDeleteClick : handleDelete}
                    disabled={isDeleting}
                    style={{
                      padding: "10px 14px",
                      backgroundColor: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: "8px", color: "#EF4444",
                      cursor: isDeleting ? "not-allowed" : "pointer", fontSize: "13px",
                    }}
                  >
                    {isDeleting ? "..." : "🗑"}
                  </button>
                </div>
              </>
            )}

            {isEditing && isQuest && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "6px" }}>Título</label>
                  <input value={questTitle} onChange={e => setQuestTitle(e.target.value)} style={input} />
                </div>
                <div>
                  <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "6px" }}>Descrição</label>
                  <textarea value={questDescription} onChange={e => setQuestDescription(e.target.value)} rows={2} style={{ ...input, resize: "none" }} />
                </div>
                <div>
                  <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "6px" }}>Dificuldade</label>
                  <select value={questDifficulty} onChange={e => setQuestDifficulty(e.target.value as Quest["difficulty"])} style={input}>
                    {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v} — +{XP_REWARDS[k as Quest["difficulty"]]} XP</option>
                    ))}
                  </select>
                </div>

                <RecurringPicker
                  isRecurring={questIsRecurring}
                  recurringType={questRecurringType}
                  recurringDays={questRecurringDays}
                  recurringFrequency={questRecurringFrequency}
                  onIsRecurringChange={setQuestIsRecurring}
                  onTypeChange={setQuestRecurringType}
                  onDaysChange={setQuestRecurringDays}
                  onFrequencyChange={setQuestRecurringFrequency}
                />

                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button onClick={() => setIsEditing(false)} style={{
                    flex: 1, padding: "10px", backgroundColor: "transparent",
                    border: "1px solid #1F2937", borderRadius: "8px",
                    color: "#64748B", cursor: "pointer", fontSize: "13px",
                  }}>
                    Cancelar
                  </button>
                  <button onClick={handleSaveQuest} disabled={isSaving} style={{
                    flex: 1, padding: "10px", backgroundColor: "#7C3AED",
                    border: "none", borderRadius: "8px",
                    color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 600,
                    opacity: isSaving ? 0.6 : 1,
                  }}>
                    {isSaving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            )}

            {isEditing && !isQuest && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "6px" }}>Título</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} style={input} />
                </div>
                <div>
                  <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "6px" }}>Descrição</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ ...input, resize: "none" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "6px" }}>Horário</label>
                    <input type="time" value={time} onChange={e => setTime(e.target.value)} style={input} />
                  </div>
                  <div>
                    <label style={{ color: "#94A3B8", fontSize: "12px", display: "block", marginBottom: "6px" }}>Duração</label>
                    <select value={duration} onChange={e => setDuration(Number(e.target.value))} style={input}>
                      {[15, 30, 45, 60, 90, 120, 180, 240].map(d => (
                        <option key={d} value={d}>
                          {d >= 60 ? `${Math.floor(d / 60)}h${d % 60 > 0 ? ` ${d % 60}min` : ""}` : `${d}min`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setIsEditing(false)} style={{
                    flex: 1, padding: "10px", backgroundColor: "transparent",
                    border: "1px solid #1F2937", borderRadius: "8px",
                    color: "#64748B", cursor: "pointer", fontSize: "13px",
                  }}>
                    Cancelar
                  </button>
                  <button onClick={handleSaveEvent} disabled={isSaving} style={{
                    flex: 1, padding: "10px", backgroundColor: "#7C3AED",
                    border: "none", borderRadius: "8px",
                    color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 600,
                    opacity: isSaving ? 0.6 : 1,
                  }}>
                    {isSaving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}