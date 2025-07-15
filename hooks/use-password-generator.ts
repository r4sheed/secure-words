"use client"

import { useState, useCallback } from "react"
import { defaultLocale } from "@/i18n/config"
import { WORD_CATEGORIES, type WordCategory } from "@/lib/word-lists"

// Character sets
const SPECIAL_CHARS = "#!?%=@*$"
const NUMBER_CHARS = "0123456789"

// Normalize accents for consistent comparison
const normalize = (word: string): string =>
  word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

interface PasswordOptions {
  wordCount: number
  includeCapitals: boolean
  includeNumbers: boolean
  includeSpecials: boolean
  wordCategory: WordCategory
  minWordLength: number
  maxWordLength: number
  characterDensity: number
  avoidSimilarWords: boolean
}

export function usePasswordGenerator(options: PasswordOptions) {
  const [password, setPassword] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Secure random number generator with fallback
  const getSecureRandom = useCallback((max: number): number => {
    if (
      typeof window !== "undefined" &&
      window.crypto &&
      typeof window.crypto.getRandomValues === "function"
    ) {
      const range = 2 ** 32
      const limit = range - (range % max)
      let val: number
      do {
        const array = new Uint32Array(1)
        window.crypto.getRandomValues(array)
        val = array[0]
      } while (val >= limit)
      return val % max
    }
    return Math.floor(Math.random() * max)
  }, [])

  // Get filtered word list based on options
  const getFilteredWords = useCallback((opts: PasswordOptions): string[] => {
    const words = WORD_CATEGORIES[defaultLocale][opts.wordCategory]
    const normalizedWords = words.map(normalize)
    const filteredWords = normalizedWords.filter(
      (word) => word.length >= opts.minWordLength && word.length <= opts.maxWordLength
    )
    if (filteredWords.length < 25) {
      throw new Error(
        `Word list too small (${filteredWords.length} words). Please choose a broader category or adjust length constraints.`
      )
    }
    return filteredWords
  }, [])

  // Check if two words are too similar
  const areSimilar = useCallback(
    (word1: string, word2: string, opts: PasswordOptions): boolean => {
      if (!opts.avoidSimilarWords) return false
      return (
        word1.substring(0, 2) === word2.substring(0, 2) &&
        Math.abs(word1.length - word2.length) <= 1
      )
    },
    []
  )

  // Select random words with similarity checking
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
        const isSimilar = words.some((existingWord) => areSimilar(candidate, existingWord, opts))
        if (!isSimilar && !words.includes(candidate)) {
          words.push(candidate)
        }
      }

      while (words.length < count) {
        const index = getSecureRandom(availableWords.length)
        const candidate = availableWords[index]
        if (!words.includes(candidate)) {
          words.push(candidate)
        }
      }

      return words
    },
    [getFilteredWords, getSecureRandom, areSimilar]
  )

  // Insert a random character from a set into a word
  const insertRandomChar = useCallback(
    (word: string, chars: string): string => {
      if (word.length <= 2) return word
      const char = chars[getSecureRandom(chars.length)]
      const position = getSecureRandom(word.length - 2) + 1
      return word.slice(0, position) + char + word.slice(position)
    },
    [getSecureRandom]
  )

  const insertNumberInWord = useCallback(
    (word: string) => insertRandomChar(word, NUMBER_CHARS),
    [insertRandomChar]
  )

  const insertSpecialInWord = useCallback(
    (word: string) => insertRandomChar(word, SPECIAL_CHARS),
    [insertRandomChar]
  )

  // Modify a subset of words based on density
  const modifyRandomWords = useCallback(
    (words: string[], density: number, modifyFn: (word: string) => string): string[] => {
      const wordsToModify = Math.max(1, Math.floor(words.length * density))
      const indices = new Set<number>()
      while (indices.size < wordsToModify) {
        indices.add(getSecureRandom(words.length))
      }
      const modifiedWords = [...words]
      indices.forEach((index) => {
        modifiedWords[index] = modifyFn(modifiedWords[index])
      })
      return modifiedWords
    },
    [getSecureRandom]
  )

  // Process words according to options
  const processWords = useCallback(
    (words: string[], opts: PasswordOptions): string => {
      let processed = [...words]

      if (opts.includeCapitals) {
        processed = processed.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      }

      if (opts.includeNumbers) {
        processed = modifyRandomWords(processed, opts.characterDensity, insertNumberInWord)
      }

      if (opts.includeSpecials) {
        processed = modifyRandomWords(processed, opts.characterDensity, insertSpecialInWord)
      }

      return processed.join("-")
    },
    [modifyRandomWords, insertNumberInWord, insertSpecialInWord]
  )

  // Generate a new password
  const generatePassword = useCallback((): string => {
    setIsGenerating(true)
    try {
      const words = getRandomWords(options.wordCount, options)
      const newPassword = processWords(words, options)
      setPassword(newPassword)
      return newPassword
    } catch (error) {
      console.error("Error generating password:", error)
      return ""
    } finally {
      setIsGenerating(false)
    }
  }, [options, getRandomWords, processWords])

  // Update password with new options
  const updatePasswordWithOptions = useCallback(
    (newOptions: PasswordOptions) => {
      if (!password) return
      setIsGenerating(true)
      try {
        const charsToRemove = `${SPECIAL_CHARS}${NUMBER_CHARS}`
        const words = password.split("-").map((word) =>
          word.replace(new RegExp(`[${charsToRemove}]`, "g"), "").toLowerCase()
        )
        const updatedPassword = processWords(words, newOptions)
        setPassword(updatedPassword)
      } catch (error) {
        console.error("Error updating password:", error)
      } finally {
        setIsGenerating(false)
      }
    },
    [password, processWords]
  )

  return {
    password,
    generatePassword,
    updatePasswordWithOptions,
    isGenerating,
  }
}
