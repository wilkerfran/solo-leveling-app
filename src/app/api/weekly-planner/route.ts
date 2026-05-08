import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

export async function POST(request: NextRequest) {
  try {
    const { messages, context, phase } = await request.json()

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

    const systemPrompt = `Você é o Sistema de Planejamento Semanal do Solo Leveling para ${context.characterName}.
Seu papel é conduzir uma conversa guiada para criar o plano da semana do caçador.

DADOS DO PERSONAGEM:
- Nome: ${context.characterName} | Classe: ${context.characterClass} | Nível: ${context.level}
- Atributos: Força ${context.attributes.strength}, Disciplina ${context.attributes.discipline}, Foco ${context.attributes.focus}, Saúde ${context.attributes.health}, Criatividade ${context.attributes.creativity}

FASE ATUAL: ${phase}

REGRAS DE COMUNICAÇÃO:
- Mensagens narrativas: tom RPG Solo Leveling, sombrio e motivador
- Perguntas práticas: direto e claro
- Máximo 2 perguntas por mensagem
- Nunca invente dados

FASES DO PLANEJAMENTO:
1. GREETING — Dê boas vindas e peça o contexto geral da semana
2. DEEPENING — Faça perguntas específicas sobre cada categoria mencionada
3. SUMMARY — Monte o plano completo e mostre para aprovação
4. CREATING — Confirme que está criando e retorne JSON estruturado

QUANDO ESTIVER NA FASE SUMMARY, retorne exatamente neste formato JSON no final da mensagem:
===PLAN_JSON===
{
  "quests": [
    {
      "title": "string",
      "description": "string",
      "category": "saude|exercicio|estudos|carreira|habito|criativo|outro",
      "difficulty": "easy|medium|hard|legendary",
      "isRecurring": boolean,
      "recurringType": "daily|weekly|null"
    }
  ],
  "customAchievements": [
    {
      "title": "string",
      "description": "string",
      "goal": "string"
    }
  ]
}
===END_PLAN===`

    // Monta histórico da conversa
    const conversationHistory = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }))

    const fullPrompt = `${systemPrompt}\n\nConversa até agora:\n${
      conversationHistory.map((m: { role: string; parts: { text: string }[] }) =>
        `${m.role === "user" ? "Caçador" : "Sistema"}: ${m.parts[0].text}`
      ).join("\n")
    }\n\nSistema:`

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: fullPrompt,
    })

    const text = response.text ?? ""

    // Extrai o JSON do plano se existir
    let plan = null
    const planMatch = text.match(/===PLAN_JSON===\n([\s\S]*?)\n===END_PLAN===/)
    if (planMatch) {
      try {
        plan = JSON.parse(planMatch[1])
      } catch {
        plan = null
      }
    }

    // Remove o JSON da mensagem exibida
    const cleanText = text.replace(/===PLAN_JSON===[\s\S]*?===END_PLAN===/g, "").trim()

    return NextResponse.json({ response: cleanText, plan })

  } catch (error) {
    console.error("Erro no planejador:", error)
    return NextResponse.json({ error: "Erro ao processar planejamento" }, { status: 500 })
  }
}