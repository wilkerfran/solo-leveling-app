"use client"

import { Quest } from "@/types"

const DAYS_OF_WEEK = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
]

interface RecurringPickerProps {
  isRecurring: boolean
  recurringType: Quest["recurringType"]
  recurringDays: number[]
  recurringFrequency: number
  onIsRecurringChange: (v: boolean) => void
  onTypeChange: (v: Quest["recurringType"]) => void
  onDaysChange: (v: number[]) => void
  onFrequencyChange: (v: number) => void
  size?: "sm" | "md"
}

export function RecurringPicker({
  isRecurring, recurringType, recurringDays, recurringFrequency,
  onIsRecurringChange, onTypeChange, onDaysChange, onFrequencyChange,
  size = "md",
}: RecurringPickerProps) {
  const fs = size === "sm" ? "11px" : "13px"
  const gap = size === "sm" ? "4px" : "6px"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: size === "sm" ? "8px" : "12px" }}>

      {/* Toggle recorrente */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          type="button"
          onClick={() => onIsRecurringChange(!isRecurring)}
          style={{
            width: size === "sm" ? "28px" : "36px",
            height: size === "sm" ? "16px" : "20px",
            borderRadius: "99px",
            backgroundColor: isRecurring ? "#7C3AED" : "#1F2937",
            border: "none", cursor: "pointer", position: "relative", flexShrink: 0,
          }}
        >
          <span style={{
            position: "absolute",
            top: "2px",
            left: isRecurring ? (size === "sm" ? "14px" : "18px") : "2px",
            width: size === "sm" ? "12px" : "16px",
            height: size === "sm" ? "12px" : "16px",
            backgroundColor: "white", borderRadius: "50%", transition: "left 0.2s",
          }} />
        </button>
        <span style={{ color: "#94A3B8", fontSize: fs }}>Recorrente</span>
      </div>

      {isRecurring && (
        <>
          {/* Tipo de recorrência */}
          <div style={{ display: "flex", gap, flexWrap: "wrap" }}>
            {([
              { value: "daily", label: "Diária" },
              { value: "specificDays", label: "Dias específicos" },
              { value: "weekly", label: "Semanal" },
              { value: "monthly", label: "Mensal" },
            ] as const).map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => onTypeChange(t.value)}
                style={{
                  padding: size === "sm" ? "3px 8px" : "5px 12px",
                  borderRadius: "6px", fontSize: fs, cursor: "pointer",
                  backgroundColor: recurringType === t.value ? "rgba(124,58,237,0.2)" : "transparent",
                  border: `1px solid ${recurringType === t.value ? "rgba(124,58,237,0.4)" : "#1F2937"}`,
                  color: recurringType === t.value ? "#A78BFA" : "#64748B",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Dias específicos */}
          {recurringType === "specificDays" && (
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {DAYS_OF_WEEK.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => onDaysChange(
                    recurringDays.includes(d.value)
                      ? recurringDays.filter(x => x !== d.value)
                      : [...recurringDays, d.value]
                  )}
                  style={{
                    padding: size === "sm" ? "3px 6px" : "4px 10px",
                    borderRadius: "6px", fontSize: fs, cursor: "pointer",
                    backgroundColor: recurringDays.includes(d.value) ? "rgba(124,58,237,0.2)" : "transparent",
                    border: `1px solid ${recurringDays.includes(d.value) ? "rgba(124,58,237,0.4)" : "#1F2937"}`,
                    color: recurringDays.includes(d.value) ? "#A78BFA" : "#64748B",
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}

          {/* Frequência mensal */}
          {recurringType === "monthly" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#94A3B8", fontSize: fs }}>Dia</span>
              <input
                type="number"
                min={1}
                max={28}
                value={recurringFrequency}
                onChange={e => onFrequencyChange(Number(e.target.value))}
                style={{
                  width: "60px", backgroundColor: "#080B14",
                  border: "1px solid #1F2937", borderRadius: "6px",
                  padding: "4px 8px", color: "white", fontSize: fs, outline: "none",
                }}
              />
              <span style={{ color: "#64748B", fontSize: fs }}>do mês</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}