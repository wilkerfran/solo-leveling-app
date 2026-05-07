// Calcula o XP necessário para ir do level atual para o próximo
export function xpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}

// Verifica se o personagem deve subir de nível e retorna o novo estado
export function calculateLevelUp(currentXP: number, currentLevel: number) {
  let level = currentLevel
  let xp = currentXP

  // Loop porque pode subir mais de um nível de uma vez
  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level)
    level += 1
  }

  return {
    newLevel: level,
    remainingXP: xp,
    didLevelUp: level > currentLevel,
  }
}