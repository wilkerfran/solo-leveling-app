"use client"

import { useState, useEffect, useRef } from "react"
import { characterService } from "@/services/character.service"
import { Character } from "@/types"

export function useCharacter(userId: string | undefined) {
  const [character, setCharacter] = useState<Character | null>(null)
  const [fetchStatus, setFetchStatus] = useState<"idle" | "loading" | "done">("idle")
  const [hasCharacter, setHasCharacter] = useState(false)
  const fetchedFor = useRef<string | null>(null)

  useEffect(() => {
    if (userId === undefined) return
    if (fetchedFor.current === userId) return // já buscou para esse userId

    fetchedFor.current = userId
    setFetchStatus("loading")

    characterService.getByUserId(userId)
      .then((char) => {
        setCharacter(char)
        setHasCharacter(char !== null)
        setFetchStatus("done")
      })
      .catch((err) => {
        console.error("❌ erro ao buscar personagem:", err.message)
        setHasCharacter(false)
        setFetchStatus("done")
      })
  }, [userId])

  // isLoading é true enquanto não terminou de buscar
  const isLoading = userId === undefined || fetchStatus === "idle" || fetchStatus === "loading"

  async function createCharacter(name: string, characterClass: string) {
    if (!userId) return
    const newChar = await characterService.create(userId, name, characterClass)
    setCharacter(newChar)
    setHasCharacter(true)
    return newChar
  }

  function updateCharacter(updated: Character) {
    setCharacter(updated)
  }

  return { character, isLoading, hasCharacter, createCharacter, updateCharacter }
}