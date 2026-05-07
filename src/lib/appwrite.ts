import { Client, Account, Databases, Storage } from "appwrite"

// Criamos um único cliente e reusamos em toda a aplicação
// Isso evita criar múltiplas conexões desnecessárias
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

// Exportamos os serviços que vamos usar
// Account = autenticação (login, registro, sessão)
// Databases = CRUD de documentos
// Storage = upload de arquivos (avatar mais tarde)
export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)

// IDs centralizados — se mudar no Appwrite, muda só aqui
export const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
export const COLLECTIONS = {
  CHARACTERS: process.env.NEXT_PUBLIC_APPWRITE_CHARACTERS_COLLECTION_ID!,
  QUESTS: process.env.NEXT_PUBLIC_APPWRITE_QUESTS_COLLECTION_ID!,
  XP_EVENTS: process.env.NEXT_PUBLIC_APPWRITE_XP_EVENTS_COLLECTION_ID!,
  ACHIEVEMENTS: process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID!,
}