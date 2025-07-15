"use client"

import { useState, useCallback } from "react"

interface PasswordHistoryEntry {
  password: string
  timestamp: Date
  options: {
    wordCount: number
    includeCapitals: boolean
    includeNumbers: boolean
    includeSpecials: boolean
    wordCategory: string
  }
}

export function usePasswordHistory() {
  const [history, setHistory] = useState<PasswordHistoryEntry[]>([])

  const addToHistory = useCallback((password: string, options: any) => {
    const entry: PasswordHistoryEntry = {
      password,
      timestamp: new Date(),
      options: {
        wordCount: options.wordCount,
        includeCapitals: options.includeCapitals,
        includeNumbers: options.includeNumbers,
        includeSpecials: options.includeSpecials,
        wordCategory: options.wordCategory,
      },
    }

    setHistory((prev) => [entry, ...prev].slice(0, 50)) // Keep last 50 entries
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return {
    history,
    addToHistory,
    clearHistory,
  }
}
