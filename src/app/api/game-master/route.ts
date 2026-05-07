import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    if (!message || !context) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("GEMINI_API_KEY não configurada no .env.local")
      return NextResponse.json(
        { error: "Chave da API não configurada no servidor" },
        { status: 500 }
      )
    }

    const ai = new GoogleGenAI({ apiKey })
    const modelName = "gemini-flash-latest"

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

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    })

    // Extração correta: a propriedade 'text' já é a string da resposta
    let replyText = response.text
    if (!replyText) {
      // Fallback para caso a estrutura seja diferente
      if (response.candidates?.[0]?.content?.parts) {
        replyText = response.candidates[0].content.parts.map(part => part.text).join(" ")
      } else {
        replyText = "Não foi possível gerar uma resposta."
      }
    }

    return NextResponse.json({ response: replyText })

  } catch (error: unknown) {
    console.error("Erro no Game Master:", error)

    // Type guard para verificar se é um erro com status e message
    const isApiError = (err: unknown): err is { status: number; message: string } => {
      return typeof err === "object" && err !== null && "status" in err && "message" in err
    }

    if (isApiError(error) && error.status === 400 && 
        (error.message.includes("API key") || error.message.includes("expired"))) {
      return NextResponse.json(
        { error: "Chave da API inválida ou expirada. Verifique sua GEMINI_API_KEY." },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Erro ao processar mensagem com a IA" },
      { status: 500 }
    )
  }
}