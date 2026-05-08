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

    if (isMonday && isMorningTime && activeQuests.length > 0) {
      penaltyService.hasProcessedThisWeek(character.$id).then(hasProcessed => {
        if (!hasProcessed) {
          setShouldShowPlanner(true)
          if (Notification.permission === "granted") {
            new Notification("⚠️ Julgamento Semanal", {
              body: `${activeQuests.length} quest(s) não concluída(s). Penalidades pendentes.`,
              icon: "/icons/icon-sl.png",
            })
          }
        }
      })
    }

    queueMicrotask(() => setChecked(true))
  }, [character, activeQuests, checked])

  return { shouldShowPlanner, setShouldShowPlanner }
}