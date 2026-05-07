"use client"

import { useAuth } from "@/hooks/useAuth"
import { useCharacter } from "@/hooks/useCharacter"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { achievementService } from "@/services/achievement.service"
import { Achievement, FIXED_ACHIEVEMENTS } from "@/types"
import { AchievementCard } from "@/components/character/AchievementCard"
import Link from "next/link"

export default function AchievementsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { character, isLoading: charLoading } = useCharacter(user?.$id)
  const router = useRouter()

  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newGoal, setNewGoal] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (authLoading || charLoading) return
    if (!user) { router.push("/login"); return }
    if (!character) return

    achievementService.listByCharacter(character.$id).then(data => {
      setAchievements(data)
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

  const unlockedIds = achievements.filter(a => a.isCompleted).map(a => a.achievementId)
  const customAchievements = achievements.filter(a => a.isCustom)
  const fixedAchievements = achievements.filter(a => !a.isCustom)

  // Conquistas fixas ainda não desbloqueadas
  const lockedFixed = FIXED_ACHIEVEMENTS.filter(f => !unlockedIds.includes(f.id))

  async function handleCreateCustom(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || !character) return
    setIsCreating(true)
    try {
      const achievement = await achievementService.createCustom(
        character.$id,
        newTitle.trim(),
        newDesc.trim(),
        newGoal.trim()
      )
      setAchievements(prev => [achievement, ...prev])
      setNewTitle("")
      setNewDesc("")
      setNewGoal("")
      setShowForm(false)
    } finally {
      setIsCreating(false)
    }
  }

  async function handleComplete(achievementId: string) {
    const updated = await achievementService.completeCustom(achievementId)
    setAchievements(prev => prev.map(a => a.$id === achievementId ? updated : a))
  }

  async function handleDelete(achievementId: string) {
    await achievementService.delete(achievementId)
    setAchievements(prev => prev.filter(a => a.$id !== achievementId))
  }

  const card: React.CSSProperties = {
    backgroundColor: "#111827",
    border: "1px solid #1F2937",
    borderRadius: "16px",
    padding: "24px",
  }

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
            <span style={{ color: "white", fontWeight: 700, fontSize: "15px" }}>Conquistas</span>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              color: "#A78BFA", fontSize: "12px",
              padding: "6px 14px", borderRadius: "8px",
              border: "1px solid rgba(124,58,237,0.35)",
              backgroundColor: "transparent", cursor: "pointer",
            }}
          >
            {showForm ? "Cancelar" : "+ Meta pessoal"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "32px 32px 0", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ ...card, textAlign: "center", padding: "20px" }}>
            <p style={{ color: "#A78BFA", fontSize: "28px", fontWeight: 800 }}>
              {unlockedIds.length}
            </p>
            <p style={{ color: "#64748B", fontSize: "12px", marginTop: "4px" }}>Desbloqueadas</p>
          </div>
          <div style={{ ...card, textAlign: "center", padding: "20px" }}>
            <p style={{ color: "#F59E0B", fontSize: "28px", fontWeight: 800 }}>
              {FIXED_ACHIEVEMENTS.length + customAchievements.length}
            </p>
            <p style={{ color: "#64748B", fontSize: "12px", marginTop: "4px" }}>Total disponível</p>
          </div>
        </div>

        {/* Formulário nova meta */}
        {showForm && (
          <div style={card}>
            <p style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>
              Nova meta pessoal
            </p>
            <form onSubmit={handleCreateCustom} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Título da meta"
                required
                style={{
                  backgroundColor: "#0D1117", border: "1px solid #1F2937",
                  borderRadius: "8px", padding: "10px 14px",
                  color: "white", fontSize: "14px", outline: "none",
                }}
              />
              <input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Descrição (opcional)"
                style={{
                  backgroundColor: "#0D1117", border: "1px solid #1F2937",
                  borderRadius: "8px", padding: "10px 14px",
                  color: "white", fontSize: "14px", outline: "none",
                }}
              />
              <input
                value={newGoal}
                onChange={e => setNewGoal(e.target.value)}
                placeholder="Como saber que atingiu? Ex: Correr 5km sem parar"
                style={{
                  backgroundColor: "#0D1117", border: "1px solid #1F2937",
                  borderRadius: "8px", padding: "10px 14px",
                  color: "white", fontSize: "14px", outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={isCreating}
                style={{
                  backgroundColor: "#7C3AED", color: "white",
                  padding: "10px", borderRadius: "8px",
                  border: "none", cursor: "pointer",
                  fontSize: "14px", fontWeight: 600,
                  opacity: isCreating ? 0.5 : 1,
                }}
              >
                {isCreating ? "Criando..." : "Criar meta"}
              </button>
            </form>
          </div>
        )}

        {/* Metas pessoais */}
        {customAchievements.length > 0 && (
          <div style={card}>
            <p style={{ color: "#64748B", fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px" }}>
              Metas pessoais
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {customAchievements.map(a => (
                <AchievementCard
                  key={a.$id}
                  achievement={a}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {/* Conquistas desbloqueadas */}
        {fixedAchievements.length > 0 && (
          <div style={card}>
            <p style={{ color: "#64748B", fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px" }}>
              Conquistas desbloqueadas
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {fixedAchievements.map(a => (
                <AchievementCard key={a.$id} achievement={a} />
              ))}
            </div>
          </div>
        )}

        {/* Conquistas bloqueadas */}
        {lockedFixed.length > 0 && (
          <div style={card}>
            <p style={{ color: "#64748B", fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px" }}>
              Em progresso
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {lockedFixed.map(f => (
                <AchievementCard
                  key={f.id}
                  achievement={{
                    $id: f.id,
                    $createdAt: "",
                    characterId: character.$id,
                    achievementId: f.id,
                    title: f.title,
                    description: f.description,
                    type: "fixed",
                    unlockedAt: "",
                    isCustom: false,
                    isCompleted: false,
                  }}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}