/**
 * Password strength validation utility
 * Based on Supabase Auth password requirements:
 * - Minimum 10 characters (minimum 6, recommended 8 or more)
 * - Must include: lowercase, uppercase, digits, and symbols (at least one of each)
 */

export interface PasswordRequirements {
  hasMinLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasDigit: boolean;
  hasSymbol: boolean;
}

export interface PasswordStrength {
  score: number; // 0-4 (number of requirements met)
  level: 'weak' | 'medium' | 'strong';
  requirements: PasswordRequirements;
  isValid: boolean; // All requirements met
}

const MIN_LENGTH = 10;
const MIN_LENGTH_MIN = 6;
const RECOMMENDED_LENGTH = 8;

export function checkPasswordRequirements(password: string): PasswordRequirements {
  return {
    hasMinLength: password.length >= MIN_LENGTH,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSymbol: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      level: 'weak',
      requirements: {
        hasMinLength: false,
        hasLowercase: false,
        hasUppercase: false,
        hasDigit: false,
        hasSymbol: false,
      },
      isValid: false,
    };
  }

  const requirements = checkPasswordRequirements(password);
  const score = Object.values(requirements).filter(Boolean).length;

  let level: 'weak' | 'medium' | 'strong';
  if (score <= 2) {
    level = 'weak';
  } else if (score <= 3) {
    level = 'medium';
  } else {
    level = 'strong';
  }

  return {
    score,
    level,
    requirements,
    isValid: Object.values(requirements).every(Boolean),
  };
}

export function getPasswordLengthStatus(password: string): {
  current: number;
  min: number;
  recommended: number;
  required: number;
  meetsMin: boolean;
  meetsRecommended: boolean;
  meetsRequired: boolean;
} {
  return {
    current: password.length,
    min: MIN_LENGTH_MIN,
    recommended: RECOMMENDED_LENGTH,
    required: MIN_LENGTH,
    meetsMin: password.length >= MIN_LENGTH_MIN,
    meetsRecommended: password.length >= RECOMMENDED_LENGTH,
    meetsRequired: password.length >= MIN_LENGTH,
  };
}
