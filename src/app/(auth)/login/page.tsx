"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import Link from "next/link"

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: (i * 37 + 11) % 100,
  y: (i * 53 + 7) % 100,
  size: (i % 3) + 1,
  duration: 8 + (i % 10),
  delay: (i % 5),
  opacity: 0.1 + (i % 4) * 0.08,
}))

function Particles() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {PARTICLES.map(p => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: "50%",
            backgroundColor: "#7C3AED",
            opacity: p.opacity,
            animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      await login(email, password)
      router.push("/dashboard")
    } catch {
      setError("Email ou senha incorretos")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      backgroundColor: "#080B14",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
    }}>
      <Particles />

      <div style={{
        position: "absolute",
        top: "30%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "500px", height: "500px",
        borderRadius: "50%",
        backgroundColor: "rgba(124,58,237,0.06)",
        filter: "blur(80px)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "400px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            marginBottom: "20px",
          }}>
            <div style={{
              width: "10px", height: "10px", borderRadius: "50%",
              backgroundColor: "#7C3AED",
              boxShadow: "0 0 12px #7C3AED",
            }} className="animate-pulse" />
            <span style={{
              color: "#A78BFA", fontWeight: 700,
              letterSpacing: "0.2em", fontSize: "12px",
              textTransform: "uppercase",
            }}>
              Solo Leveling
            </span>
          </div>
          <h1 style={{
            color: "white", fontSize: "32px",
            fontWeight: 800, marginBottom: "8px",
            lineHeight: 1.1,
          }}>
            Bem-vindo de volta
          </h1>
          <p style={{ color: "#64748B", fontSize: "14px" }}>
            Continue sua jornada de evolução
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          <div>
            <label style={{
              display: "block", color: "#94A3B8",
              fontSize: "13px", fontWeight: 500,
              marginBottom: "8px", letterSpacing: "0.03em",
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              style={{
                width: "100%",
                backgroundColor: "#0D1117",
                border: "1px solid #1F2937",
                borderRadius: "12px",
                padding: "14px 16px",
                color: "white",
                fontSize: "15px",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#7C3AED")}
              onBlur={e => (e.currentTarget.style.borderColor = "#1F2937")}
            />
          </div>

          <div>
            <label style={{
              display: "block", color: "#94A3B8",
              fontSize: "13px", fontWeight: 500,
              marginBottom: "8px", letterSpacing: "0.03em",
            }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: "100%",
                backgroundColor: "#0D1117",
                border: "1px solid #1F2937",
                borderRadius: "12px",
                padding: "14px 16px",
                color: "white",
                fontSize: "15px",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#7C3AED")}
              onBlur={e => (e.currentTarget.style.borderColor = "#1F2937")}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: "rgba(220,38,38,0.1)",
              border: "1px solid rgba(220,38,38,0.3)",
              borderRadius: "10px",
              padding: "12px 14px",
              color: "#FCA5A5",
              fontSize: "13px",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: "4px",
              backgroundColor: isLoading ? "rgba(124,58,237,0.5)" : "#7C3AED",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "15px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: isLoading ? "none" : "0 0 20px rgba(124,58,237,0.3)",
            }}
            onMouseEnter={e => {
              if (!isLoading) e.currentTarget.style.backgroundColor = "#6D28D9"
            }}
            onMouseLeave={e => {
              if (!isLoading) e.currentTarget.style.backgroundColor = "#7C3AED"
            }}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p style={{
          marginTop: "24px", textAlign: "center",
          color: "#475569", fontSize: "14px",
        }}>
          Não tem conta?{" "}
          <Link href="/register" style={{ color: "#A78BFA", textDecoration: "none", fontWeight: 500 }}>
            Criar conta
          </Link>
        </p>

      </div>
    </main>
  )
}