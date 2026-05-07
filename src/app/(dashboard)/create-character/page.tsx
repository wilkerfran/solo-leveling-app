"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useCharacter } from "@/hooks/useCharacter"
import { useRouter } from "next/navigation"

// As classes disponíveis com descrição e ícone em texto
const CHARACTER_CLASSES = [
  {
    id: "warrior",
    name: "Guerreiro",
    description: "Força e disciplina acima de tudo. Focado em desafios físicos.",
    focus: "Força + Disciplina",
  },
  {
    id: "sage",
    name: "Sábio",
    description: "A mente é a arma mais poderosa. Domina estudos e criatividade.",
    focus: "Foco + Criatividade",
  },
  {
    id: "hunter",
    name: "Caçador",
    description: "Equilibrado e adaptável. Evolui em múltiplas áreas da vida.",
    focus: "Todos os atributos",
  },
]

export default function CreateCharacterPage() {
  const { user } = useAuth()
  const { createCharacter } = useCharacter(user?.$id)
  const router = useRouter()

  const [name, setName] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState<"name" | "class">("name")

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) {
      setError("O nome deve ter pelo menos 2 caracteres")
      return
    }
    setError("")
    setStep("class")
  }

  async function handleClassSelect(classId: string) {
    setSelectedClass(classId)
    setIsLoading(true)
    setError("")

    try {
      await createCharacter(name.trim(), classId)
      router.push("/dashboard")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar personagem"
      setError(msg)
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">

        {step === "name" && (
          <div>
            <div className="mb-8 text-center">
              <p className="text-violet-400 text-sm font-medium mb-2 uppercase tracking-widest">
                Novo Caçador
              </p>
              <h1 className="text-3xl font-bold text-white mb-2">
                Como seu personagem se chama?
              </h1>
              <p className="text-slate-400 text-sm">
                Esse será o nome do seu alter ego nessa jornada
              </p>
            </div>

            <form onSubmit={handleNameSubmit}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome do seu personagem..."
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white text-lg placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-center"
              />

              {error && (
                <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
              )}

              <button
                type="submit"
                className="w-full mt-4 bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-xl transition-colors"
              >
                Continuar
              </button>
            </form>
          </div>
        )}

        {step === "class" && (
          <div>
            <div className="mb-8 text-center">
              <p className="text-violet-400 text-sm font-medium mb-2 uppercase tracking-widest">
                {name}
              </p>
              <h1 className="text-3xl font-bold text-white mb-2">
                Escolha sua classe
              </h1>
              <p className="text-slate-400 text-sm">
                Isso define seu estilo de evolução inicial
              </p>
            </div>

            <div className="space-y-3">
              {CHARACTER_CLASSES.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => handleClassSelect(cls.id)}
                  disabled={isLoading}
                  className={`w-full text-left p-5 rounded-xl border transition-all disabled:opacity-50 ${
                    selectedClass === cls.id
                      ? "border-violet-500 bg-violet-950"
                      : "border-slate-700 bg-slate-900 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-semibold text-lg">{cls.name}</p>
                      <p className="text-slate-400 text-sm mt-1">{cls.description}</p>
                    </div>
                    <span className="text-xs text-violet-400 bg-violet-950 border border-violet-800 px-2 py-1 rounded-lg ml-3 shrink-0">
                      {cls.focus}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
            )}

            {isLoading && (
              <p className="text-violet-400 text-sm mt-4 text-center animate-pulse">
                Invocando seu personagem...
              </p>
            )}

            <button
              onClick={() => setStep("name")}
              disabled={isLoading}
              className="w-full mt-4 text-slate-400 hover:text-white text-sm transition-colors disabled:opacity-50"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </main>
  )
}