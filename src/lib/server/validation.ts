// Server-side input validation utilities
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: string;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  sanitize?: boolean;
}

/**
 * Validate and sanitize email address
 */
export function validateEmail(
  email: string,
  rules: ValidationRule = {}
): ValidationResult {
  const errors: string[] = [];
  let sanitized = email.trim().toLowerCase();

  // Required check
  if (rules.required !== false && !sanitized) {
    errors.push('Email is required');
    return { valid: false, errors };
  }

  if (sanitized) {
    // Length checks
    if (rules.maxLength && sanitized.length > rules.maxLength) {
      errors.push(`Email must be no more than ${rules.maxLength} characters`);
    }

    // RFC 5321 limit
    if (sanitized.length > 254) {
      errors.push('Email is too long');
    }

    // Format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      errors.push('Please enter a valid email address');
    }

    // Additional security checks
    if (sanitized.includes('..') || sanitized.includes('--')) {
      errors.push('Email contains invalid characters');
    }

    // Domain validation
    const domain = sanitized.split('@')[1];
    if (domain && domain.length > 253) {
      errors.push('Email domain is too long');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: rules.sanitize !== false ? sanitized : undefined,
  };
}

/**
 * Validate and sanitize password
 */
export function validatePassword(
  password: string,
  rules: ValidationRule = {}
): ValidationResult {
  const errors: string[] = [];
  let sanitized = password;

  // Required check
  if (rules.required !== false && !sanitized) {
    errors.push('Password is required');
    return { valid: false, errors };
  }

  if (sanitized) {
    // Length checks
    if (rules.minLength && sanitized.length < rules.minLength) {
      errors.push(
        `Password must be at least ${rules.minLength} characters long`
      );
    } else if (sanitized.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (rules.maxLength && sanitized.length > rules.maxLength) {
      errors.push(
        `Password must be no more than ${rules.maxLength} characters`
      );
    }

    // Complexity requirements
    if (!/[A-Z]/.test(sanitized)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(sanitized)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(sanitized)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(sanitized)) {
      errors.push('Password must contain at least one special character');
    }

    // Common weak passwords check
    const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (weakPasswords.includes(sanitized.toLowerCase())) {
      errors.push('Password is too common, please choose a stronger password');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: rules.sanitize !== false ? sanitized : undefined,
  };
}

/**
 * Validate and sanitize general text input
 */
export function validateText(
  text: string,
  rules: ValidationRule = {}
): ValidationResult {
  const errors: string[] = [];
  let sanitized = text.trim();

  // Required check
  if (rules.required !== false && !sanitized) {
    errors.push('This field is required');
    return { valid: false, errors };
  }

  if (sanitized) {
    // Length checks
    if (rules.minLength && sanitized.length < rules.minLength) {
      errors.push(`Must be at least ${rules.minLength} characters long`);
    }

    if (rules.maxLength && sanitized.length > rules.maxLength) {
      errors.push(`Must be no more than ${rules.maxLength} characters`);
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(sanitized)) {
      errors.push('Invalid format');
    }

    // Custom validation
    if (rules.custom && !rules.custom(sanitized)) {
      errors.push('Invalid value');
    }

    // XSS prevention (basic)
    if (rules.sanitize !== false) {
      sanitized = sanitized.replace(/[<>]/g, '');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: rules.sanitize !== false ? sanitized : undefined,
  };
}

/**
 * Validate form data object
 */
export function validateFormData(
  data: Record<string, string>,
  rules: Record<string, ValidationRule>
): {
  valid: boolean;
  errors: Record<string, string[]>;
  sanitized: Record<string, string>;
} {
  const errors: Record<string, string[]> = {};
  const sanitized: Record<string, string> = {};
  let isValid = true;

  for (const [field, value] of Object.entries(data)) {
    const fieldRules = rules[field];
    if (!fieldRules) continue;

    let result: ValidationResult;

    switch (field) {
      case 'email':
        result = validateEmail(value, fieldRules);
        break;
      case 'password':
        result = validatePassword(value, fieldRules);
        break;
      default:
        result = validateText(value, fieldRules);
    }

    if (!result.valid) {
      errors[field] = result.errors;
      isValid = false;
    }

    if (result.sanitized !== undefined) {
      sanitized[field] = result.sanitized;
    }
  }

  return { valid: isValid, errors, sanitized };
}

/**
 * Sanitize HTML content (basic XSS prevention)
 */
export function sanitizeHTML(html: string): string {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate URL
 */
export function validateURL(
  url: string,
  rules: ValidationRule = {}
): ValidationResult {
  const errors: string[] = [];
  let sanitized = url.trim();

  // Required check
  if (rules.required !== false && !sanitized) {
    errors.push('URL is required');
    return { valid: false, errors };
  }

  if (sanitized) {
    try {
      const urlObj = new URL(sanitized);

      // Protocol validation
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push('URL must use HTTP or HTTPS protocol');
      }

      // Length check
      if (rules.maxLength && sanitized.length > rules.maxLength) {
        errors.push(`URL must be no more than ${rules.maxLength} characters`);
      }
    } catch {
      errors.push('Please enter a valid URL');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: rules.sanitize !== false ? sanitized : undefined,
  };
}
