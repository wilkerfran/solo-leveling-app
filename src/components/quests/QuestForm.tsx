"use client"

import { useState } from "react"
import { Quest } from "@/types"

const CATEGORIES = [
  { id: "saude", label: "Saúde" },
  { id: "exercicio", label: "Exercício" },
  { id: "estudos", label: "Estudos" },
  { id: "carreira", label: "Carreira" },
  { id: "habito", label: "Hábito" },
  { id: "criativo", label: "Criativo" },
  { id: "outro", label: "Outro" },
]

const DIFFICULTIES = [
  { id: "easy", label: "Fácil", xp: "25 XP", color: "text-green-400 border-green-800 bg-green-950/50" },
  { id: "medium", label: "Médio", xp: "75 XP", color: "text-yellow-400 border-yellow-800 bg-yellow-950/50" },
  { id: "hard", label: "Difícil", xp: "150 XP", color: "text-orange-400 border-orange-800 bg-orange-950/50" },
  { id: "legendary", label: "Lendário", xp: "300 XP", color: "text-purple-400 border-purple-800 bg-purple-950/50" },
]

interface QuestFormProps {
  onSubmit: (data: {
    title: string
    description?: string
    category: string
    difficulty: Quest["difficulty"]
    isRecurring: boolean
    recurringType?: Quest["recurringType"]
  }) => Promise<void>
  onCancel: () => void
}

export function QuestForm({ onSubmit, onCancel }: QuestFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("outro")
  const [difficulty, setDifficulty] = useState<Quest["difficulty"]>("medium")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringType, setRecurringType] = useState<"daily" | "weekly">("daily")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError("Digite um título para a quest"); return }

    setIsLoading(true)
    setError("")
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        difficulty,
        isRecurring,
        recurringType: isRecurring ? recurringType : undefined,
      })
    } catch {
      setError("Erro ao criar quest. Tente novamente.")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm text-slate-300 mb-1.5">Título da quest</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ex: Fazer 30 minutos de exercício"
          autoFocus
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1.5">Descrição (opcional)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Detalhes sobre essa quest..."
          rows={2}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-2">Categoria</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                category === cat.id
                  ? "border-violet-500 bg-violet-950 text-violet-300"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-2">Dificuldade</label>
        <div className="grid grid-cols-2 gap-2">
          {DIFFICULTIES.map(diff => (
            <button
              key={diff.id}
              type="button"
              onClick={() => setDifficulty(diff.id as Quest["difficulty"])}
              className={`px-3 py-2 rounded-lg text-sm border transition-all text-left ${
                difficulty === diff.id
                  ? diff.color
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              <span className="font-medium">{diff.label}</span>
              <span className="text-xs ml-2 opacity-70">{diff.xp}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsRecurring(!isRecurring)}
          className={`w-10 h-6 rounded-full transition-colors relative ${
            isRecurring ? "bg-violet-600" : "bg-slate-700"
          }`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
            isRecurring ? "left-5" : "left-1"
          }`} />
        </button>
        <span className="text-sm text-slate-300">Quest recorrente</span>
        {isRecurring && (
          <select
            value={recurringType}
            onChange={e => setRecurringType(e.target.value as "daily" | "weekly")}
            className="ml-auto bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-sm text-white focus:outline-none"
          >
            <option value="daily">Diária</option>
            <option value="weekly">Semanal</option>
          </select>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium transition-colors text-sm"
        >
          {isLoading ? "Criando..." : "Criar quest"}
        </button>
      </div>
    </form>
  )
}