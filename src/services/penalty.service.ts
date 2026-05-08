import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite"
import { ID, Query } from "appwrite"
import { Character, Quest, PenaltyEvent, PENALTY_AMOUNTS } from "@/types"
import { characterService } from "./character.service"

export const penaltyService = {
  // Aplica penalidade por quest não concluída
  async applyPenalty(
    character: Character,
    quest: Quest,
    weekOf: string
  ): Promise<{ updatedCharacter: Character; penalty: PenaltyEvent }> {
    const penaltyConfig = PENALTY_AMOUNTS[quest.difficulty]

    // Calcula novo XP — mínimo 0
    const newXP = Math.max(0, character.xp - penaltyConfig.xp)

    // Calcula penalidade nos atributos baseado na categoria da quest
    const attributePenalties = calculateAttributePenalties(
      quest.category,
      penaltyConfig.attributes
    )

    // Aplica penalidade nos atributos — mínimo 1 em cada
    const newAttributes = { ...character.attributes }
    Object.entries(attributePenalties).forEach(([attr, penalty]) => {
      const key = attr as keyof typeof newAttributes
      if (key in newAttributes) {
        newAttributes[key] = Math.max(1, (newAttributes[key] ?? 1) - (penalty ?? 0))
      }
    })

    // Atualiza personagem
    const updatedCharacter = await characterService.update(character.$id, {
      xp: newXP,
      attributes: newAttributes,
    })

    // Registra o evento de penalidade
    const doc = await databases.createDocument(
      DB_ID,
      COLLECTIONS.PENALTY_EVENTS,
      ID.unique(),
      {
        characterId: character.$id,
        questId: quest.$id,
        questTitle: quest.title,
        xpLost: penaltyConfig.xp,
        attributePenalties: JSON.stringify(attributePenalties),
        reason: `Quest "${quest.title}" não concluída na semana de ${weekOf}`,
        weekOf,
      }
    )

    return {
      updatedCharacter,
      penalty: doc as unknown as PenaltyEvent,
    }
  },

  // Busca histórico de penalidades
  async listByCharacter(characterId: string): Promise<PenaltyEvent[]> {
    const response = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.PENALTY_EVENTS,
      [
        Query.equal("characterId", characterId),
        Query.orderDesc("$createdAt"),
        Query.limit(50),
      ]
    )
    return response.documents as unknown as PenaltyEvent[]
  },

  // Verifica e processa quests não concluídas da semana anterior
  async processWeeklyPenalties(
    character: Character,
    activeQuests: Quest[]
  ): Promise<{
    penaltiesApplied: number
    totalXPLost: number
    updatedCharacter: Character
    failedQuests: Quest[]
  }> {
    if (activeQuests.length === 0) {
      return {
        penaltiesApplied: 0,
        totalXPLost: 0,
        updatedCharacter: character,
        failedQuests: [],
      }
    }

    const weekOf = getLastMondayDate()
    let currentCharacter = character
    let totalXPLost = 0
    const failedQuests: Quest[] = []

    for (const quest of activeQuests) {
      const { updatedCharacter, penalty } = await this.applyPenalty(
        currentCharacter,
        quest,
        weekOf
      )
      currentCharacter = updatedCharacter
      totalXPLost += penalty.xpLost
      failedQuests.push(quest)

      // Marca quest como failed
      await databases.updateDocument(
        DB_ID,
        COLLECTIONS.QUESTS,
        quest.$id,
        { status: "failed" }
      )
    }

    return {
      penaltiesApplied: failedQuests.length,
      totalXPLost,
      updatedCharacter: currentCharacter,
      failedQuests,
    }
  },

  // Verifica se já processou penalidades essa semana
  async hasProcessedThisWeek(characterId: string): Promise<boolean> {
    const weekOf = getLastMondayDate()
    const response = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.PENALTY_EVENTS,
      [
        Query.equal("characterId", characterId),
        Query.equal("weekOf", weekOf),
        Query.limit(1),
      ]
    )
    return response.documents.length > 0
  },
}

function getLastMondayDate(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().split("T")[0]
}

function calculateAttributePenalties(
  category: string,
  amount: number
): Partial<Record<string, number>> {
  const map: Record<string, Partial<Record<string, number>>> = {
    saude:     { health: amount },
    exercicio: { strength: amount, health: Math.floor(amount / 2) },
    estudos:   { focus: amount, creativity: Math.floor(amount / 2) },
    carreira:  { discipline: amount, focus: Math.floor(amount / 2) },
    habito:    { discipline: amount },
    criativo:  { creativity: amount },
    outro:     { discipline: amount },
  }
  return map[category] ?? { discipline: amount }
}