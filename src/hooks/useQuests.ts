"use client"

import { useState, useEffect } from "react"
import { questService } from "@/services/quest.service"
import { xpService } from "@/services/xp.service"
import { Quest, Character } from "@/types"

export function useQuests(characterId: string | undefined) {
  const [quests, setQuests] = useState<Quest[]>([])
  const [isLoading, setIsLoading] = useState(!!characterId)

  useEffect(() => {
    if (!characterId) return

    questService.listByCharacter(characterId).then((data) => {
      setQuests(data)
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [characterId])

  async function createQuest(
    data: Parameters<typeof questService.create>[1]
  ) {
    if (!characterId) return
    const newQuest = await questService.create(characterId, data)
    setQuests(prev => [newQuest, ...prev])
    return newQuest
  }

  async function completeQuest(quest: Quest, character: Character) {
    // Atualiza status da quest
    await questService.complete(quest.$id)

    // Remove da lista de ativas
    setQuests(prev => prev.filter(q => q.$id !== quest.$id))

    // Processa XP e retorna personagem atualizado
    const result = await xpService.processQuestCompletion(character, quest)
    return result
  }

  async function archiveQuest(questId: string) {
    await questService.archive(questId)
    setQuests(prev => prev.filter(q => q.$id !== questId))
  }

  return { quests, isLoading, createQuest, completeQuest, archiveQuest }
}