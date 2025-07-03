export interface PasswordComplexity {
  score: number
  level: "weak" | "fair" | "good" | "strong" | "excellent"
  feedback: string[]
}

export function calculateEntropy(password: string): number {
  // Character set sizes
  const charSets = {
    lowercase: /[a-z]/.test(password) ? 26 : 0,
    uppercase: /[A-Z]/.test(password) ? 26 : 0,
    numbers: /[0-9]/.test(password) ? 10 : 0,
    symbols: /[^a-zA-Z0-9]/.test(password) ? 32 : 0, // Approximate
  }

  const totalCharSet = Object.values(charSets).reduce((sum, size) => sum + size, 0)

  if (totalCharSet === 0) return 0

  // Entropy = log2(charset^length)
  return Math.log2(Math.pow(totalCharSet, password.length))
}

export function getPasswordComplexity(password: string): PasswordComplexity {
  let score = 0
  const feedback: string[] = []

  // Length scoring
  if (password.length >= 12) {
    score += 25
  } else if (password.length >= 8) {
    score += 15
    feedback.push("Consider using more characters for better security")
  } else {
    score += 5
    feedback.push("Password is too short - use at least 8 characters")
  }

  // Character variety
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumbers = /[0-9]/.test(password)
  const hasSymbols = /[^a-zA-Z0-9]/.test(password)

  let varietyScore = 0
  if (hasLower) varietyScore += 5
  if (hasUpper) varietyScore += 10
  if (hasNumbers) varietyScore += 10
  if (hasSymbols) varietyScore += 15

  score += varietyScore

  // Dictionary word bonus (for our use case)
  const wordCount = password.split("-").length
  if (wordCount >= 3) {
    score += wordCount * 5
    feedback.push(`Good use of ${wordCount} words for memorability`)
  }

  // Pattern penalties
  if (/(.)\1{2,}/.test(password)) {
    score -= 10
    feedback.push("Avoid repeating characters")
  }

  if (/123|abc|qwe/i.test(password)) {
    score -= 15
    feedback.push("Avoid common sequences")
  }

  // Determine level
  let level: PasswordComplexity["level"]
  if (score >= 80) level = "excellent"
  else if (score >= 60) level = "strong"
  else if (score >= 40) level = "good"
  else if (score >= 20) level = "fair"
  else level = "weak"

  // Add level-specific feedback
  if (level === "excellent") {
    feedback.push("Excellent password strength!")
  } else if (level === "weak") {
    feedback.push("This password needs significant improvement")
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    level,
    feedback,
  }
}
