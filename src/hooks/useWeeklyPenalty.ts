"use client"

import { useEffect, useState } from "react"
import { penaltyService } from "@/services/penalty.service"
import { Character, Quest } from "@/types"

export function useWeeklyPenalty(
  character: Character | null,
  activeQuests: Quest[]
) {
  const [shouldShowPlanner, setShouldShowPlanner] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!character || checked) return

    const now = new Date()
    const isMonday = now.getDay() === 1
    const hour = now.getHours()
    const isMorningTime = hour >= 6 && hour <= 12

    if (isMonday && isMorningTime) {
      // Só considera quests criadas ANTES desta semana
      const thisWeekStart = getThisWeekStart()
      const oldQuests = activeQuests.filter(q => {
        const createdAt = new Date(q.createdAt)
        return createdAt < thisWeekStart
      })

      if (oldQuests.length > 0) {
        penaltyService.hasProcessedThisWeek(character.$id).then(hasProcessed => {
          if (!hasProcessed) {
            setShouldShowPlanner(true)
            if (Notification.permission === "granted") {
              new Notification("⚠️ Julgamento Semanal", {
                body: `${oldQuests.length} quest(s) não concluída(s). Penalidades pendentes.`,
                icon: "/icons/icon-sl.png",
              })
            }
          }
        })
      }
    }

    queueMicrotask(() => setChecked(true))
  }, [character, activeQuests, checked])

  return { shouldShowPlanner, setShouldShowPlanner }
}

function getThisWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}