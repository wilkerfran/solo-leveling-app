"use client"

import { useState } from "react"
import { Character, Quest, Achievement } from "@/types"

export type PlannerPhase = "greeting" | "deepening" | "summary" | "creating" | "done"

export interface PlannerMessage {
  role: "user" | "assistant"
  content: string
}

export interface WeeklyPlan {
  quests: Array<{
    title: string
    description: string
    category: string
    difficulty: "easy" | "medium" | "hard" | "legendary"
    isRecurring: boolean
    recurringType?: "daily" | "weekly"
  }>
  customAchievements: Array<{
    title: string
    description: string
    goal: string
  }>
}

interface PlannerContext {
  characterName: string
  characterClass: string
  level: number
  attributes: Character["attributes"]
}

export function useWeeklyPlanner() {
  const [messages, setMessages] = useState<PlannerMessage[]>([])
  const [phase, setPhase] = useState<PlannerPhase>("greeting")
  const [isLoading, setIsLoading] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<WeeklyPlan | null>(null)

  async function sendMessage(content: string, context: PlannerContext) {
    const userMessage: PlannerMessage = { role: "user", content }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      const response = await fetch("/api/weekly-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          context,
          phase,
        }),
      })

      const data = await response.json()

      const assistantMessage: PlannerMessage = {
        role: "assistant",
        content: data.response,
      }

      setMessages(prev => [...prev, assistantMessage])

      // Se a IA retornou um plano, avança para summary
      if (data.plan) {
        setPendingPlan(data.plan)
        setPhase("summary")
      }

    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "O sistema encontrou uma anomalia. Tente novamente.",
      }])
    } finally {
      setIsLoading(false)
    }
  }

  async function startPlanning(context: PlannerContext) {
    setMessages([])
    setPhase("greeting")
    setPendingPlan(null)
    setIsLoading(true)

    try {
      const response = await fetch("/api/weekly-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          context,
          phase: "greeting",
        }),
      })

      const data = await response.json()
      setMessages([{ role: "assistant", content: data.response }])
    } catch {
      setMessages([{
        role: "assistant",
        content: "Caçador, o sistema de planejamento está disponível. Qual é sua missão desta semana?",
      }])
    } finally {
      setIsLoading(false)
    }
  }

  function advancePhase() {
    const phases: PlannerPhase[] = ["greeting", "deepening", "summary", "creating", "done"]
    const current = phases.indexOf(phase)
    if (current < phases.length - 1) {
      setPhase(phases[current + 1])
    }
  }

  function reset() {
    setMessages([])
    setPhase("greeting")
    setPendingPlan(null)
  }

  return {
    messages,
    phase,
    isLoading,
    pendingPlan,
    sendMessage,
    startPlanning,
    advancePhase,
    reset,
  }
}