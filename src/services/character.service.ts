import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite"
import { ID, Query } from "appwrite"
import { Character } from "@/types"
import { xpToNextLevel } from "@/lib/xp"

export const characterService = {
  async getByUserId(userId: string): Promise<Character | null> {
    const response = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.CHARACTERS,
      [Query.equal("userId", userId)]
    )

    if (response.documents.length === 0) return null

    const doc = response.documents[0]
    return {
      ...doc,
      attributes: JSON.parse(doc.attributes),
    } as unknown as Character
  },

  async create(
    userId: string,
    name: string,
    characterClass: string
  ): Promise<Character> {
    const defaultAttributes = {
      strength: 1,
      discipline: 1,
      focus: 1,
      health: 1,
      creativity: 1,
    }

    const doc = await databases.createDocument(
      DB_ID,
      COLLECTIONS.CHARACTERS,
      ID.unique(),
      {
        userId,
        name,
        class: characterClass,
        level: 1,
        xp: 0,
        xpToNextLevel: xpToNextLevel(1),
        attributes: JSON.stringify(defaultAttributes),
      }
    )

    return {
      ...doc,
      attributes: defaultAttributes,
    } as unknown as Character
  },

  async update(
    characterId: string,
    data: Partial<Omit<Character, "$id" | "userId" | "createdAt">>
  ): Promise<Character> {
    const payload = {
      ...data,
      ...(data.attributes && {
        attributes: JSON.stringify(data.attributes),
      }),
    }

    const doc = await databases.updateDocument(
      DB_ID,
      COLLECTIONS.CHARACTERS,
      characterId,
      payload
    )

    return {
      ...doc,
      attributes: JSON.parse(doc.attributes),
    } as unknown as Character
  },
}