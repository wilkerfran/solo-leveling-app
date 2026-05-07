"use client"

import { useState, useEffect } from "react"
import { authService } from "@/services/auth.service"
import { Models } from "appwrite"

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

    if (globalLoading) {
      // Timeout de segurança — se demorar mais de 5s, considera sem sessão
      const timeout = setTimeout(() => {
        if (globalLoading) {
          globalLoading = false
          globalUser = null
          notifyListeners()
        }
      }, 5000)

      authService.getCurrentUser().then((user) => {
        clearTimeout(timeout)
        globalUser = user
        globalLoading = false
        notifyListeners()
      }).catch(() => {
        clearTimeout(timeout)
        globalUser = null
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