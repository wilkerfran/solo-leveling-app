import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite"
import { ID } from "appwrite"
import { Character, Quest } from "@/types"
import { calculateLevelUp } from "@/lib/xp"
import { characterService } from "./character.service"

export const xpService = {
  // Processa o ganho de XP ao completar uma quest
  async processQuestCompletion(
    character: Character,
    quest: Quest
  ): Promise<{ updatedCharacter: Character; didLevelUp: boolean }> {
    const totalXP = character.xp + quest.xpReward
    const { newLevel, remainingXP, didLevelUp } = calculateLevelUp(
      totalXP,
      character.level
    )

    // Calcula novos atributos
    const newAttributes = { ...character.attributes }
    Object.entries(quest.attributeRewards).forEach(([attr, value]) => {
      const key = attr as keyof typeof newAttributes
      if (key in newAttributes) {
        newAttributes[key] = (newAttributes[key] ?? 0) + (value ?? 0)
      }
    })

    // Atualiza o personagem no banco
    const updatedCharacter = await characterService.update(character.$id, {
      xp: remainingXP,
      level: newLevel,
      xpToNextLevel: Math.floor(100 * Math.pow(newLevel, 1.5)),
      attributes: newAttributes,
    })

    // Registra o evento de XP
    await databases.createDocument(
      DB_ID,
      COLLECTIONS.XP_EVENTS,
      ID.unique(),
      {
        characterId: character.$id,
        questId: quest.$id,
        xpGained: quest.xpReward,
        levelBefore: character.level,
        levelAfter: newLevel,
      }
    )

    return { updatedCharacter, didLevelUp }
  },
}