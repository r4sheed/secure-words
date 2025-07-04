"use client"

import { useState, useCallback } from "react"
import { WORD_CATEGORIES, type WordCategory } from "@/lib/word-lists"

interface PasswordOptions {
  wordCount: number
  includeCapitals: boolean
  includeNumbers: boolean
  wordCategory: WordCategory
  minWordLength: number
  maxWordLength: number
  numberDensity: number
  avoidSimilarWords: boolean
}

export function usePasswordGenerator(options: PasswordOptions) {
  const [password, setPassword] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Secure random number generator with fallback
  const getSecureRandom = useCallback((max: number): number => {
    if (typeof window !== "undefined" && window.crypto && typeof window.crypto.getRandomValues === "function") {
      const array = new Uint32Array(1)
      crypto.getRandomValues(array)
      return array[0] % max
    }
    // Fallback for environments without crypto API
    return Math.floor(Math.random() * max)
  }, [])

  // Get filtered word list based on options
  const getFilteredWords = useCallback((opts: PasswordOptions): string[] => {
    const words = WORD_CATEGORIES[opts.wordCategory]
    return words.filter((word) => word.length >= opts.minWordLength && word.length <= opts.maxWordLength)
  }, [])

  // Check if words are phonetically similar (basic implementation)
  const areSimilar = useCallback((word1: string, word2: string, opts: PasswordOptions): boolean => {
    if (!opts.avoidSimilarWords) return false

    // Simple similarity check based on first 2 characters and length
    return word1.substring(0, 2) === word2.substring(0, 2) && Math.abs(word1.length - word2.length) <= 1
  }, [])

  // Get random words with similarity checking
  const getRandomWords = useCallback(
    (count: number, opts: PasswordOptions): string[] => {
      const availableWords = getFilteredWords(opts)
      if (availableWords.length < count) {
        throw new Error("Not enough words available with current filters")
      }

      const words: string[] = []
      const maxAttempts = availableWords.length * 2

      for (let attempts = 0; attempts < maxAttempts && words.length < count; attempts++) {
        const index = getSecureRandom(availableWords.length)
        const candidate = availableWords[index]

        // Check if word is too similar to existing words
        const isSimilar = words.some((existingWord) => areSimilar(candidate, existingWord, opts))

        if (!isSimilar && !words.includes(candidate)) {
          words.push(candidate)
        }
      }

      // If we couldn't find enough unique words, fill with random ones
      while (words.length < count) {
        const index = getSecureRandom(availableWords.length)
        const candidate = availableWords[index]
        if (!words.includes(candidate)) {
          words.push(candidate)
        }
      }

      return words
    },
    [getFilteredWords, getSecureRandom, areSimilar],
  )

  // Insert number at random position in word
  const insertNumberInWord = useCallback(
    (word: string): string => {
      if (word.length <= 2) return word
      const number = getSecureRandom(10)
      const position = getSecureRandom(word.length - 2) + 1 // Not at start or end
      return word.slice(0, position) + number + word.slice(position)
    },
    [getSecureRandom],
  )

  // Generate password
  const generatePassword = useCallback((): string => {
    setIsGenerating(true)

    try {
      const words = getRandomWords(options.wordCount, options)
      let processedWords = [...words]

      // Apply capitalization
      if (options.includeCapitals) {
        processedWords = processedWords.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      }

      // Apply numbers based on density
      if (options.includeNumbers) {
        const wordsToModify = Math.max(1, Math.floor(options.wordCount * options.numberDensity))
        const indicesToModify = new Set<number>()

        while (indicesToModify.size < wordsToModify) {
          indicesToModify.add(getSecureRandom(options.wordCount))
        }

        indicesToModify.forEach((index) => {
          processedWords[index] = insertNumberInWord(processedWords[index])
        })
      }

      const newPassword = processedWords.join("-")
      setPassword(newPassword)
      return newPassword
    } catch (error) {
      console.error("Error generating password:", error)
      return ""
    } finally {
      setIsGenerating(false)
    }
  }, [options, getRandomWords, insertNumberInWord, getSecureRandom])

  // Update existing password with new options - FIXED VERSION
  const updatePasswordWithOptions = useCallback(
    (newOptions: PasswordOptions) => {
      if (!password) return

      setIsGenerating(true)

      try {
        // Extract base words from current password
        const words = password.split("-").map((word) => word.replace(/[0-9]/g, "").toLowerCase())

        let processedWords = [...words]

        // Apply capitalization based on NEW options
        if (newOptions.includeCapitals) {
          processedWords = processedWords.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        }

        // Apply numbers based on NEW options
        if (newOptions.includeNumbers) {
          const wordsToModify = Math.max(1, Math.floor(words.length * newOptions.numberDensity))
          const indicesToModify = new Set<number>()

          while (indicesToModify.size < wordsToModify && indicesToModify.size < words.length) {
            indicesToModify.add(getSecureRandom(words.length))
          }

          indicesToModify.forEach((index) => {
            if (index < processedWords.length) {
              processedWords[index] = insertNumberInWord(processedWords[index])
            }
          })
        }

        const updatedPassword = processedWords.join("-")
        setPassword(updatedPassword)
      } catch (error) {
        console.error("Error updating password:", error)
      } finally {
        setIsGenerating(false)
      }
    },
    [password, insertNumberInWord, getSecureRandom],
  )

  return {
    password,
    generatePassword,
    updatePasswordWithOptions,
    isGenerating,
  }
}
