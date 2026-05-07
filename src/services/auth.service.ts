import { account } from "@/lib/appwrite"
import { ID } from "appwrite"

// Wrapper que garante timeout em qualquer promise
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), ms)
  )
  return Promise.race([promise, timeout])
}

export const authService = {
  async register(email: string, password: string, name: string) {
    const user = await account.create(ID.unique(), email, password, name)
    await this.login(email, password)
    return user
  },

  async login(email: string, password: string) {
    return account.createEmailPasswordSession(email, password)
  },

  async logout() {
    return account.deleteSession("current")
  },

  async getCurrentUser() {
    try {
      // Timeout de 4 segundos — se o Appwrite não responder, retorna null
      return await withTimeout(account.get(), 4000)
    } catch {
      return null
    }
  },
}