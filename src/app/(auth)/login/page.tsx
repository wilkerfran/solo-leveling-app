"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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
    <main className="min-h-screen bg-solo-bg flex items-center justify-center px-4">
      {/* Decoração de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-solo-purple/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-solo-purple rounded-full animate-pulse" />
            <span className="text-white font-bold tracking-widest text-sm uppercase">
              Solo Leveling
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Bem-vindo de volta</h1>
          <p className="text-solo-muted text-sm">Continue sua jornada de evolução</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-solo-subtle mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-solo-surface border border-solo-border rounded-xl px-4 py-3 text-white placeholder-solo-muted focus:outline-none focus:border-solo-purple transition-colors"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm text-solo-subtle mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-solo-surface border border-solo-border rounded-xl px-4 py-3 text-white placeholder-solo-muted focus:outline-none focus:border-solo-purple transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/50 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-solo-purple hover:bg-violet-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors mt-2"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-solo-muted">
          Não tem conta?{" "}
          <Link href="/register" className="text-solo-purple-light hover:text-white transition-colors">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  )
}