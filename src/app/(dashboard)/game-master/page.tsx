"use client"

import { useAuth } from "@/hooks/useAuth"
import { useCharacter } from "@/hooks/useCharacter"
import { useQuests } from "@/hooks/useQuests"
import { useGameMaster } from "@/hooks/useGameMaster"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { questService } from "@/services/quest.service"
import { achievementService } from "@/services/achievement.service"
import { Quest, Achievement } from "@/types"

const SUGGESTED_QUESTIONS = [
  "Como está meu progresso geral?",
  "Que quests você sugere para hoje?",
  "Qual meu ponto mais fraco agora?",
  "Me motiva a continuar!",
]

export default function GameMasterPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { character, isLoading: charLoading } = useCharacter(user?.$id)
  const { quests } = useQuests(character?.$id)
  const { messages, isLoading: aiLoading, sendMessage, clearMessages } = useGameMaster()
  const router = useRouter()

  const [input, setInput] = useState("")
  const [completedQuests, setCompletedQuests] = useState<Quest[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (authLoading || charLoading) return
    if (!user) { router.push("/login"); return }
    if (!character) return

    Promise.all([
      questService.listCompleted(character.$id),
      achievementService.listByCharacter(character.$id),
    ]).then(([completed, achieve]) => {
      setCompletedQuests(completed)
      setAchievements(achieve.filter(a => a.isCompleted))
    }).catch(err => console.error("Erro ao carregar contexto:", err))
  }, [user, character, authLoading, charLoading, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (authLoading || charLoading || !character) {
    return (
      <main style={{
        height: "100%", display: "flex",
        alignItems: "center", justifyContent: "center",
        backgroundColor: "#080B14",
      }}>
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  const context = {
    characterName: character.name,
    characterClass: character.class,
    level: character.level,
    xp: character.xp,
    xpToNextLevel: character.xpToNextLevel,
    attributes: character.attributes,
    activeQuests: quests,
    completedQuests,
    achievements,
  }

  async function handleSend(content?: string) {
    const text = content ?? input.trim()
    if (!text || aiLoading) return
    setInput("")
    await sendMessage(text, context)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
  <main className="game-master-main" style={{
  backgroundColor: "#080B14",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
}}>

      {/* Título + Limpar chat */}
      <div style={{
        flexShrink: 0,
        maxWidth: "680px", margin: "0 auto", width: "100%",
        padding: "16px 24px 12px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #1F2937",
      }}>
        <h1 style={{ color: "white", fontSize: "15px", fontWeight: 700 }}>Game Master</h1>
        <button
          onClick={clearMessages}
          style={{ color: "#475569", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.color = "white")}
          onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
        >
          Limpar chat
        </button>
      </div>

      {/* Área de mensagens — scroll interno */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        maxWidth: "680px", width: "100%",
        margin: "0 auto",
        padding: "20px 24px 0",
      }}>

        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{
              width: "60px", height: "60px", borderRadius: "50%",
              backgroundColor: "rgba(124,58,237,0.15)",
              border: "1px solid rgba(124,58,237,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: "26px",
            }}>
              ⚔️
            </div>
            <h2 style={{ color: "white", fontSize: "17px", fontWeight: 700, marginBottom: "8px" }}>
              Game Master
            </h2>
            <p style={{ color: "#64748B", fontSize: "13px", marginBottom: "28px" }}>
              Seu guia pessoal conhece seu progresso. Pergunte qualquer coisa.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "400px", margin: "0 auto" }}>
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={aiLoading}
                  style={{
                    backgroundColor: "rgba(124,58,237,0.08)",
                    border: "1px solid rgba(124,58,237,0.2)",
                    borderRadius: "10px", padding: "11px 16px",
                    color: "#A78BFA", fontSize: "13px",
                    cursor: aiLoading ? "not-allowed" : "pointer",
                    textAlign: "left", transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "rgba(124,58,237,0.15)"
                    e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "rgba(124,58,237,0.08)"
                    e.currentTarget.style.borderColor = "rgba(124,58,237,0.2)"
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "16px" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              gap: "10px", alignItems: "flex-start",
            }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                backgroundColor: msg.role === "user" ? "rgba(124,58,237,0.2)" : "rgba(30,41,59,0.8)",
                border: `1px solid ${msg.role === "user" ? "rgba(124,58,237,0.4)" : "#1F2937"}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
              }}>
                {msg.role === "user" ? "⚔" : "👁"}
              </div>
              <div style={{
                maxWidth: "75%",
                backgroundColor: msg.role === "user" ? "rgba(124,58,237,0.12)" : "#111827",
                border: `1px solid ${msg.role === "user" ? "rgba(124,58,237,0.25)" : "#1F2937"}`,
                borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                padding: "12px 16px",
              }}>
                <p style={{
                  color: msg.role === "user" ? "#C4B5FD" : "#CBD5E1",
                  fontSize: "14px", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                </p>
              </div>
            </div>
          ))}

          {aiLoading && (
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                backgroundColor: "rgba(30,41,59,0.8)", border: "1px solid #1F2937",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
              }}>👁</div>
              <div style={{
                backgroundColor: "#111827", border: "1px solid #1F2937",
                borderRadius: "4px 16px 16px 16px", padding: "16px",
                display: "flex", gap: "4px", alignItems: "center",
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    backgroundColor: "#7C3AED",
                  }} className="animate-pulse" />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input fixo no bottom do chat */}
      <div style={{
        flexShrink: 0,
        borderTop: "1px solid #1F2937",
        backgroundColor: "rgba(8,11,20,0.95)",
        backdropFilter: "blur(8px)",
        padding: "12px 24px",
      }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Fale com o Game Master..."
            rows={1}
            disabled={aiLoading}
            style={{
              flex: 1, backgroundColor: "#111827", border: "1px solid #1F2937",
              borderRadius: "12px", padding: "11px 16px", color: "white",
              fontSize: "14px", resize: "none", outline: "none",
              fontFamily: "inherit", lineHeight: 1.5,
              maxHeight: "100px", overflowY: "auto",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "#7C3AED")}
            onBlur={e => (e.currentTarget.style.borderColor = "#1F2937")}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || aiLoading}
            style={{
              backgroundColor: input.trim() && !aiLoading ? "#7C3AED" : "#1F2937",
              color: input.trim() && !aiLoading ? "white" : "#475569",
              border: "none", borderRadius: "12px", width: "42px", height: "42px",
              cursor: input.trim() && !aiLoading ? "pointer" : "not-allowed",
              fontSize: "18px", transition: "all 0.2s", flexShrink: 0,
            }}
          >
            ↑
          </button>
        </div>
        <p style={{ color: "#374151", fontSize: "11px", textAlign: "center", marginTop: "8px" }}>
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>

    </main>
  )
}