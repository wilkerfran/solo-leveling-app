"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: "⚔️" },
  { href: "/progress", label: "Progresso", icon: "📈" },
  { href: "/achievements", label: "Conquistas", icon: "🏆" },
  { href: "/game-master", label: "Game Master", icon: "👁" },
]

interface NavigationProps {
  onLogout: () => void
}

export function Navigation({ onLogout }: NavigationProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Header desktop — escondido no mobile via CSS */}
      <div
        className="nav-header"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          backgroundColor: "rgba(8,11,20,0.95)",
          borderBottom: "1px solid #1F2937",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{
          maxWidth: "680px", margin: "0 auto",
          padding: "0 32px", height: "60px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%",
              backgroundColor: "#7C3AED",
            }} className="animate-pulse" />
            <span style={{
              color: "white", fontWeight: 700,
              letterSpacing: "0.15em", fontSize: "13px", textTransform: "uppercase",
            }}>
              Solo Leveling
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {NAV_ITEMS.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "6px 12px", borderRadius: "8px",
                    fontSize: "13px", textDecoration: "none",
                    color: isActive ? "#A78BFA" : "#64748B",
                    backgroundColor: isActive ? "rgba(124,58,237,0.1)" : "transparent",
                    border: `1px solid ${isActive ? "rgba(124,58,237,0.3)" : "transparent"}`,
                    transition: "all 0.2s",
                    fontWeight: isActive ? 600 : 400,
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = "white"
                      e.currentTarget.style.backgroundColor = "rgba(124,58,237,0.05)"
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#64748B"
                      e.currentTarget.style.backgroundColor = "transparent"
                    }
                  }}
                >
                  <span style={{ fontSize: "14px" }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
            <button
              onClick={onLogout}
              style={{
                marginLeft: "8px",
                color: "#475569", fontSize: "13px",
                background: "none", border: "none", cursor: "pointer",
                padding: "6px 8px",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "white")}
              onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Barra inferior mobile — escondida no desktop via CSS */}
      <div
        className="nav-bottom"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
          backgroundColor: "rgba(8,11,20,0.97)",
          borderTop: "1px solid #1F2937",
          backdropFilter: "blur(12px)",
          padding: "8px 0 max(8px, env(safe-area-inset-bottom))",
        }}
      >
        <div style={{
          display: "flex", justifyContent: "space-around", alignItems: "center",
          maxWidth: "480px", margin: "0 auto", padding: "0 16px",
          width: "100%",
        }}>
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: "4px",
                  padding: "6px 16px", borderRadius: "12px",
                  textDecoration: "none",
                  color: isActive ? "#A78BFA" : "#475569",
                  backgroundColor: isActive ? "rgba(124,58,237,0.1)" : "transparent",
                  transition: "all 0.2s",
                  minWidth: "64px",
                }}
              >
                <span style={{ fontSize: "20px", lineHeight: 1 }}>{item.icon}</span>
                <span style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.02em",
                }}>
                  {item.label}
                </span>
                {isActive && (
                  <div style={{
                    width: "4px", height: "4px", borderRadius: "50%",
                    backgroundColor: "#7C3AED",
                    marginTop: "2px",
                  }} />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}