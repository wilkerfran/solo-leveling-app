import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite"
import { ID, Query } from "appwrite"
import { Quest, XP_REWARDS } from "@/types"

export const questService = {
  async listByCharacter(characterId: string): Promise<Quest[]> {
    const response = await databases.listDocuments(
      DB_ID, COLLECTIONS.QUESTS,
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
      DB_ID, COLLECTIONS.QUESTS,
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

  async listByWeek(
    characterId: string,
    weekStart: string,
    weekEnd: string
  ): Promise<Quest[]> {
    const response = await databases.listDocuments(
      DB_ID, COLLECTIONS.QUESTS,
      [
        Query.equal("characterId", characterId),
        Query.equal("status", "active"),
        Query.greaterThanEqual("scheduledDate", weekStart),
        Query.lessThanEqual("scheduledDate", weekEnd),
      ]
    )
    return response.documents.map(doc => ({
      ...doc,
      attributeRewards: JSON.parse(doc.attributeRewards),
    })) as unknown as Quest[]
  },

  async listRecurring(characterId: string): Promise<Quest[]> {
    const response = await databases.listDocuments(
      DB_ID, COLLECTIONS.QUESTS,
      [
        Query.equal("characterId", characterId),
        Query.equal("isRecurring", true),
        Query.notEqual("status", "archived"),
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
      recurringDays?: number[]
      recurringFrequency?: number
      dueDate?: string
    }
  ): Promise<Quest> {
    const xpReward = XP_REWARDS[data.difficulty]
    const attributeRewards = getCategoryAttributes(data.category, data.difficulty)

    const doc = await databases.createDocument(
      DB_ID, COLLECTIONS.QUESTS, ID.unique(),
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
        recurringDays: data.recurringDays && data.recurringDays.length > 0
          ? JSON.stringify(data.recurringDays)
          : null,
        recurringFrequency: data.recurringFrequency ?? null,
        dueDate: data.dueDate ?? null,
        completedAt: null,
        lastCompletedAt: null,
        nextResetAt: null,
      }
    )
    return { ...doc, attributeRewards } as unknown as Quest
  },

  async update(
    questId: string,
    data: Partial<{
      title: string
      description: string
      difficulty: Quest["difficulty"]
      isRecurring: boolean
      recurringType: Quest["recurringType"]
      recurringDays: number[]
      recurringFrequency: number
      xpReward: number
    }>
  ): Promise<Quest> {
    const updateData: Record<string, unknown> = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.difficulty !== undefined) {
      updateData.difficulty = data.difficulty
      updateData.xpReward = XP_REWARDS[data.difficulty]
    }

    if (data.isRecurring !== undefined) {
      updateData.isRecurring = data.isRecurring
      if (!data.isRecurring) {
        updateData.recurringType = null
        updateData.recurringDays = null
        updateData.recurringFrequency = null
      } else {
        if (data.recurringType !== undefined) {
          updateData.recurringType = data.recurringType
        }
        if (data.recurringDays !== undefined) {
          updateData.recurringDays = data.recurringDays.length > 0
            ? JSON.stringify(data.recurringDays)
            : null
        }
        if (data.recurringFrequency !== undefined) {
          updateData.recurringFrequency = data.recurringFrequency
        }
      }
    }

    const doc = await databases.updateDocument(
      DB_ID, COLLECTIONS.QUESTS, questId, updateData
    )
    return {
      ...doc,
      attributeRewards: JSON.parse(doc.attributeRewards as string),
    } as unknown as Quest
  },

  async delete(questId: string): Promise<void> {
    await databases.deleteDocument(DB_ID, COLLECTIONS.QUESTS, questId)
  },

  async schedule(questId: string, date: string, time: string, duration: number): Promise<Quest> {
    const doc = await databases.updateDocument(
      DB_ID, COLLECTIONS.QUESTS, questId,
      { scheduledDate: date, scheduledTime: time, duration }
    )
    return { ...doc, attributeRewards: JSON.parse(doc.attributeRewards) } as unknown as Quest
  },

  async unschedule(questId: string): Promise<Quest> {
    const doc = await databases.updateDocument(
      DB_ID, COLLECTIONS.QUESTS, questId,
      { scheduledDate: null, scheduledTime: null, duration: null }
    )
    return { ...doc, attributeRewards: JSON.parse(doc.attributeRewards) } as unknown as Quest
  },

  async complete(questId: string): Promise<Quest> {
    const now = new Date()
    const doc = await databases.getDocument(DB_ID, COLLECTIONS.QUESTS, questId)
    const quest = { ...doc, attributeRewards: JSON.parse(doc.attributeRewards) } as unknown as Quest

    let nextResetAt: string | null = null
    if (quest.isRecurring && quest.recurringType) {
      nextResetAt = calculateNextReset(quest)
    }

    const updated = await databases.updateDocument(
      DB_ID, COLLECTIONS.QUESTS, questId,
      {
        status: "completed",
        completedAt: now.toISOString(),
        lastCompletedAt: now.toISOString(),
        nextResetAt,
      }
    )
    return { ...updated, attributeRewards: JSON.parse(updated.attributeRewards) } as unknown as Quest
  },

  async resetRecurringQuests(characterId: string): Promise<number> {
    const now = new Date()
    const todayStr = now.toLocaleDateString("en-CA") // "2026-07-06"

    const response = await databases.listDocuments(
      DB_ID, COLLECTIONS.QUESTS,
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
        try {
          // Não reseta se foi completada hoje — usuário ainda precisa ver como concluída
          const completedAt = doc.completedAt ? new Date(doc.completedAt) : null
          const completedToday = completedAt &&
            completedAt.toLocaleDateString("en-CA") === todayStr

          if (completedToday) {
            continue
          }

          const quest = doc as unknown as Quest
          const newNextReset = quest.isRecurring ? calculateNextReset(quest) : null
          await databases.updateDocument(
            DB_ID, COLLECTIONS.QUESTS, doc.$id,
            { status: "active", completedAt: null, nextResetAt: newNextReset }
          )
          resetCount++
        } catch (err) {
          console.warn("Erro ao resetar quest:", doc.$id, err)
        }
      }
    }
    return resetCount
  },

  async archive(questId: string): Promise<void> {
    await databases.updateDocument(
      DB_ID, COLLECTIONS.QUESTS, questId, { status: "archived" }
    )
  },
}

function calculateNextReset(quest: Quest): string {
  const now = new Date()

  switch (quest.recurringType) {
    case "daily": {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      return tomorrow.toISOString()
    }
    case "specificDays": {
      const days = quest.recurringDays
        ? (JSON.parse(quest.recurringDays) as number[])
        : []
      if (days.length === 0) {
        const next = new Date(now)
        next.setDate(next.getDate() + 7)
        next.setHours(0, 0, 0, 0)
        return next.toISOString()
      }
      const sortedDays = [...days].sort((a, b) => a - b)
      const todayDow = now.getDay()
      const nextDow = sortedDays.find(d => d > todayDow) ?? sortedDays[0]
      const daysUntil = nextDow > todayDow
        ? nextDow - todayDow
        : 7 - todayDow + nextDow
      const next = new Date(now)
      next.setDate(next.getDate() + daysUntil)
      next.setHours(0, 0, 0, 0)
      return next.toISOString()
    }
    case "weekly": {
      const nextMonday = new Date(now)
      const day = nextMonday.getDay()
      const daysUntilMonday = day === 0 ? 1 : 8 - day
      nextMonday.setDate(nextMonday.getDate() + daysUntilMonday)
      nextMonday.setHours(0, 0, 0, 0)
      return nextMonday.toISOString()
    }
    case "monthly": {
      const nextMonth = new Date(now)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      nextMonth.setDate(1)
      nextMonth.setHours(0, 0, 0, 0)
      return nextMonth.toISOString()
    }
    default: {
      const next = new Date(now)
      next.setDate(next.getDate() + 1)
      next.setHours(0, 0, 0, 0)
      return next.toISOString()
    }
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