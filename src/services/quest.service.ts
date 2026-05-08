import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite"
import { ID, Query } from "appwrite"
import { Quest, XP_REWARDS } from "@/types"

export const questService = {
  async listByCharacter(characterId: string): Promise<Quest[]> {
    const response = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.QUESTS,
      [
        Query.equal("characterId", characterId),
        Query.equal("status", "active"),
        Query.orderDesc("$createdAt"),
      ]
    )
    return response.documents.map(doc => ({
      ...doc,
      attributeRewards: JSON.parse(doc.attributeRewards),
    })) as unknown as Quest[]
  },

  async listCompleted(characterId: string): Promise<Quest[]> {
    const response = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.QUESTS,
      [
        Query.equal("characterId", characterId),
        Query.equal("status", "completed"),
        Query.orderDesc("$updatedAt"),
        Query.limit(50),
      ]
    )
    return response.documents.map(doc => ({
      ...doc,
      attributeRewards: JSON.parse(doc.attributeRewards),
    })) as unknown as Quest[]
  },

  async create(
    characterId: string,
    data: {
      title: string
      description?: string
      category: string
      difficulty: Quest["difficulty"]
      isRecurring: boolean
      recurringType?: Quest["recurringType"]
      dueDate?: string
    }
  ): Promise<Quest> {
    const xpReward = XP_REWARDS[data.difficulty]
    const attributeRewards = getCategoryAttributes(data.category, data.difficulty)

    const doc = await databases.createDocument(
      DB_ID,
      COLLECTIONS.QUESTS,
      ID.unique(),
      {
        characterId,
        title: data.title,
        description: data.description ?? "",
        category: data.category,
        difficulty: data.difficulty,
        xpReward,
        attributeRewards: JSON.stringify(attributeRewards),
        status: "active",
        isRecurring: data.isRecurring,
        recurringType: data.recurringType ?? null,
        dueDate: data.dueDate ?? null,
        completedAt: null,
        lastCompletedAt: null,
        nextResetAt: null,
      }
    )

    return {
      ...doc,
      attributeRewards,
    } as unknown as Quest
  },

  async complete(questId: string): Promise<Quest> {
    const now = new Date()

    // Busca a quest atual para verificar se é recorrente
    const doc = await databases.getDocument(DB_ID, COLLECTIONS.QUESTS, questId)
    const quest = {
      ...doc,
      attributeRewards: JSON.parse(doc.attributeRewards),
    } as unknown as Quest

    // Calcula o próximo reset baseado no tipo de recorrência
    let nextResetAt: string | null = null
    let newStatus: string = "completed"

    if (quest.isRecurring && quest.recurringType) {
      nextResetAt = calculateNextReset(quest.recurringType)
      // Quests recorrentes ficam como "completed" mas têm nextResetAt definido
      newStatus = "completed"
    }

    const updated = await databases.updateDocument(
      DB_ID,
      COLLECTIONS.QUESTS,
      questId,
      {
        status: newStatus,
        completedAt: now.toISOString(),
        lastCompletedAt: now.toISOString(),
        nextResetAt,
      }
    )

    return {
      ...updated,
      attributeRewards: JSON.parse(updated.attributeRewards),
    } as unknown as Quest
  },

  // Verifica e reseta quests recorrentes que já passaram do nextResetAt
  async resetRecurringQuests(characterId: string): Promise<number> {
    const now = new Date()

    // Busca quests completadas com nextResetAt no passado
    const response = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.QUESTS,
      [
        Query.equal("characterId", characterId),
        Query.equal("status", "completed"),
        Query.isNotNull("nextResetAt"),
      ]
    )

    let resetCount = 0

    for (const doc of response.documents) {
      const nextReset = doc.nextResetAt ? new Date(doc.nextResetAt) : null
      if (nextReset && nextReset <= now) {
        // Calcula o próximo reset baseado no tipo
        const quest = doc as unknown as Quest
        const newNextReset = quest.recurringType
          ? calculateNextReset(quest.recurringType)
          : null

        await databases.updateDocument(
          DB_ID,
          COLLECTIONS.QUESTS,
          doc.$id,
          {
            status: "active",
            completedAt: null,
            nextResetAt: newNextReset,
          }
        )
        resetCount++
      }
    }

    return resetCount
  },

  async archive(questId: string): Promise<void> {
    await databases.updateDocument(
      DB_ID,
      COLLECTIONS.QUESTS,
      questId,
      { status: "archived" }
    )
  },
}

function calculateNextReset(recurringType: "daily" | "weekly"): string {
  const now = new Date()

  if (recurringType === "daily") {
    // Próximo reset à meia-noite do dia seguinte
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow.toISOString()
  } else {
    // Próximo reset na segunda-feira da próxima semana
    const nextMonday = new Date(now)
    const day = nextMonday.getDay()
    const daysUntilMonday = day === 0 ? 1 : 8 - day
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday)
    nextMonday.setHours(0, 0, 0, 0)
    return nextMonday.toISOString()
  }
}

function getCategoryAttributes(
  category: string,
  difficulty: Quest["difficulty"]
): Partial<Record<string, number>> {
  const bonus = difficulty === "easy" ? 1
    : difficulty === "medium" ? 2
    : difficulty === "hard" ? 3
    : 5

  const map: Record<string, Partial<Record<string, number>>> = {
    saude:     { health: bonus, strength: Math.floor(bonus / 2) },
    estudos:   { focus: bonus, creativity: Math.floor(bonus / 2) },
    carreira:  { discipline: bonus, focus: Math.floor(bonus / 2) },
    exercicio: { strength: bonus, health: Math.floor(bonus / 2) },
    habito:    { discipline: bonus },
    criativo:  { creativity: bonus, focus: Math.floor(bonus / 2) },
    outro:     { discipline: bonus },
  }

  return map[category] ?? { discipline: bonus }
}