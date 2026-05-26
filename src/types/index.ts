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

// Representa uma quest/tarefa — definição única e completa
export interface Quest {
  $id: string
  $createdAt: string
  characterId: string
  title: string
  description?: string
  category: string
  difficulty: "easy" | "medium" | "hard" | "legendary"
  xpReward: number
  attributeRewards: Partial<Character["attributes"]>
  status: "active" | "completed" | "failed" | "archived"
  isRecurring: boolean
  recurringType?: "daily" | "weekly" | "specificDays" | "monthly"
  recurringDays?: string        // JSON: [1,3,5] = seg,qua,sex
  recurringFrequency?: number   // dia do mês para mensal
  dueDate?: string
  completedAt?: string
  lastCompletedAt?: string
  nextResetAt?: string
  scheduledDate?: string
  scheduledTime?: string
  duration?: number
  createdAt: string
}

// Representa um evento de ganho de XP
export interface XPEvent {
  $id: string
  $createdAt: string
  characterId: string
  questId: string
  xpGained: number
  levelBefore: number
  levelAfter: number
}

// Constantes de XP por dificuldade
export const XP_REWARDS = {
  easy: 25,
  medium: 75,
  hard: 150,
  legendary: 300,
} as const

export interface Achievement {
  $id: string
  $createdAt: string
  characterId: string
  achievementId: string
  title: string
  description: string
  type: "fixed" | "custom"
  unlockedAt: string
  isCustom: boolean
  goal?: string
  isCompleted: boolean
}

type AchievementStats = {
  level: number
  questsCompleted: number
  legendaryCompleted: number
  totalXP: number
  streak: number
}

export const FIXED_ACHIEVEMENTS = [
  {
    id: "first_quest",
    title: "Primeira Missão",
    description: "Complete sua primeira quest",
    check: (stats: AchievementStats) => stats.questsCompleted >= 1,
  },
  {
    id: "ten_quests",
    title: "Caçador Dedicado",
    description: "Complete 10 quests",
    check: (stats: AchievementStats) => stats.questsCompleted >= 10,
  },
  {
    id: "level_5",
    title: "Ascensão",
    description: "Alcance o nível 5",
    check: (stats: AchievementStats) => stats.level >= 5,
  },
  {
    id: "level_10",
    title: "Caçador de Elite",
    description: "Alcance o nível 10",
    check: (stats: AchievementStats) => stats.level >= 10,
  },
  {
    id: "legendary_quest",
    title: "Lenda",
    description: "Complete uma quest lendária",
    check: (stats: AchievementStats) => stats.legendaryCompleted >= 1,
  },
  {
    id: "xp_1000",
    title: "Mil Experiências",
    description: "Acumule 1000 XP no total",
    check: (stats: AchievementStats) => stats.totalXP >= 1000,
  },
  {
    id: "streak_7",
    title: "Semana Perfeita",
    description: "Complete quests por 7 dias seguidos",
    check: (stats: AchievementStats) => stats.streak >= 7,
  },
] as const

export interface PenaltyEvent {
  $id: string
  $createdAt: string
  characterId: string
  questId: string
  questTitle: string
  xpLost: number
  attributePenalties: string
  reason: string
  weekOf: string
}

export const PENALTY_AMOUNTS = {
  easy:      { xp: 10,  attributes: 1 },
  medium:    { xp: 30,  attributes: 2 },
  hard:      { xp: 75,  attributes: 3 },
  legendary: { xp: 150, attributes: 5 },
} as const

export interface CalendarEvent {
  $id: string
  $createdAt: string
  characterId: string
  title: string
  description?: string
  date: string
  time: string
  duration: number
  color?: string
  isRecurring: boolean
  recurringDays?: string
}

export interface CalendarItem {
  id: string
  type: "quest" | "event"
  title: string
  description?: string
  date: string
  time?: string
  duration?: number
  color?: string
  difficulty?: Quest["difficulty"]
  xpReward?: number
  isCompleted?: boolean
  isRecurring?: boolean
  recurringType?: string
  raw: Quest | CalendarEvent
}