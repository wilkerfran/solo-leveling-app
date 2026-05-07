"use client"

import { useState } from "react"
import { Character, Quest, Achievement } from "@/types"

export interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface GameMasterContext {
  characterName: string
  characterClass: string
  level: number
  xp: number
  xpToNextLevel: number
  attributes: Character["attributes"]
  activeQuests: Quest[]
  completedQuests: Quest[]
  achievements: Achievement[]
}

export function useGameMaster() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  async function sendMessage(content: string, context: GameMasterContext) {
    // Adiciona mensagem do usuário imediatamente
    const userMessage: Message = {
      role: "user",
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch("/api/game-master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, context }),
      })

      if (!response.ok) throw new Error("Erro na API")

      const data = await response.json()

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      const errorMessage: Message = {
        role: "assistant",
        content: "O sistema encontrou uma anomalia. Tente novamente, caçador.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  function clearMessages() {
    setMessages([])
  }

  return { messages, isLoading, sendMessage, clearMessages }
}