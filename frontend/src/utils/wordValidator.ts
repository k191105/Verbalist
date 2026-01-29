// Simple word validation utility
// In production, this could use a dictionary API or local word list

// Basic common English words to validate against (a small subset for demo)
// In production, you'd use a full dictionary API
const COMMON_WORD_PATTERNS = /^[a-z]{2,}$/;

// Minimum word length
const MIN_WORD_LENGTH = 2;
const MAX_WORD_LENGTH = 30;

// Words that are clearly not real words (common typos, gibberish patterns)
const INVALID_PATTERNS = [
  /^(.)\1{2,}$/, // Same letter repeated 3+ times (aaa, bbbb)
  /^[bcdfghjklmnpqrstvwxz]{4,}$/, // 4+ consonants in a row with no vowels
];

export interface ValidationResult {
  isValid: boolean;
  word: string;
  reason?: string;
}

export function validateWord(word: string): ValidationResult {
  const cleanWord = word.toLowerCase().trim();
  
  // Check length
  if (cleanWord.length < MIN_WORD_LENGTH) {
    return { isValid: false, word: cleanWord, reason: "Too short" };
  }
  
  if (cleanWord.length > MAX_WORD_LENGTH) {
    return { isValid: false, word: cleanWord, reason: "Too long" };
  }
  
  // Check for valid characters (letters and hyphens only)
  if (!/^[a-z-]+$/.test(cleanWord)) {
    return { isValid: false, word: cleanWord, reason: "Invalid characters" };
  }
  
  // Check for invalid patterns
  for (const pattern of INVALID_PATTERNS) {
    if (pattern.test(cleanWord)) {
      return { isValid: false, word: cleanWord, reason: "Not a valid word" };
    }
  }
  
  // Must contain at least one vowel
  if (!/[aeiou]/.test(cleanWord)) {
    return { isValid: false, word: cleanWord, reason: "Not a valid word" };
  }
  
  return { isValid: true, word: cleanWord };
}

export function parseAndValidateWords(text: string): {
  valid: string[];
  invalid: ValidationResult[];
} {
  const words = text
    .toLowerCase()
    .split(/[\s,;\n]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
  
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: ValidationResult[] = [];
  
  for (const word of words) {
    // Skip duplicates
    if (seen.has(word)) continue;
    seen.add(word);
    
    const result = validateWord(word);
    if (result.isValid) {
      valid.push(result.word);
    } else {
      invalid.push(result);
    }
  }
  
  return { valid, invalid };
}
