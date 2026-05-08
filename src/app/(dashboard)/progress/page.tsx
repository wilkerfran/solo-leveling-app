"use client"

import { useAuth } from "@/hooks/useAuth"
import { useCharacter } from "@/hooks/useCharacter"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { questService } from "@/services/quest.service"
import { xpService } from "@/services/xp.service"
import { Quest, XPEvent } from "@/types"
import { XPChart } from "@/components/character/XPChart"
import { QuestHistory } from "@/components/quests/QuestHistory"
import { penaltyService } from "@/services/penalty.service"
import { PenaltyEvent } from "@/types"

export default function ProgressPage() {
  const [penaltyEvents, setPenaltyEvents] = useState<PenaltyEvent[]>([])
  const { user, isLoading: authLoading } = useAuth()
  const { character, isLoading: charLoading } = useCharacter(user?.$id)
  const router = useRouter()

  const [completedQuests, setCompletedQuests] = useState<Quest[]>([])
  const [xpEvents, setXpEvents] = useState<XPEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authLoading || charLoading) return
    if (!user) { router.push("/login"); return }
    if (!character) return

    Promise.all([
  questService.listCompleted(character.$id),
  xpService.listEvents(character.$id),
  penaltyService.listByCharacter(character.$id),
]).then(([quests, events, penalties]) => {
  setCompletedQuests(quests)
  setXpEvents(events)
  setPenaltyEvents(penalties)
  setIsLoading(false)
})
  }, [user, character, authLoading, charLoading, router])

  if (authLoading || charLoading || !character) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#080B14" }}>
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  const totalXP = xpEvents.reduce((sum, e) => sum + e.xpGained, 0)
  const totalQuests = completedQuests.length
  const legendaryCount = completedQuests.filter(q => q.difficulty === "legendary").length

  const card: React.CSSProperties = {
    backgroundColor: "#111827",
    border: "1px solid #1F2937",
    borderRadius: "16px",
    padding: "24px",
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#080B14", paddingBottom: "20px" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 32px 0", display: "flex", flexDirection: "column", gap: "20px" }}>

        <h1 style={{ color: "white", fontSize: "20px", fontWeight: 700 }}>Progresso</h1>

        {/* Stats rápidos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          {[
            { label: "XP total", value: totalXP, color: "#A78BFA" },
            { label: "Quests", value: totalQuests, color: "#22C55E" },
            { label: "Lendárias", value: legendaryCount, color: "#F59E0B" },
          ].map(stat => (
            <div key={stat.label} style={{ ...card, textAlign: "center", padding: "16px" }}>
              <p style={{ color: stat.color, fontSize: "24px", fontWeight: 800, lineHeight: 1 }}>
                {stat.value}
              </p>
              <p style={{ color: "#64748B", fontSize: "11px", marginTop: "6px" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Gráfico de XP */}
        <div style={card}>
          <p style={{ color: "#64748B", fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "20px" }}>
            Evolução de XP
          </p>
          <XPChart events={xpEvents} />
        </div>

        {/* Histórico */}
        <div style={card}>
          <p style={{ color: "#64748B", fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "20px" }}>
            Histórico de quests
          </p>
          <QuestHistory quests={completedQuests} isLoading={isLoading} />
          {/* Histórico de penalidades */}
{penaltyEvents.length > 0 && (
  <div style={card}>
    <p style={{ color: "#64748B", fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "20px" }}>
      Penalidades aplicadas
    </p>
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {penaltyEvents.map(penalty => (
        <div key={penalty.$id} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px",
          backgroundColor: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.15)",
          borderRadius: "10px",
        }}>
          <div>
            <p style={{ color: "#CBD5E1", fontSize: "13px", fontWeight: 500 }}>
              {penalty.questTitle}
            </p>
            <p style={{ color: "#475569", fontSize: "11px", marginTop: "2px" }}>
              Semana de {penalty.weekOf}
            </p>
          </div>
          <span style={{
            color: "#EF4444", fontSize: "13px", fontWeight: 700,
            backgroundColor: "rgba(239,68,68,0.1)",
            padding: "4px 10px", borderRadius: "6px",
          }}>
            -{penalty.xpLost} XP
          </span>
        </div>
      ))}
    </div>
  </div>
)}
        </div>

      </div>
    </main>
  )
}