"use client"

import { useState, useEffect } from "react"
import { authService } from "@/services/auth.service"
import { Models } from "appwrite"

// Estado global fora do hook — persiste entre remontagens
let globalUser: Models.User<Models.Preferences> | null = null
let globalLoading = true
let listeners: Array<() => void> = []

function notifyListeners() {
  listeners.forEach(fn => fn())
}

export function useAuth() {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1)
    listeners.push(listener)

    // Só busca o usuário uma vez
    if (globalLoading) {
      authService.getCurrentUser().then((user) => {
        globalUser = user
        globalLoading = false
        notifyListeners()
      })
    }

    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  }, [])

  async function login(email: string, password: string) {
    await authService.login(email, password)
    globalUser = await authService.getCurrentUser()
    globalLoading = false
    notifyListeners()
  }

  async function register(email: string, password: string, name: string) {
    await authService.register(email, password, name)
    globalUser = await authService.getCurrentUser()
    globalLoading = false
    notifyListeners()
  }

  async function logout() {
    await authService.logout()
    globalUser = null
    notifyListeners()
  }

  return {
    user: globalUser,
    isLoading: globalLoading,
    login,
    register,
    logout,
  }
}