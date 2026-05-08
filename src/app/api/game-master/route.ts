import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

async function callWithRetry(ai: GoogleGenAI, prompt: string, attempts = 3): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
      })
      return response.text ?? ""
    } catch (error: unknown) {
      const isRetryable = error instanceof Error &&
        (error.message.includes("503") || error.message.includes("UNAVAILABLE"))

      if (isRetryable && i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        continue
      }
      throw error
    }
  }
  return ""
}

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    if (!message || !context) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

    const prompt = `Você é o Game Master do sistema Solo Leveling de ${context.characterName}.
Seu papel é ser um guia sombrio, motivador e inteligente.

DADOS DO PERSONAGEM:
- Nome: ${context.characterName} | Classe: ${context.characterClass} | Nível: ${context.level}
- XP: ${context.xp}/${context.xpToNextLevel}
- Atributos: Força ${context.attributes.strength}, Disciplina ${context.attributes.discipline}, Foco ${context.attributes.focus}, Saúde ${context.attributes.health}, Criatividade ${context.attributes.creativity}

QUESTS ATIVAS: ${context.activeQuests.length > 0
      ? context.activeQuests.map((q: { title: string; difficulty: string }) =>
          `"${q.title}" (${q.difficulty})`).join(", ")
      : "Nenhuma"
    }

QUESTS CONCLUÍDAS: ${context.completedQuests.length}

CONQUISTAS: ${context.achievements.length > 0
      ? context.achievements.map((a: { title: string }) => a.title).join(", ")
      : "Nenhuma ainda"
    }

Responda em português brasileiro, seja direto e motivador, máximo 3 parágrafos curtos.

Pergunta do caçador: ${message}`

    const text = await callWithRetry(ai, prompt)

    return NextResponse.json({ response: text })

  } catch (error) {
    console.error("Erro no Game Master:", error)
    return NextResponse.json(
      { error: "Erro ao processar mensagem" },
      { status: 500 }
    )
  }
}