"use client"

import { useEffect, useRef, useState } from "react"
import { useWeeklyPlanner, WeeklyPlan } from "@/hooks/useWeeklyPlanner"
import { Character, Quest } from "@/types"
import { questService } from "@/services/quest.service"
import { achievementService } from "@/services/achievement.service"
import { penaltyService } from "@/services/penalty.service"

interface WeeklyPlannerModalProps {
  character: Character
  activeQuests: Quest[]
  onClose: () => void
  onPlanCreated: (updatedCharacter: Character) => void
}

export function WeeklyPlannerModal({
  character,
  activeQuests,
  onClose,
  onPlanCreated,
}: WeeklyPlannerModalProps) {
  const {
    messages, phase, isLoading, pendingPlan,
    sendMessage, startPlanning, reset,
  } = useWeeklyPlanner()

  const [input, setInput] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [creationResult, setCreationResult] = useState<{
    questsCreated: number
    achievementsCreated: number
    penaltiesApplied: number
    totalXPLost: number
  } | null>(null)
  const [hasPenalties] = useState(activeQuests.length > 0)
  const [showPenaltyWarning, setShowPenaltyWarning] = useState(hasPenalties)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const context = {
    characterName: character.name,
    characterClass: character.class,
    level: character.level,
    attributes: character.attributes,
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleStart() {
    setShowPenaltyWarning(false)
    await startPlanning(context)
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    await sendMessage(text, context)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleCreatePlan(plan: WeeklyPlan) {
    setIsCreating(true)
    let updatedCharacter = character
    let penaltiesApplied = 0
    let totalXPLost = 0

    try {
      // 1. Aplica penalidades nas quests não concluídas
      if (activeQuests.length > 0) {
        const result = await penaltyService.processWeeklyPenalties(
          character, activeQuests
        )
        updatedCharacter = result.updatedCharacter
        penaltiesApplied = result.penaltiesApplied
        totalXPLost = result.totalXPLost
      }

      // 2. Cria as quests
      for (const quest of plan.quests) {
        await questService.create(character.$id, {
          title: quest.title,
          description: quest.description,
          category: quest.category,
          difficulty: quest.difficulty,
          isRecurring: quest.isRecurring,
          recurringType: quest.recurringType as "daily" | "weekly" | undefined,
        })
      }

      // 3. Cria as metas pessoais
      for (const achievement of plan.customAchievements) {
        await achievementService.createCustom(
          character.$id,
          achievement.title,
          achievement.description,
          achievement.goal
        )
      }

      setCreationResult({
        questsCreated: plan.quests.length,
        achievementsCreated: plan.customAchievements.length,
        penaltiesApplied,
        totalXPLost,
      })

      onPlanCreated(updatedCharacter)

    } catch (err) {
      console.error("Erro ao criar plano:", err)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      backgroundColor: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        width: "100%", maxWidth: "600px",
        height: "85vh",
        backgroundColor: "#0D1117",
        border: "1px solid #1F2937",
        borderRadius: "20px",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid #1F2937",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%",
              backgroundColor: "#7C3AED",
            }} className="animate-pulse" />
            <span style={{ color: "white", fontWeight: 700, fontSize: "14px" }}>
              Planejador Semanal
            </span>
          </div>
          <button
            onClick={() => { reset(); onClose() }}
            style={{
              color: "#475569", background: "none",
              border: "none", cursor: "pointer", fontSize: "20px",
            }}
          >
            ×
          </button>
        </div>

        {/* Aviso de penalidades */}
        {showPenaltyWarning && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "32px 24px", textAlign: "center",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h2 style={{ color: "#EF4444", fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>
              Julgamento Pendente
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.6, marginBottom: "8px" }}>
              Você tem <span style={{ color: "#F97316", fontWeight: 700 }}>{activeQuests.length} quest{activeQuests.length > 1 ? "s" : ""}</span> não concluída{activeQuests.length > 1 ? "s" : ""} da semana anterior:
            </p>
            <div style={{ width: "100%", marginBottom: "24px" }}>
              {activeQuests.map(q => (
                <div key={q.$id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", marginBottom: "6px",
                  backgroundColor: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "8px",
                }}>
                  <span style={{ color: "#CBD5E1", fontSize: "13px" }}>{q.title}</span>
                  <span style={{ color: "#EF4444", fontSize: "12px", fontWeight: 600 }}>
                    -{q.difficulty === "easy" ? 10 : q.difficulty === "medium" ? 30 : q.difficulty === "hard" ? 75 : 150} XP
                  </span>
                </div>
              ))}
            </div>
            <p style={{ color: "#64748B", fontSize: "13px", marginBottom: "24px" }}>
              Ao continuar, as penalidades serão aplicadas e o planejamento da nova semana começará.
            </p>
            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <button
                onClick={() => { reset(); onClose() }}
                style={{
                  flex: 1, padding: "12px",
                  backgroundColor: "transparent",
                  border: "1px solid #1F2937",
                  borderRadius: "10px",
                  color: "#64748B", cursor: "pointer", fontSize: "14px",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleStart}
                style={{
                  flex: 1, padding: "12px",
                  backgroundColor: "#EF4444",
                  border: "none", borderRadius: "10px",
                  color: "white", cursor: "pointer",
                  fontSize: "14px", fontWeight: 600,
                }}
              >
                Aceitar e Continuar
              </button>
            </div>
          </div>
        )}

        {/* Resultado da criação */}
        {creationResult && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "32px 24px", textAlign: "center",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚔️</div>
            <h2 style={{ color: "#A78BFA", fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>
              Semana Configurada!
            </h2>

            <div style={{ width: "100%", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{
                padding: "12px 16px", backgroundColor: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.2)", borderRadius: "10px",
                display: "flex", justifyContent: "space-between",
              }}>
                <span style={{ color: "#94A3B8", fontSize: "14px" }}>Quests criadas</span>
                <span style={{ color: "#A78BFA", fontWeight: 700 }}>{creationResult.questsCreated}</span>
              </div>
              <div style={{
                padding: "12px 16px", backgroundColor: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.15)", borderRadius: "10px",
                display: "flex", justifyContent: "space-between",
              }}>
                <span style={{ color: "#94A3B8", fontSize: "14px" }}>Metas criadas</span>
                <span style={{ color: "#F59E0B", fontWeight: 700 }}>{creationResult.achievementsCreated}</span>
              </div>
              {creationResult.penaltiesApplied > 0 && (
                <div style={{
                  padding: "12px 16px", backgroundColor: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.15)", borderRadius: "10px",
                  display: "flex", justifyContent: "space-between",
                }}>
                  <span style={{ color: "#94A3B8", fontSize: "14px" }}>Penalidades aplicadas</span>
                  <span style={{ color: "#EF4444", fontWeight: 700 }}>
                    -{creationResult.totalXPLost} XP
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => { reset(); onClose() }}
              style={{
                width: "100%", padding: "14px",
                backgroundColor: "#7C3AED",
                border: "none", borderRadius: "12px",
                color: "white", cursor: "pointer",
                fontSize: "15px", fontWeight: 600,
                boxShadow: "0 0 20px rgba(124,58,237,0.3)",
              }}
            >
              Iniciar a Semana ⚔️
            </button>
          </div>
        )}

        {/* Chat do planejador */}
        {!showPenaltyWarning && !creationResult && (
          <>
            <div style={{
              flex: 1, overflowY: "auto",
              padding: "16px 20px",
            }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#475569", fontSize: "13px" }}>
                  Iniciando planejamento semanal...
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    display: "flex",
                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                    gap: "8px", alignItems: "flex-start",
                  }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                      backgroundColor: msg.role === "user" ? "rgba(124,58,237,0.2)" : "rgba(30,41,59,0.8)",
                      border: `1px solid ${msg.role === "user" ? "rgba(124,58,237,0.4)" : "#1F2937"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px",
                    }}>
                      {msg.role === "user" ? "⚔" : "📋"}
                    </div>
                    <div style={{
                      maxWidth: "80%",
                      backgroundColor: msg.role === "user" ? "rgba(124,58,237,0.12)" : "#111827",
                      border: `1px solid ${msg.role === "user" ? "rgba(124,58,237,0.25)" : "#1F2937"}`,
                      borderRadius: msg.role === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                      padding: "10px 14px",
                    }}>
                      <p style={{
                        color: msg.role === "user" ? "#C4B5FD" : "#CBD5E1",
                        fontSize: "13px", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap",
                      }}>
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%",
                      backgroundColor: "rgba(30,41,59,0.8)", border: "1px solid #1F2937",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px",
                    }}>📋</div>
                    <div style={{
                      backgroundColor: "#111827", border: "1px solid #1F2937",
                      borderRadius: "4px 14px 14px 14px", padding: "14px",
                      display: "flex", gap: "4px", alignItems: "center",
                    }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: "5px", height: "5px", borderRadius: "50%",
                          backgroundColor: "#7C3AED",
                        }} className="animate-pulse" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Botão de aprovar plano */}
                {pendingPlan && !isCreating && (
                  <div style={{
                    backgroundColor: "rgba(124,58,237,0.08)",
                    border: "1px solid rgba(124,58,237,0.25)",
                    borderRadius: "12px", padding: "16px",
                    marginTop: "8px",
                  }}>
                    <p style={{ color: "#A78BFA", fontSize: "13px", fontWeight: 600, marginBottom: "12px" }}>
                      Plano pronto — {pendingPlan.quests.length} quests e {pendingPlan.customAchievements.length} metas
                    </p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleCreatePlan(pendingPlan)}
                        style={{
                          flex: 1, padding: "10px",
                          backgroundColor: "#7C3AED", border: "none",
                          borderRadius: "8px", color: "white",
                          cursor: "pointer", fontSize: "13px", fontWeight: 600,
                        }}
                      >
                        Criar tudo agora ⚔️
                      </button>
                      <button
                        onClick={() => sendMessage("Quero fazer ajustes no plano", context)}
                        style={{
                          flex: 1, padding: "10px",
                          backgroundColor: "transparent",
                          border: "1px solid #1F2937",
                          borderRadius: "8px", color: "#64748B",
                          cursor: "pointer", fontSize: "13px",
                        }}
                      >
                        Fazer ajustes
                      </button>
                    </div>
                  </div>
                )}

                {isCreating && (
                  <div style={{ textAlign: "center", padding: "20px", color: "#A78BFA", fontSize: "13px" }}>
                    <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Criando seu plano semanal...
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div style={{
              flexShrink: 0, padding: "12px 16px",
              borderTop: "1px solid #1F2937",
            }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Descreva suas metas da semana..."
                  rows={1}
                  disabled={isLoading || isCreating}
                  style={{
                    flex: 1, backgroundColor: "#111827",
                    border: "1px solid #1F2937", borderRadius: "10px",
                    padding: "10px 14px", color: "white",
                    fontSize: "13px", resize: "none", outline: "none",
                    fontFamily: "inherit", lineHeight: 1.5, maxHeight: "80px",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#7C3AED")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#1F2937")}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || isCreating}
                  style={{
                    backgroundColor: input.trim() && !isLoading ? "#7C3AED" : "#1F2937",
                    color: input.trim() && !isLoading ? "white" : "#475569",
                    border: "none", borderRadius: "10px",
                    width: "40px", height: "40px",
                    cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                    fontSize: "16px", flexShrink: 0,
                  }}
                >
                  ↑
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}