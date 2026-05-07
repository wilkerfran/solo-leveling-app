// Representa o personagem do usuário
export interface Character {
  $id: string
  userId: string
  name: string
  class: string
  level: number
  xp: number
  xpToNextLevel: number
  attributes: {
    strength: number
    discipline: number
    focus: number
    health: number
    creativity: number
  }
  avatarUrl?: string
  createdAt: string
}

// Representa uma quest/tarefa
export interface Quest {
  $id: string
  characterId: string
  title: string
  description?: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  xpReward: number
  attributeRewards: Partial<Character['attributes']>
  status: 'active' | 'completed' | 'failed' | 'archived'
  isRecurring: boolean
  recurringType?: 'daily' | 'weekly'
  dueDate?: string
  completedAt?: string
  createdAt: string
}

// Representa um evento de ganho de XP
export interface XPEvent {
  $id: string
  characterId: string
  questId: string
  xpGained: number
  levelBefore: number
  levelAfter: number
  createdAt: string
}

// Constantes de XP por dificuldade
export const XP_REWARDS = {
  easy: 25,
  medium: 75,
  hard: 150,
  legendary: 300,
} as const