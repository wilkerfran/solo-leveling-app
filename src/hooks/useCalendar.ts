"use client"

import { useState, useEffect } from "react"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns"
import { questService } from "@/services/quest.service"
import { eventService } from "@/services/event.service"
import { Quest, CalendarEvent, CalendarItem } from "@/types"

export function useCalendar(characterId: string | undefined) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [scheduledQuests, setScheduledQuests] = useState<Quest[]>([])
  const [recurringQuests, setRecurringQuests] = useState<Quest[]>([])
  const [unscheduledQuests, setUnscheduledQuests] = useState<Quest[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [recurringEvents, setRecurringEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  )
  const [refreshTick, setRefreshTick] = useState(0)

  const weekStart = format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "yyyy-MM-dd")
  const weekEnd = format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "yyyy-MM-dd")

  function loadData(cId: string, wStart: string, wEnd: string) {
    questService.resetRecurringQuests(cId)
      .catch(err => console.warn("Reset recorrentes:", err))
      .finally(() => {
        Promise.all([
          questService.listByWeek(cId, wStart, wEnd),
          questService.listByCharacter(cId),
          questService.listRecurring(cId),
          eventService.listByCharacterAndWeek(cId, wStart, wEnd),
          eventService.listRecurring(cId),
        ])
          .then(([scheduled, allActive, recurring, weekEvents, recurringEvts]) => {
            setScheduledQuests(scheduled)
            setRecurringQuests(recurring)
            setUnscheduledQuests(
              allActive.filter(q => !q.scheduledDate)
            )
            setEvents(weekEvents)
            setRecurringEvents(recurringEvts)
            setIsLoading(false)
          })
          .catch(() => setIsLoading(false))
      })
  }

  useEffect(() => {
    if (!characterId) return
    loadData(characterId, weekStart, weekEnd)
  }, [characterId, weekStart, weekEnd, refreshTick])

  function refresh() {
    setRefreshTick(t => t + 1)
  }

  function getItemsForDay(date: string): CalendarItem[] {
    const items: CalendarItem[] = []
    const dayOfWeek = new Date(date + "T12:00:00").getDay()
    const dayOfMonth = new Date(date + "T12:00:00").getDate()
    const addedIds = new Set<string>()

    // Quests agendadas neste dia específico (não recorrentes)
    scheduledQuests
      .filter(q => q.scheduledDate === date && !q.isRecurring)
      .forEach(q => {
        addedIds.add(q.$id)
        items.push({
          id: q.$id,
          type: "quest",
          title: q.title,
          description: q.description,
          date: q.scheduledDate!,
          time: q.scheduledTime,
          duration: q.duration,
          difficulty: q.difficulty,
          xpReward: q.xpReward,
          isCompleted: q.status === "completed",
          isRecurring: false,
          recurringType: q.recurringType,
          raw: q,
        })
      })

    // Quests recorrentes — aparecem nos dias configurados
    recurringQuests.forEach(q => {
      if (addedIds.has(q.$id)) return

      let shouldShow = false

      switch (q.recurringType) {
        case "daily":
          shouldShow = true
          break

        case "specificDays": {
          if (!q.recurringDays) break
          try {
            const days = JSON.parse(q.recurringDays) as number[]
            shouldShow = days.includes(dayOfWeek)
          } catch { shouldShow = false }
          break
        }

        case "weekly": {
          if (q.scheduledDate) {
            const scheduledDow = new Date(q.scheduledDate + "T12:00:00").getDay()
            shouldShow = dayOfWeek === scheduledDow
          }
          break
        }

        case "monthly": {
          if (q.scheduledDate) {
            const scheduledDom = new Date(q.scheduledDate + "T12:00:00").getDate()
            shouldShow = dayOfMonth === scheduledDom
          }
          break
        }
      }

      if (shouldShow) {
        // Converte completedAt UTC para data local antes de comparar
        const completedToday = q.status === "completed" &&
          q.completedAt &&
          new Date(q.completedAt).toLocaleDateString("en-CA") === date

        items.push({
          id: `${q.$id}-${date}`,
          type: "quest",
          title: q.title,
          description: q.description,
          date,
          time: q.scheduledTime,
          duration: q.duration,
          difficulty: q.difficulty,
          xpReward: q.xpReward,
          isCompleted: !!completedToday,
          isRecurring: true,
          recurringType: q.recurringType,
          raw: q,
        })
      }
    })

    // Eventos do dia
    events
      .filter(e => e.date === date)
      .forEach(e => items.push({
        id: e.$id,
        type: "event",
        title: e.title,
        description: e.description,
        date: e.date,
        time: e.time,
        duration: e.duration,
        color: e.color,
        isRecurring: e.isRecurring,
        raw: e,
      }))

    // Eventos recorrentes
    recurringEvents
      .filter(e => {
        if (!e.recurringDays) return false
        try {
          const days = JSON.parse(e.recurringDays) as number[]
          return days.includes(dayOfWeek)
        } catch { return false }
      })
      .forEach(e => items.push({
        id: `${e.$id}-${date}`,
        type: "event",
        title: e.title,
        description: e.description,
        date,
        time: e.time,
        duration: e.duration,
        color: e.color,
        isRecurring: true,
        raw: e,
      }))

    return items.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))
  }

  function goToNextWeek() { setCurrentWeek(prev => addWeeks(prev, 1)) }
  function goToPrevWeek() { setCurrentWeek(prev => subWeeks(prev, 1)) }
  function goToToday() {
    setCurrentWeek(new Date())
    setSelectedDay(format(new Date(), "yyyy-MM-dd"))
  }

  async function scheduleQuest(questId: string, date: string, time: string, duration: number) {
    await questService.schedule(questId, date, time, duration)
    refresh()
  }

  async function unscheduleQuest(questId: string) {
    await questService.unschedule(questId)
    refresh()
  }

  async function createEvent(data: Parameters<typeof eventService.create>[1]) {
    if (!characterId) return
    await eventService.create(characterId, data)
    refresh()
  }

  async function updateEvent(eventId: string, data: Parameters<typeof eventService.update>[1]) {
    await eventService.update(eventId, data)
    refresh()
  }

  async function deleteEvent(eventId: string) {
    await eventService.delete(eventId)
    refresh()
  }

  async function moveItem(item: CalendarItem, newDate: string, newTime: string) {
    if (item.type === "quest") {
      await questService.schedule(item.id, newDate, newTime, item.duration ?? 60)
    } else {
      await eventService.update(item.id, { date: newDate, time: newTime })
    }
    refresh()
  }

  return {
    currentWeek, weekStart, weekEnd, selectedDay, setSelectedDay,
    scheduledQuests, recurringQuests, unscheduledQuests, events, recurringEvents, isLoading,
    getItemsForDay, goToNextWeek, goToPrevWeek, goToToday,
    scheduleQuest, unscheduleQuest, createEvent, updateEvent, deleteEvent, moveItem,
    refresh,
  }
}