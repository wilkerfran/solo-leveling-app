"use client"

import { useState, useEffect } from "react"
import { useNotifications } from "@/hooks/useNotifications"

interface NotificationBannerProps {
  questsCount: number
}

export function NotificationBanner({ questsCount }: NotificationBannerProps) {
  const { permission, isSupported, requestPermission } = useNotifications()
  const [dismissed, setDismissed] = useState(false)
  const [showPermission, setShowPermission] = useState(false)

  useEffect(() => {
  if (isSupported && permission === "default") {
    queueMicrotask(() => setShowPermission(true))
  }
}, [isSupported, permission])

  if (dismissed) return null

  // Banner pedindo permissão de notificação
  if (showPermission && permission === "default") {
    return (
      <div style={{
        backgroundColor: "rgba(124,58,237,0.1)",
        border: "1px solid rgba(124,58,237,0.3)",
        borderRadius: "12px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }}>
        <div>
          <p style={{ color: "#A78BFA", fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>
            Ativar notificações
          </p>
          <p style={{ color: "#64748B", fontSize: "12px" }}>
            Receba lembretes diários para completar suas quests
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button
            onClick={() => setDismissed(true)}
            style={{
              color: "#64748B", fontSize: "12px",
              background: "none", border: "none", cursor: "pointer",
            }}
          >
            Agora não
          </button>
          <button
            onClick={async () => {
              await requestPermission()
              setShowPermission(false)
            }}
            style={{
              backgroundColor: "#7C3AED",
              color: "white",
              fontSize: "12px",
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Ativar
          </button>
        </div>
      </div>
    )
  }

  // Banner de lembrete de quests pendentes
  if (questsCount > 0 && permission === "granted") {
    return (
      <div style={{
        backgroundColor: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.2)",
        borderRadius: "12px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "8px", height: "8px",
            borderRadius: "50%",
            backgroundColor: "#F59E0B",
          }} className="animate-pulse" />
          <p style={{ color: "#FCD34D", fontSize: "13px" }}>
            {questsCount} {questsCount === 1 ? "quest pendente" : "quests pendentes"} hoje
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{ color: "#64748B", background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}
        >
          ×
        </button>
      </div>
    )
  }

  return null
}