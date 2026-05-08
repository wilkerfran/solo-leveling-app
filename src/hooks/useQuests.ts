"use client"

import { useState, useEffect, useCallback } from "react"
import { questService } from "@/services/quest.service"
import { xpService } from "@/services/xp.service"
import { Quest, Character } from "@/types"

export function useQuests(characterId: string | undefined) {
  const [quests, setQuests] = useState<Quest[]>([])
  const [isLoading, setIsLoading] = useState(!!characterId)

  const fetchQuests = useCallback(() => {
    if (!characterId) return
    questService.listByCharacter(characterId)
      .then((data) => {
        setQuests(data)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [characterId])

  useEffect(() => {
    if (!characterId) return

    // Primeiro verifica se há quests recorrentes para resetar
    questService.resetRecurringQuests(characterId)
      .then(() => fetchQuests())
      .catch(() => fetchQuests())
  }, [fetchQuests, characterId])

  async function createQuest(
    data: Parameters<typeof questService.create>[1]
  ) {
    if (!characterId) return
    const newQuest = await questService.create(characterId, data)
    setQuests(prev => [newQuest, ...prev])
    return newQuest
  }

  async function completeQuest(quest: Quest, character: Character) {
    await questService.complete(quest.$id)
    setQuests(prev => prev.filter(q => q.$id !== quest.$id))
    const result = await xpService.processQuestCompletion(character, quest)
    return result
  }

  async function archiveQuest(questId: string) {
    await questService.archive(questId)
    setQuests(prev => prev.filter(q => q.$id !== questId))
  }

  return { quests, isLoading, createQuest, completeQuest, archiveQuest, refresh: fetchQuests }
}