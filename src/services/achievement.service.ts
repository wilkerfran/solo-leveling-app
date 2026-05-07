import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite"
import { ID, Query } from "appwrite"
import { Achievement, FIXED_ACHIEVEMENTS } from "@/types"

export const achievementService = {
  async listByCharacter(characterId: string): Promise<Achievement[]> {
    const response = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.ACHIEVEMENTS,
      [Query.equal("characterId", characterId), Query.orderDesc("$createdAt")]
    )
    return response.documents as unknown as Achievement[]
  },

  // Verifica e desbloqueia conquistas fixas automaticamente
async checkAndUnlock(
  characterId: string,
  stats: {
    level: number
    questsCompleted: number
    legendaryCompleted: number
    totalXP: number
    streak: number
  },
  unlockedIds: string[]
): Promise<Achievement[]> {
  const newAchievements: Achievement[] = []

  for (const achievement of FIXED_ACHIEVEMENTS) {
    if (unlockedIds.includes(achievement.id)) continue
    if (!achievement.check(stats)) continue  // removido o 'as any'

    const doc = await databases.createDocument(
      DB_ID,
      COLLECTIONS.ACHIEVEMENTS,
      ID.unique(),
      {
        characterId,
        achievementId: achievement.id,
        title: achievement.title,
        description: achievement.description,
        type: "fixed",
        unlockedAt: new Date().toISOString(),
        isCustom: false,
        isCompleted: true,
      }
    )
    newAchievements.push(doc as unknown as Achievement)
  }

  return newAchievements
},

  // Cria uma meta pessoal
  async createCustom(
    characterId: string,
    title: string,
    description: string,
    goal: string
  ): Promise<Achievement> {
    const doc = await databases.createDocument(
      DB_ID,
      COLLECTIONS.ACHIEVEMENTS,
      ID.unique(),
      {
        characterId,
        achievementId: `custom_${ID.unique()}`,
        title,
        description,
        type: "custom",
        unlockedAt: "",
        isCustom: true,
        goal,
        isCompleted: false,
      }
    )
    return doc as unknown as Achievement
  },

  // Marca uma meta pessoal como concluída
  async completeCustom(achievementId: string): Promise<Achievement> {
    const doc = await databases.updateDocument(
      DB_ID,
      COLLECTIONS.ACHIEVEMENTS,
      achievementId,
      {
        isCompleted: true,
        unlockedAt: new Date().toISOString(),
      }
    )
    return doc as unknown as Achievement
  },

  async delete(achievementId: string): Promise<void> {
    await databases.deleteDocument(DB_ID, COLLECTIONS.ACHIEVEMENTS, achievementId)
  },
}