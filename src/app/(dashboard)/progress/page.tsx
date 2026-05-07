"use client"

import { useAuth } from "@/hooks/useAuth"
import { useCharacter } from "@/hooks/useCharacter"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { questService } from "@/services/quest.service"
import { xpService } from "@/services/xp.service"
import { Quest } from "@/types"
import { XPEvent } from "@/types"
import { XPChart } from "@/components/character/XPChart"
import { QuestHistory } from "@/components/quests/QuestHistory"
import Link from "next/link"

export default function ProgressPage() {
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
    ]).then(([quests, events]) => {
      setCompletedQuests(quests)
      setXpEvents(events)
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
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

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#080B14", paddingBottom: "60px" }}>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        backgroundColor: "rgba(13,17,23,0.92)",
        borderBottom: "1px solid #1F2937",
        backdropFilter: "blur(8px)",
      }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 32px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/dashboard" style={{ color: "#64748B", fontSize: "14px", textDecoration: "none" }}>
              ← Voltar
            </Link>
            <span style={{ color: "white", fontWeight: 700, fontSize: "15px" }}>
              Progresso
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "32px 32px 0", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Stats rápidos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          {[
            { label: "XP total", value: totalXP, color: "#A78BFA" },
            { label: "Quests", value: totalQuests, color: "#22C55E" },
            { label: "Lendárias", value: legendaryCount, color: "#F59E0B" },
          ].map(stat => (
            <div key={stat.label} style={{
              backgroundColor: "#111827",
              border: "1px solid #1F2937",
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
            }}>
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
        <div style={{
          backgroundColor: "#111827",
          border: "1px solid #1F2937",
          borderRadius: "16px",
          padding: "24px",
        }}>
          <p style={{ color: "#64748B", fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "20px" }}>
            Evolução de XP
          </p>
          <XPChart events={xpEvents} />
        </div>

        {/* Histórico */}
        <div style={{
          backgroundColor: "#111827",
          border: "1px solid #1F2937",
          borderRadius: "16px",
          padding: "24px",
        }}>
          <p style={{ color: "#64748B", fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "20px" }}>
            Histórico de quests
          </p>
          <QuestHistory quests={completedQuests} isLoading={isLoading} />
        </div>

      </div>
    </main>
  )
}