import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite"
import { ID, Query } from "appwrite"
import { CalendarEvent } from "@/types"

export const eventService = {
  async listByCharacterAndWeek(
    characterId: string,
    weekStart: string,
    weekEnd: string
  ): Promise<CalendarEvent[]> {
    const response = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.EVENTS,
      [
        Query.equal("characterId", characterId),
        Query.greaterThanEqual("date", weekStart),
        Query.lessThanEqual("date", weekEnd),
        Query.orderAsc("date"),
      ]
    )
    return response.documents as unknown as CalendarEvent[]
  },

  async listRecurring(characterId: string): Promise<CalendarEvent[]> {
    const response = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.EVENTS,
      [
        Query.equal("characterId", characterId),
        Query.equal("isRecurring", true),
      ]
    )
    return response.documents as unknown as CalendarEvent[]
  },

  async create(
    characterId: string,
    data: {
      title: string
      description?: string
      date: string
      time: string
      duration: number
      color?: string
      isRecurring: boolean
      recurringDays?: number[]
    }
  ): Promise<CalendarEvent> {
    const doc = await databases.createDocument(
      DB_ID,
      COLLECTIONS.EVENTS,
      ID.unique(),
      {
        characterId,
        title: data.title,
        description: data.description ?? "",
        date: data.date,
        time: data.time,
        duration: data.duration,
        color: data.color ?? "#7C3AED",
        isRecurring: data.isRecurring,
        recurringDays: data.recurringDays
          ? JSON.stringify(data.recurringDays)
          : null,
      }
    )
    return doc as unknown as CalendarEvent
  },

  async update(
    eventId: string,
    data: Partial<{
      title: string
      description: string
      date: string
      time: string
      duration: number
      color: string
    }>
  ): Promise<CalendarEvent> {
    const doc = await databases.updateDocument(
      DB_ID,
      COLLECTIONS.EVENTS,
      eventId,
      data
    )
    return doc as unknown as CalendarEvent
  },

  async delete(eventId: string): Promise<void> {
    await databases.deleteDocument(DB_ID, COLLECTIONS.EVENTS, eventId)
  },
}