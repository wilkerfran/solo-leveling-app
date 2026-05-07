"use client"

import { useState, useEffect } from "react"

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    const supported = "Notification" in window && "serviceWorker" in navigator
    // Usa queueMicrotask para evitar setState síncrono no efeito
    queueMicrotask(() => {
      setIsSupported(supported)
      if (supported) setPermission(Notification.permission)
    })
  }, [])

  async function requestPermission(): Promise<boolean> {
    if (!isSupported) return false
    const result = await Notification.requestPermission()
    setPermission(result)
    return result === "granted"
  }

  async function subscribeToPush(): Promise<PushSubscription | null> {
    if (!isSupported || permission !== "granted") return null
    try {
      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      if (existing) return existing

      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      const padding = "=".repeat((4 - (key.length % 4)) % 4)
      const base64 = (key + padding).replace(/-/g, "+").replace(/_/g, "/")
      const rawData = window.atob(base64)
      // Corrige o tipo — usa ArrayBuffer explícito
      const buffer = new ArrayBuffer(rawData.length)
      const view = new Uint8Array(buffer)
      for (let i = 0; i < rawData.length; i++) {
        view[i] = rawData.charCodeAt(i)
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: buffer,
      })
      return subscription
    } catch {
      return null
    }
  }

  function showLocalNotification(title: string, body: string) {
    if (permission !== "granted") return
    new Notification(title, { body, icon: "/icons/icon-sl.png" })
  }

  return { permission, isSupported, requestPermission, subscribeToPush, showLocalNotification }
}