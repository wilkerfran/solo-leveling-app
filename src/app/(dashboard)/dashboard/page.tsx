"use client"

import { useAuth } from "@/hooks/useAuth"
import { useCharacter } from "@/hooks/useCharacter"
import { useQuests } from "@/hooks/useQuests"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { QuestForm } from "@/components/quests/QuestForm"
import { QuestCard } from "@/components/quests/QuestCard"
import { LevelUpModal } from "@/components/ui/LevelUpModal"
import { XPFloat } from "@/components/ui/XPFloat"
import { NotificationBanner } from "@/components/ui/NotificationBanner"
import { achievementService } from "@/services/achievement.service"
import { xpService } from "@/services/xp.service"
import { questService } from "@/services/quest.service"
import { Quest } from "@/types"
import { WeeklyPlannerModal } from "@/components/ui/WeeklyPlannerModal"
import { useWeeklyPenalty } from "@/hooks/useWeeklyPenalty"

const CLASS_LABELS: Record<string, string> = {
  warrior: "Guerreiro",
  sage: "Sábio",
  hunter: "Caçador",
}

const ATTRIBUTE_CONFIG = [
  { key: "strength",   label: "Força",       color: "#EF4444" },
  { key: "discipline", label: "Disciplina",   color: "#3B82F6" },
  { key: "focus",      label: "Foco",         color: "#06B6D4" },
  { key: "health",     label: "Saúde",        color: "#22C55E" },
  { key: "creativity", label: "Criatividade", color: "#EAB308" },
]

const card: React.CSSProperties = {
  backgroundColor: "#111827",
  border: "1px solid #1F2937",
  borderRadius: "16px",
  padding: "28px",
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { character, isLoading: charLoading, hasCharacter, updateCharacter } = useCharacter(user?.$id)
  const { quests, isLoading: questsLoading, createQuest, completeQuest, archiveQuest, refresh } = useQuests(character?.$id)
  const router = useRouter()

  const [showForm, setShowForm] = useState(false)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [levelUpData, setLevelUpData] = useState<number | null>(null)
  const [xpFloat, setXpFloat] = useState<number | null>(null)
  const [showPlanner, setShowPlanner] = useState(false)

  const { shouldShowPlanner, setShouldShowPlanner } = useWeeklyPenalty(
    character,
    quests
  )

  useEffect(() => {
    if (authLoading || charLoading) return
    if (!user) { router.push("/login"); return }
    if (user && !hasCharacter) { router.push("/create-character") }
  }, [user, authLoading, charLoading, hasCharacter, router])

  useEffect(() => {
    if (shouldShowPlanner) {
      queueMicrotask(() => {
        setShowPlanner(true)
        setShouldShowPlanner(false)
      })
    }
  }, [shouldShowPlanner, setShouldShowPlanner])

  if (authLoading || charLoading || !character) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#080B14" }}>
        <div style={{ textAlign: "center" }}>
          <div className="w-10 h-10 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p style={{ color: "#64748B", fontSize: "14px" }}>Entrando no sistema...</p>
        </div>
      </main>
    )
  }

  const xpPercent = Math.min(Math.floor((character.xp / character.xpToNextLevel) * 100), 100)
  const maxAttr = Math.max(...Object.values(character.attributes), 10)

  async function handleCreateQuest(data: Parameters<typeof createQuest>[0]) {
    await createQuest(data)
    setShowForm(false)
  }

  async function handleCompleteQuest(quest: Quest) {
    if (!character) return
    setCompletingId(quest.$id)
    try {
      const { updatedCharacter, didLevelUp } = await completeQuest(quest, character)
      updateCharacter(updatedCharacter)
      setXpFloat(quest.xpReward)

      const existing = await achievementService.listByCharacter(character.$id)
      const unlockedIds = existing.filter(a => a.isCompleted).map(a => a.achievementId)
      const completedQuests = await questService.listCompleted(character.$id)
      const xpEvents = await xpService.listEvents(character.$id)

      const stats = {
        level: updatedCharacter.level,
        questsCompleted: completedQuests.length,
        legendaryCompleted: completedQuests.filter(q => q.difficulty === "legendary").length,
        totalXP: xpEvents.reduce((sum, e) => sum + e.xpGained, 0),
        streak: 0,
      }

      const newAchievements = await achievementService.checkAndUnlock(
        character.$id, stats, unlockedIds
      )

      if (newAchievements.length > 0) {
        setTimeout(() => {
          if (Notification.permission === "granted") {
            new Notification("Conquista desbloqueada!", {
              body: newAchievements[0].title,
              icon: "/icons/icon-sl.png",
            })
          }
        }, 1500)
      }

      if (didLevelUp) {
        setTimeout(() => setLevelUpData(updatedCharacter.level), 600)
      }
    } finally {
      setCompletingId(null)
    }
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#080B14", paddingBottom: "20px" }}>

      {levelUpData && (
        <LevelUpModal level={levelUpData} onClose={() => setLevelUpData(null)} />
      )}
      {xpFloat && (
        <XPFloat amount={xpFloat} onDone={() => setXpFloat(null)} />
      )}
      {showPlanner && character && (
        <WeeklyPlannerModal
          character={character}
          activeQuests={quests}
          onClose={() => setShowPlanner(false)}
          onPlanCreated={(updatedCharacter) => {
            updateCharacter(updatedCharacter)
            refresh()
            setShowPlanner(false)
          }}
        />
      )}

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 32px 0", display: "flex", flexDirection: "column", gap: "20px" }}>

        <NotificationBanner questsCount={quests.length} />

        {/* Card do personagem */}
        <div style={{ ...card, position: "relative", overflow: "hidden" }}>
          <div style={{
            position: "absolute", top: 0, right: 0,
            width: "200px", height: "200px", borderRadius: "50%",
            backgroundColor: "rgba(124,58,237,0.06)",
            transform: "translate(50%, -50%)", pointerEvents: "none",
          }} />
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
            <div>
              <p style={{ color: "#A78BFA", fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "6px" }}>
                {CLASS_LABELS[character.class] ?? character.class}
              </p>
              <h2 style={{ color: "white", fontSize: "28px", fontWeight: 700, lineHeight: 1 }}>
                {character.name}
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "#64748B", fontSize: "11px", marginBottom: "4px" }}>Nível</p>
              <p style={{ color: "white", fontSize: "56px", fontWeight: 800, lineHeight: 1 }}>
                {character.level}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#64748B", fontSize: "12px" }}>Experiência</span>
            <span style={{ color: "#94A3B8", fontSize: "12px" }}>{character.xp} / {character.xpToNextLevel} XP</span>
          </div>
          <div style={{ width: "100%", height: "10px", backgroundColor: "#1F2937", borderRadius: "99px", overflow: "hidden" }}>
            <div className="xp-bar" style={{ height: "100%", borderRadius: "99px", width: `${xpPercent}%` }} />
          </div>
          <p style={{ textAlign: "right", color: "#475569", fontSize: "11px", marginTop: "6px" }}>{xpPercent}%</p>
        </div>

        {/* Botão do Planejador Semanal */}
        <button
          onClick={() => setShowPlanner(true)}
          style={{
            width: "100%", padding: "14px",
            backgroundColor: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: "14px", color: "#A78BFA",
            fontSize: "14px", fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: "8px",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = "rgba(124,58,237,0.15)"
            e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = "rgba(124,58,237,0.08)"
            e.currentTarget.style.borderColor = "rgba(124,58,237,0.25)"
          }}
        >
          📋 Planejador Semanal
        </button>

        {/* Atributos */}
        <div style={card}>
          <p style={{ color: "#64748B", fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "20px" }}>
            Atributos
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {ATTRIBUTE_CONFIG.map(({ key, label, color }) => {
              const value = character.attributes[key as keyof typeof character.attributes] ?? 0
              const pct = Math.min((value / maxAttr) * 100, 100)
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "#CBD5E1", fontSize: "14px" }}>{label}</span>
                    <span style={{ color: "white", fontSize: "14px", fontWeight: 600 }}>{value}</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", backgroundColor: "#1F2937", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: "99px", backgroundColor: color, width: `${pct}%`, transition: "width 0.7s ease" }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quests */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <p style={{ color: "#64748B", fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Quests ativas
            </p>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                color: "#A78BFA", fontSize: "12px", padding: "6px 14px",
                borderRadius: "8px", border: "1px solid rgba(124,58,237,0.35)",
                backgroundColor: "transparent", cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#7C3AED"
                e.currentTarget.style.color = "white"
                e.currentTarget.style.backgroundColor = "rgba(124,58,237,0.1)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(124,58,237,0.35)"
                e.currentTarget.style.color = "#A78BFA"
                e.currentTarget.style.backgroundColor = "transparent"
              }}
            >
              {showForm ? "Cancelar" : "+ Nova quest"}
            </button>
          </div>

          {showForm && (
            <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #1F2937" }}>
              <QuestForm onSubmit={handleCreateQuest} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {questsLoading ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p style={{ color: "#475569", fontSize: "13px" }}>Carregando quests...</p>
            </div>
          ) : quests.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", border: "1px dashed #1F2937", borderRadius: "12px" }}>
              <p style={{ color: "#64748B", fontSize: "14px", marginBottom: "6px" }}>Nenhuma quest ativa</p>
              <p style={{ color: "#475569", fontSize: "12px" }}>Crie sua primeira missão acima</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {quests.map(quest => (
                <QuestCard
                  key={quest.$id}
                  quest={quest}
                  onComplete={handleCompleteQuest}
                  onArchive={archiveQuest}
                  isCompleting={completingId === quest.$id}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}