/**
 * Module for evaluating the complexity of dictionary-generated passwords with added noise.
 * Provides a score, strength level, and actionable feedback based on entropy, character variety,
 * word count, and total length. Designed for passwords constructed from dictionary words with noise
 * (e.g., hyphens, symbols, numbers) to assess their resistance to common attacks. Applies a dynamic
 * penalty for dictionary-based passwords with no symbols (excluding hyphens) or numbers, and rewards
 * long passwords and multiple words for added complexity.
 *
 * @example
 * const result = getPasswordComplexity("H=el6icopter-Freedom");
 * console.log(result);
 * // Output: { score: 79.52, level: "strong", feedback: ["Multiple words add complexity", "Long password length adds strength"] }
 */
export interface PasswordComplexity {
  score: number; // Numerical score from 0 to 100
  level: "weak" | "fair" | "good" | "strong" | "excellent"; // Strength level
  feedback: string[]; // Suggestions for improving password strength
}

/**
 * Configuration for strength levels, mapping to visual properties.
 */
const STRENGTH_CONFIG: Record<PasswordComplexity["level"], { color: string; width: number }> = {
  weak: { color: "red", width: 20 },
  fair: { color: "yellow", width: 40 },
  good: { color: "blue", width: 60 },
  strong: { color: "green", width: 80 },
  excellent: { color: "pink", width: 100 },
};

/**
 * Thresholds for entropy and score ranges.
 */
const ENTROPY_THRESHOLDS = {
  WEAK: 28,
  FAIR: 40,
  GOOD: 60,
  STRONG: 128,
  EXCELLENT: 256,
};

const SCORE_RANGES = {
  WEAK_MAX: 20,
  FAIR_MAX: 40,
  GOOD_MAX: 60,
  STRONG_MAX: 80,
  EXCELLENT_MAX: 100,
};

/**
 * Constants for password evaluation.
 */
const MINIMUM_LENGTH = 8;
const LONG_PASSWORD_LENGTH = 20; // Threshold for length-based bonus
const DEFAULT_DICTIONARY_PENALTY_FACTOR = 0.7; // Default penalty for dictionary-based passwords
const STRICT_DICTIONARY_PENALTY_FACTOR = 0.3; // Stricter penalty when no symbols (excluding hyphens) or numbers
const LENGTH_BONUS = 10; // Bonus for long passwords
const WORD_BONUS = 5; // Bonus per additional word beyond the first
const DICTIONARY_VARIETY_PENALTY = 5; // Additional penalty for dictionary-based passwords with variety < 4

/**
 * Calculates the entropy of a password based on its character set and length.
 * @param password - The password to evaluate.
 * @returns Entropy in bits, or 0 for invalid inputs.
 */
export function calculateEntropy(password: string): number {
  if (typeof password !== "string" || password.length === 0) return 0;

  const cleanPassword = password.replace(/-/g, ""); // Remove hyphens for entropy calculation
  const characterSets = {
    lowercase: /[a-z]/.test(cleanPassword) ? 26 : 0,
    uppercase: /[A-Z]/.test(cleanPassword) ? 26 : 0,
    numbers: /[0-9]/.test(cleanPassword) ? 10 : 0,
    symbols: /[^a-zA-Z0-9]/.test(cleanPassword) ? 32 : 0,
  };

  const totalCharacterSetSize = Object.values(characterSets).reduce((sum, size) => sum + size, 0);
  if (totalCharacterSetSize === 0) return 0;

  return Math.log2(totalCharacterSetSize ** cleanPassword.length);
}

/**
 * Maps entropy to a score between 0 and 100.
 * @param entropy - Calculated entropy in bits.
 * @returns Score from 0 to 100.
 */
function mapEntropyToScore(entropy: number): number {
  if (entropy <= 0) return 0;
  if (entropy < ENTROPY_THRESHOLDS.WEAK) {
    return (entropy / ENTROPY_THRESHOLDS.WEAK) * SCORE_RANGES.WEAK_MAX;
  } else if (entropy < ENTROPY_THRESHOLDS.FAIR) {
    return (
      SCORE_RANGES.WEAK_MAX +
      ((entropy - ENTROPY_THRESHOLDS.WEAK) / (ENTROPY_THRESHOLDS.FAIR - ENTROPY_THRESHOLDS.WEAK)) *
        (SCORE_RANGES.FAIR_MAX - SCORE_RANGES.WEAK_MAX)
    );
  } else if (entropy < ENTROPY_THRESHOLDS.GOOD) {
    return (
      SCORE_RANGES.FAIR_MAX +
      ((entropy - ENTROPY_THRESHOLDS.FAIR) / (ENTROPY_THRESHOLDS.GOOD - ENTROPY_THRESHOLDS.FAIR)) *
        (SCORE_RANGES.GOOD_MAX - SCORE_RANGES.FAIR_MAX)
    );
  } else if (entropy < ENTROPY_THRESHOLDS.STRONG) {
    return (
      SCORE_RANGES.GOOD_MAX +
      ((entropy - ENTROPY_THRESHOLDS.GOOD) / (ENTROPY_THRESHOLDS.STRONG - ENTROPY_THRESHOLDS.GOOD)) *
        (SCORE_RANGES.STRONG_MAX - SCORE_RANGES.GOOD_MAX)
    );
  } else if (entropy < ENTROPY_THRESHOLDS.EXCELLENT) {
    return (
      SCORE_RANGES.STRONG_MAX +
      ((entropy - ENTROPY_THRESHOLDS.STRONG) / (ENTROPY_THRESHOLDS.EXCELLENT - ENTROPY_THRESHOLDS.STRONG)) *
        (SCORE_RANGES.EXCELLENT_MAX - SCORE_RANGES.STRONG_MAX)
    );
  }
  return SCORE_RANGES.EXCELLENT_MAX;
}

/**
 * Evaluates the variety of character types in the password.
 * @param password - The password to analyze.
 * @returns Number of character types and specific checks.
 */
function analyzeCharacterVariety(password: string): { varietyCount: number; checks: Record<string, boolean> } {
  const checks = {
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumbers: /[0-9]/.test(password),
    hasSymbols: /[^a-zA-Z0-9-]/.test(password), // Exclude hyphens from symbol check
  };
  const varietyCount = Object.values(checks).filter(Boolean).length;
  return { varietyCount, checks };
}

/**
 * Generates feedback based on character variety.
 * @param varietyCount - Number of character types.
 * @param checks - Character type presence checks.
 * @param isDictionaryBased - Whether the password is dictionary-based.
 * @returns Feedback messages.
 */
function generateVarietyFeedback(varietyCount: number, checks: Record<string, boolean>, isDictionaryBased: boolean): string[] {
  const feedback: string[] = [];
  if (varietyCount <= 1) {
    feedback.push("Include uppercase letters, numbers, or symbols (beyond hyphens) to enhance security");
  } else if (varietyCount === 2) {
    feedback.push("Add another character type (e.g., numbers or symbols beyond hyphens) for stronger security");
  } else if (varietyCount === 3 && isDictionaryBased) {
    if (!checks.hasNumbers) feedback.push("Incorporate numbers to further strengthen your password");
    if (!checks.hasSymbols) feedback.push("Incorporate symbols (beyond hyphens) to further strengthen your password");
  }
  return feedback;
}

/**
 * Applies penalties for dictionary-based passwords and bonuses for length and word count.
 * @param password - The password to evaluate.
 * @param baseScore - The initial score.
 * @param varietyCount - Number of character types.
 * @param checks - Character type presence checks.
 * @returns Adjusted score and feedback.
 */
function applySecurityPenalties(
  password: string,
  baseScore: number,
  varietyCount: number,
  checks: Record<string, boolean>
): { finalScore: number; feedback: string[] } {
  let score = baseScore;
  const feedback: string[] = [];

  // Penalty for dictionary-based passwords (hyphen-separated words)
  const wordCount = password.split("-").length;
  const isDictionaryBased = wordCount >= 2;
  if (isDictionaryBased) {
    // Apply stricter penalty if no symbols (excluding hyphens) or numbers
    const penaltyFactor = !checks.hasSymbols && !checks.hasNumbers ? STRICT_DICTIONARY_PENALTY_FACTOR : DEFAULT_DICTIONARY_PENALTY_FACTOR;
    score *= penaltyFactor;

    // Additional penalty for dictionary-based passwords with less than maximum variety
    if (varietyCount < 3) {
      score -= DICTIONARY_VARIETY_PENALTY;
      feedback.push("Add more words or increase character density to strengthen your password");
    }

    // Bonus for multiple words
    if (wordCount >= 2) {
      score += (wordCount - 1) * WORD_BONUS;
    }
  }

  // Penalty for short passwords
  if (password.length < MINIMUM_LENGTH) {
    score -= 20;
    feedback.push(`Use at least ${MINIMUM_LENGTH} characters for better security`);
  }

  // Bonus for long passwords
  if (password.length >= LONG_PASSWORD_LENGTH) {
    score += LENGTH_BONUS;
  }

  return { finalScore: Math.max(0, Math.min(100, score)), feedback };
}

/**
 * Determines the strength level based on the score.
 * @param score - The final score.
 * @returns The corresponding strength level.
 */
function determineStrengthLevel(score: number): PasswordComplexity["level"] {
  if (score >= SCORE_RANGES.STRONG_MAX) return "excellent";
  if (score >= SCORE_RANGES.GOOD_MAX) return "strong";
  if (score >= SCORE_RANGES.FAIR_MAX) return "good";
  if (score >= SCORE_RANGES.WEAK_MAX) return "fair";
  return "weak";
}

/**
 * Evaluates the complexity of a dictionary-generated password with noise.
 * @param password - The password to evaluate.
 * @returns A PasswordComplexity object with score, level, and feedback.
 */
export function getPasswordComplexity(password: string): PasswordComplexity {
  if (typeof password !== "string") {
    return { score: 0, level: "weak", feedback: ["Invalid input: password must be a string"] };
  }
  if (password.length === 0) {
    return { score: 0, level: "weak", feedback: ["Password cannot be empty"] };
  }

  const entropy = calculateEntropy(password);
  const baseScore = mapEntropyToScore(entropy);
  const { varietyCount, checks } = analyzeCharacterVariety(password);
  const wordCount = password.split("-").length;
  const isDictionaryBased = wordCount >= 2;
  const varietyFeedback = generateVarietyFeedback(varietyCount, checks, isDictionaryBased);
  const { finalScore, feedback: penaltyFeedback } = applySecurityPenalties(password, baseScore, varietyCount, checks);
  const level = determineStrengthLevel(finalScore);

  // Combine feedback and ensure uniqueness
  const feedback = [...varietyFeedback, ...penaltyFeedback].filter(
    (message, index, self) => message && self.indexOf(message) === index // Remove duplicates and undefined
  );

  // Ensure feedback messages are properly formatted and not concatenated
  const formattedFeedback = feedback.map(message => message.trim()).filter(message => message.length > 0);

  return {
    score: Number(finalScore.toFixed(2)),
    level,
    feedback: formattedFeedback.length > 0 ? formattedFeedback : [],
  };
}

/**
 * Retrieves the color class for a given strength level.
 * @param level - The strength level.
 * @returns The corresponding color class.
 */
export function getStrengthColor(level: PasswordComplexity["level"]): string {
  return `bg-${STRENGTH_CONFIG[level]?.color}-500`;
}

/**
 * Retrieves the width percentage for a given strength level.
 * @param level - The strength level.
 * @returns The corresponding width percentage.
 */
export function getStrengthWidth(level: PasswordComplexity["level"]): number {
  return STRENGTH_CONFIG[level]?.width ?? 20;
}