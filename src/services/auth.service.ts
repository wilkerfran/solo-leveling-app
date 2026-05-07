import { account } from "@/lib/appwrite"
import { ID } from "appwrite"

export const authService = {
  // Registra um novo usuário
  async register(email: string, password: string, name: string) {
    // ID.unique() gera um ID aleatório — o Appwrite exige isso
    const user = await account.create(ID.unique(), email, password, name)
    // Após registrar, já fazemos login automaticamente
    await this.login(email, password)
    return user
  },

  // Faz login e cria uma sessão
  async login(email: string, password: string) {
    return account.createEmailPasswordSession(email, password)
  },

  // Faz logout e destroi a sessão atual
  async logout() {
    return account.deleteSession("current")
  },

  // Retorna o usuário da sessão atual (null se não estiver logado)
  async getCurrentUser() {
    try {
      return await account.get()
    } catch {
      // O Appwrite lança erro se não há sessão — tratamos retornando null
      return null
    }
  },
}