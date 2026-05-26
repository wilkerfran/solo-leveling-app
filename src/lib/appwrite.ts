import { Client, Account, Databases, Storage } from "appwrite"

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)

export const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
export const COLLECTIONS = {
  CHARACTERS: process.env.NEXT_PUBLIC_APPWRITE_CHARACTERS_COLLECTION_ID!,
  QUESTS: process.env.NEXT_PUBLIC_APPWRITE_QUESTS_COLLECTION_ID!,
  XP_EVENTS: process.env.NEXT_PUBLIC_APPWRITE_XP_EVENTS_COLLECTION_ID!,
  ACHIEVEMENTS: process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID!,
  PENALTY_EVENTS: process.env.NEXT_PUBLIC_APPWRITE_PENALTY_EVENTS_COLLECTION_ID!,
  EVENTS: process.env.NEXT_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID!,
}