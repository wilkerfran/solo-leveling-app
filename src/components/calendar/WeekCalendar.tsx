"use client"

import { useState, useRef, useEffect } from "react"
import { format, addDays, startOfWeek, isToday, parseISO, addDays as add } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarItem, Quest } from "@/types"
import { useCalendar } from "@/hooks/useCalendar"
import { EventModal, EventSaveData } from "./EventModal"
import { ItemModal } from "./ItemModal"

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6)
const HOUR_HEIGHT = 60
const DIFFICULTY_COLORS = {
  easy:      { bg: "rgba(34,197,94,0.15)",  border: "#22C55E", text: "#22C55E" },
  medium:    { bg: "rgba(234,179,8,0.15)",   border: "#EAB308", text: "#EAB308" },
  hard:      { bg: "rgba(249,115,22,0.15)",  border: "#F97316", text: "#F97316" },
  legendary: { bg: "rgba(167,139,250,0.15)", border: "#A78BFA", text: "#A78BFA" },
}

interface WeekCalendarProps {
  characterId: string
  onCompleteQuest: (quest: Quest) => void
  unscheduledQuests: Quest[]
  onQuestScheduled: () => void
}

export function WeekCalendar({ characterId, onCompleteQuest, unscheduledQuests, onQuestScheduled }: WeekCalendarProps) {
  const {
    currentWeek, weekStart, selectedDay, setSelectedDay,
    isLoading, getItemsForDay, goToNextWeek, goToPrevWeek, goToToday,
    scheduleQuest, createEvent, updateEvent, deleteEvent, moveItem, refresh,
  } = useCalendar(characterId)

  const [showEventModal, setShowEventModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
  const [newEventDate, setNewEventDate] = useState("")
  const [newEventTime, setNewEventTime] = useState("")
  const [draggedItem, setDraggedItem] = useState<CalendarItem | null>(null)
  // Remove o useEffect do isMobile e substitui o useState do view por:
const [view, setView] = useState<"week" | "day">(() => {
  if (typeof window !== "undefined" && window.innerWidth < 768) return "day"
  return "week"
})
  const [isMobile, setIsMobile] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const touchStartX = useRef<number>(0)

  // Detecta mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])


  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), i)
    return {
      date: format(day, "yyyy-MM-dd"),
      label: format(day, "EEE", { locale: ptBR }),
      number: format(day, "d"),
      isToday: isToday(day),
    }
  })

  function handleSlotClick(date: string, hour: number) {
    setNewEventDate(date)
    setNewEventTime(`${hour.toString().padStart(2, "0")}:00`)
    setShowEventModal(true)
  }

  function handleItemClick(item: CalendarItem) {
    setSelectedItem(item)
    setShowItemModal(true)
  }

  function handleDragStart(item: CalendarItem) {
    setDraggedItem(item)
  }

  async function handleDrop(date: string, hour: number, e: React.DragEvent) {
    e.preventDefault()
    const newTime = `${hour.toString().padStart(2, "0")}:00`
    const questId = e.dataTransfer.getData("questId")
    const type = e.dataTransfer.getData("type")

    if (questId && type === "unscheduled") {
      await scheduleQuest(questId, date, newTime, 60)
      onQuestScheduled()
      setDraggedItem(null)
      return
    }

    if (!draggedItem) return
    await moveItem(draggedItem, date, newTime)
    setDraggedItem(null)
  }

  // Swipe entre dias no mobile
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) < 50) return

    const currentIndex = weekDays.findIndex(d => d.date === selectedDay)
    if (diff > 0 && currentIndex < 6) {
      // Swipe esquerda — próximo dia
      const next = weekDays[currentIndex + 1]
      if (next) setSelectedDay(next.date)
      else goToNextWeek()
    } else if (diff < 0 && currentIndex > 0) {
      // Swipe direita — dia anterior
      const prev = weekDays[currentIndex - 1]
      if (prev) setSelectedDay(prev.date)
      else goToPrevWeek()
    }
  }

  function getItemTop(time?: string): number {
    if (!time) return 0
    const [h, m] = time.split(":").map(Number)
    return (h - 6) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT
  }

  function getItemHeight(duration?: number): number {
    if (!duration) return HOUR_HEIGHT
    return Math.max((duration / 60) * HOUR_HEIGHT, 30)
  }

  const activeDays = view === "week" ? weekDays : weekDays.filter(d => d.date === selectedDay)

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "0", flex: 1 }}>

      {/* Header */}
      <div style={{
        backgroundColor: "#111827", border: "1px solid #1F2937",
        borderRadius: "16px 16px 0 0", padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={goToPrevWeek} style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer", fontSize: "18px", padding: "4px 8px" }}>‹</button>
          <button onClick={goToToday} style={{ color: "#A78BFA", background: "none", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "8px", cursor: "pointer", fontSize: "12px", padding: "4px 10px" }}>Hoje</button>
          <button onClick={goToNextWeek} style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer", fontSize: "18px", padding: "4px 8px" }}>›</button>
          <span style={{ color: "white", fontSize: "13px", fontWeight: 600 }}>
            {format(parseISO(weekStart), isMobile ? "MMM yyyy" : "MMMM yyyy", { locale: ptBR })}
          </span>
        </div>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {!isMobile && (["week", "day"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "5px 12px", borderRadius: "8px", fontSize: "12px", cursor: "pointer",
              backgroundColor: view === v ? "rgba(124,58,237,0.2)" : "transparent",
              border: `1px solid ${view === v ? "rgba(124,58,237,0.4)" : "#1F2937"}`,
              color: view === v ? "#A78BFA" : "#64748B",
            }}>
              {v === "week" ? "Semana" : "Dia"}
            </button>
          ))}
          {isMobile && (
            <button
              onClick={() => setShowDrawer(true)}
              style={{
                padding: "6px 12px", borderRadius: "8px", fontSize: "12px", cursor: "pointer",
                backgroundColor: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.3)",
                color: "#A78BFA", display: "flex", alignItems: "center", gap: "4px",
              }}
            >
              ☰ {unscheduledQuests.length > 0 && (
                <span style={{
                  backgroundColor: "#7C3AED", color: "white",
                  borderRadius: "99px", fontSize: "10px",
                  padding: "1px 5px", minWidth: "16px", textAlign: "center",
                }}>
                  {unscheduledQuests.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Dias da semana */}
      <div style={{
        backgroundColor: "#0D1117",
        borderLeft: "1px solid #1F2937", borderRight: "1px solid #1F2937",
        display: "grid",
        gridTemplateColumns: view === "week"
          ? `48px repeat(7, 1fr)`
          : `48px 1fr`,
        flexShrink: 0,
      }}>
        <div style={{ borderRight: "1px solid #1F2937" }} />
        {activeDays.map(day => (
          <button key={day.date} onClick={() => { setSelectedDay(day.date); setView("day") }} style={{
            padding: isMobile ? "8px 2px" : "10px 4px", textAlign: "center",
            backgroundColor: day.date === selectedDay ? "rgba(124,58,237,0.1)" : "transparent",
            borderLeft: "1px solid #1F2937", border: "none", cursor: "pointer",
            borderBottom: `2px solid ${day.isToday ? "#7C3AED" : "transparent"}`,
          }}>
            <p style={{ color: "#64748B", fontSize: "9px", textTransform: "uppercase", marginBottom: "3px" }}>{day.label}</p>
            <p style={{ color: day.isToday ? "#A78BFA" : "white", fontSize: isMobile ? "14px" : "16px", fontWeight: day.isToday ? 700 : 400 }}>{day.number}</p>
          </button>
        ))}
      </div>

      {/* Grid de horários */}
      <div
        style={{
          flex: 1, overflowY: "auto", backgroundColor: "#080B14",
          border: "1px solid #1F2937", borderTop: "none", borderRadius: "0 0 16px 16px", position: "relative",
        }}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        <div style={{
          display: "grid",
          gridTemplateColumns: view === "week" ? `48px repeat(7, 1fr)` : `48px 1fr`,
          position: "relative",
        }}>
          <div>
            {HOURS.map(hour => (
              <div key={hour} style={{
                height: `${HOUR_HEIGHT}px`, borderBottom: "1px solid #1F2937",
                display: "flex", alignItems: "flex-start", paddingTop: "4px",
                paddingRight: "8px", justifyContent: "flex-end",
              }}>
                <span style={{ color: "#374151", fontSize: "10px" }}>{hour.toString().padStart(2, "0")}h</span>
              </div>
            ))}
          </div>

          {activeDays.map(day => {
            const items = getItemsForDay(day.date)
            const scheduledItems = items.filter(i => i.time)
            return (
              <div key={day.date} style={{ position: "relative", borderLeft: "1px solid #1F2937" }}>
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    style={{ height: `${HOUR_HEIGHT}px`, borderBottom: "1px solid #1F2937", cursor: "pointer" }}
                    onClick={() => handleSlotClick(day.date, hour)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(day.date, hour, e)}
                  />
                ))}
                {scheduledItems.map(item => {
                  const top = getItemTop(item.time)
                  const height = getItemHeight(item.duration)
                  const isQuest = item.type === "quest"
                  const diffStyle = isQuest && item.difficulty
                    ? DIFFICULTY_COLORS[item.difficulty]
                    : { bg: item.color ? `${item.color}25` : "rgba(124,58,237,0.15)", border: item.color ?? "#7C3AED", text: item.color ?? "#A78BFA" }
                  return (
                    <div
                      key={item.id}
                      draggable={!isMobile}
                      onDragStart={() => handleDragStart(item)}
                      onClick={e => { e.stopPropagation(); handleItemClick(item) }}
                      style={{
                        position: "absolute", top: `${top}px`, left: "2px", right: "2px",
                        height: `${height}px`, backgroundColor: diffStyle.bg,
                        borderLeft: `3px solid ${diffStyle.border}`, borderRadius: "4px",
                        padding: "3px 6px", cursor: "pointer", zIndex: 10, overflow: "hidden",
                        userSelect: "none",
                      }}
                    >
                      <p style={{ color: diffStyle.text, fontSize: "10px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.time} {item.title}
                      </p>
                      {height > 40 && item.xpReward && (
                        <p style={{ color: "#475569", fontSize: "9px" }}>+{item.xpReward} XP</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Gaveta mobile de quests não agendadas */}
      {isMobile && (
        <>
          {/* Overlay */}
          {showDrawer && (
            <div
              onClick={() => setShowDrawer(false)}
              style={{
                position: "fixed", inset: 0, zIndex: 90,
                backgroundColor: "rgba(0,0,0,0.5)",
              }}
            />
          )}

          {/* Gaveta */}
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            zIndex: 95,
            backgroundColor: "#0D1117",
            border: "1px solid #1F2937",
            borderRadius: "20px 20px 0 0",
            padding: "0 0 max(16px, env(safe-area-inset-bottom))",
            transform: showDrawer ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.3s ease",
            maxHeight: "70vh",
            display: "flex", flexDirection: "column",
          }}>
            {/* Handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
              <div style={{ width: "40px", height: "4px", borderRadius: "2px", backgroundColor: "#1F2937" }} />
            </div>

            {/* Header da gaveta */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 20px 12px",
              borderBottom: "1px solid #1F2937",
            }}>
              <p style={{ color: "#64748B", fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Não agendadas ({unscheduledQuests.length})
              </p>
              <button
                onClick={() => setShowDrawer(false)}
                style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}
              >
                ×
              </button>
            </div>

            {/* Lista de quests */}
            <div style={{ overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {unscheduledQuests.length === 0 ? (
                <p style={{ color: "#374151", fontSize: "13px", textAlign: "center", padding: "24px 0" }}>
                  Todas as quests estão agendadas ✓
                </p>
              ) : (
                unscheduledQuests.map(quest => {
                  const colors = {
                    easy:      { color: "#22C55E", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)" },
                    medium:    { color: "#EAB308", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.2)" },
                    hard:      { color: "#F97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)" },
                    legendary: { color: "#A78BFA", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
                  }[quest.difficulty]

                  return (
                    <div
                      key={quest.$id}
                      onClick={() => {
                        // No mobile, agenda para o dia selecionado ao tocar
                        scheduleQuest(quest.$id, selectedDay, "09:00", 60)
                          .then(() => {
                            onQuestScheduled()
                            setShowDrawer(false)
                          })
                      }}
                      style={{
                        padding: "12px 14px",
                        backgroundColor: colors.bg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: "10px",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <p style={{ color: "white", fontSize: "13px", fontWeight: 500, marginBottom: "3px" }}>
                          {quest.title}
                        </p>
                        <span style={{ color: colors.color, fontSize: "11px" }}>
                          {quest.difficulty} · +{quest.xpReward} XP
                        </span>
                      </div>
                      <span style={{ color: "#475569", fontSize: "12px" }}>+ Hoje</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Modais */}
      {showEventModal && (
        <EventModal
          initialDate={newEventDate}
          initialTime={newEventTime}
          unscheduledQuests={unscheduledQuests}
          onSave={async (data: EventSaveData) => {
            if (data.type === "quest" && data.questId) {
              await scheduleQuest(data.questId, data.date, data.time, data.duration)
              onQuestScheduled()
            } else {
              await createEvent({
                title: data.title,
                description: data.description,
                date: data.date,
                time: data.time,
                duration: data.duration,
                color: data.color,
                isRecurring: data.isRecurring,
                recurringDays: data.recurringDays,
              })
            }
            setShowEventModal(false)
          }}
          onClose={() => setShowEventModal(false)}
        />
      )}

      {showItemModal && selectedItem && (
        <ItemModal
          item={selectedItem}
          onComplete={() => {
            if (selectedItem.type === "quest") onCompleteQuest(selectedItem.raw as Quest)
            setShowItemModal(false)
            refresh()
          }}
          onEdit={async (data) => {
            if (selectedItem.type === "event") await updateEvent(selectedItem.id, data)
            setShowItemModal(false)
            refresh()
          }}
          onDelete={async () => {
            if (selectedItem.type === "event") await deleteEvent(selectedItem.id)
            setShowItemModal(false)
            refresh()
          }}
          onQuestUpdated={() => {
            setShowItemModal(false)
            refresh()
          }}
          onClose={() => setShowItemModal(false)}
        />
      )}
    </div>
  )
}