import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite"
import { ID, Query } from "appwrite"
import { Quest, XP_REWARDS } from "@/types"

export const questService = {
  // Busca todas as quests ativas do personagem
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

  // Cria uma nova quest
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
    // Calcula recompensas baseado na dificuldade
    const xpReward = XP_REWARDS[data.difficulty]

    // Atributos que crescem dependem da categoria
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
      }
    )

    return {
      ...doc,
      attributeRewards,
    } as unknown as Quest
  },

  // Marca a quest como concluída
  async complete(questId: string): Promise<Quest> {
    const doc = await databases.updateDocument(
      DB_ID,
      COLLECTIONS.QUESTS,
      questId,
      {
        status: "completed",
        completedAt: new Date().toISOString(),
      }
    )
    return {
      ...doc,
      attributeRewards: JSON.parse(doc.attributeRewards),
    } as unknown as Quest
  },

  // Arquiva uma quest sem completar
  async archive(questId: string): Promise<void> {
    await databases.updateDocument(
      DB_ID,
      COLLECTIONS.QUESTS,
      questId,
      { status: "archived" }
    )
  },

  // Busca quests concluídas para o histórico
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
}



// Mapeia categoria para quais atributos crescem
function getCategoryAttributes(
  category: string,
  difficulty: Quest["difficulty"]
): Partial<Record<string, number>> {
  const bonus = difficulty === "easy" ? 1
    : difficulty === "medium" ? 2
    : difficulty === "hard" ? 3
    : 5 // legendary

  const map: Record<string, Partial<Record<string, number>>> = {
    saude:      { health: bonus, strength: Math.floor(bonus / 2) },
    estudos:    { focus: bonus, creativity: Math.floor(bonus / 2) },
    carreira:   { discipline: bonus, focus: Math.floor(bonus / 2) },
    exercicio:  { strength: bonus, health: Math.floor(bonus / 2) },
    habito:     { discipline: bonus },
    criativo:   { creativity: bonus, focus: Math.floor(bonus / 2) },
    outro:      { discipline: bonus },
  }

  return map[category] ?? { discipline: bonus }
}