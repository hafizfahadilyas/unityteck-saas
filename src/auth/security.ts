/**
 * Comprehensive Enterprise Security & Anti-Hacking Layer
 * Unityteck Multi-Store E-Commerce Cloud (Saudi Arabia 100-Stores SaaS)
 *
 * Implements defenses against:
 * - SQL Injection (SQLi)
 * - Cross-Site Scripting (XSS)
 * - NoSQL / Mongo / LDAP Injection
 * - Command & Shell Injection
 * - Path Traversal
 * - Brute-Force & Credential Stuffing (Rate Limiting)
 * - Saudi National Cybersecurity Authority (NCA ECC) compliant password evaluation
 */

export interface SecurityCheckResult {
  isSecure: boolean;
  threatsDetected: string[];
  sanitizedEmail: string;
  messageAr?: string;
  messageEn?: string;
}

export interface RateLimitStatus {
  isLocked: boolean;
  remainingSeconds: number;
  attempts: number;
  maxAttempts: number;
}

export interface PasswordStrengthResult {
  score: number; // 0 - 4
  level: 'weak' | 'fair' | 'good' | 'strong';
  labelAr: string;
  labelEn: string;
  color: string;
  suggestionsAr: string[];
  suggestionsEn: string[];
}

// ---------------------------------------------------------------------------
// 1. SQL Injection & Malicious Pattern Signatures
// ---------------------------------------------------------------------------
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|UNION|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b)/i,
  /(--|#|\/\*|\*\/|;)/, // SQL comments and chained queries
  /('|\b)(\s*OR\s*|\s*AND\s*).*(=|<|>|LIKE|IN)/i, // OR '1'='1', AND 1=1
  /(\bINFORMATION_SCHEMA\b|\bSYS\.TABLES\b|\bPG_SLEEP\b|\bBENCHMARK\b|\bWAITFOR\s+DELAY\b)/i,
  /(\bSLEEP\s*\(\s*\d+\s*\)|\bBENCHMARK\s*\(\s*\d+)/i,
  /(0x[0-9a-fA-F]+)/, // Hexadecimal encoded payloads
  /(\bCHAR\s*\(|\bCHR\s*\(|\bCONCAT\s*\()/i,
  /(\bXP_CMDSHELL\b|\bSP_EXECUTESQL\b)/i,
];

const XSS_PATTERNS = [
  /<[^>]*script/i,
  /<[^>]*iframe/i,
  /<[^>]*style/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
  /on\w+\s*=/i, // onload=, onerror=, onclick=
  /eval\s*\(/i,
  /document\.cookie/i,
  /window\.location/i,
];

const NOSQL_PATTERNS = [
  /(\$where|\$gt|\$gte|\$lt|\$lte|\$ne|\$in|\$nin|\$regex)/i,
];

const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$><]/,
  /(\b(cat|ls|dir|rm|mkdir|wget|curl|chmod|bash|sh|powershell|cmd\.exe)\b)/i,
];

// RFC 5322 Compliant Email Regex (sanitized safe subset)
const SAFE_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
// Safe username pattern: alphanumeric, dot, underscore, dash, between 2 and 60 chars
const SAFE_USERNAME_REGEX = /^[a-zA-Z0-9._-]{2,60}$/;

/**
 * Validates authentication inputs against SQLi, XSS, and exploit payloads.
 */
export function validateAuthInput(email: string, password?: string): SecurityCheckResult {
  const threats: string[] = [];
  const rawEmail = (email || '').trim();
  const rawPassword = password || '';

  // 1. Check Email for SQL Injection
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(rawEmail)) {
      threats.push('SQL_INJECTION_EMAIL');
      break;
    }
  }

  // 2. Check Password for high-risk SQLi strings (escaped/unescaped)
  if (
    /('|\b)\s*OR\s+['"\d\w]+\s*=\s*['"\d\w]+/i.test(rawPassword) ||
    /(\bUNION\s+SELECT\b|\bDROP\s+TABLE\b|\bXP_CMDSHELL\b)/i.test(rawPassword)
  ) {
    threats.push('SQL_INJECTION_PASSWORD');
  }

  // 3. Check for XSS
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(rawEmail) || pattern.test(rawPassword)) {
      threats.push('XSS_PAYLOAD_DETECTED');
      break;
    }
  }

  // 4. Check for NoSQL Injection
  for (const pattern of NOSQL_PATTERNS) {
    if (pattern.test(rawEmail)) {
      threats.push('NOSQL_INJECTION_DETECTED');
      break;
    }
  }

  // 5. Check for Shell / Command Injection in email
  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(rawEmail)) {
      threats.push('COMMAND_INJECTION_DETECTED');
      break;
    }
  }

  // 6. Format Verification: must be either a valid email format OR a safe username format
  if (rawEmail && !SAFE_EMAIL_REGEX.test(rawEmail) && !SAFE_USERNAME_REGEX.test(rawEmail)) {
    threats.push('MALFORMED_IDENTIFIER_FORMAT');
  }

  const isSecure = threats.length === 0;

  if (!isSecure) {
    auditSecurityIncident('AUTH_ATTACK_BLOCKED', {
      email: maskEmail(rawEmail),
      threats,
      timestamp: new Date().toISOString(),
    });

    return {
      isSecure: false,
      threatsDetected: threats,
      sanitizedEmail: sanitizeText(rawEmail),
      messageAr:
        'تم رفض المدخلات لأسباب أمنية: تم رصد محاولة غير مصرح بها أو مدخلات مشبوهة (حماية ضد الاختراق).',
      messageEn:
        'Input rejected for security: Potential malicious payload or SQL injection pattern detected.',
    };
  }

  return {
    isSecure: true,
    threatsDetected: [],
    sanitizedEmail: sanitizeText(rawEmail).toLowerCase(),
  };
}

// ---------------------------------------------------------------------------
// 2. Anti-Brute-Force & Rate Limiting System
// ---------------------------------------------------------------------------
const RATE_LIMIT_PREFIX = 'unityteck_sec_ratelimit_';
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60; // 1 minute lockout after 5 failed attempts

interface AttemptRecord {
  attempts: number;
  lockedUntil: number | null;
  lastAttemptAt: number;
}

function getAttemptKey(identifier: string): string {
  const clean = identifier.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
  return `${RATE_LIMIT_PREFIX}${clean}`;
}

export function getRateLimitStatus(identifier: string): RateLimitStatus {
  if (!identifier) {
    return { isLocked: false, remainingSeconds: 0, attempts: 0, maxAttempts: MAX_ATTEMPTS };
  }

  try {
    const key = getAttemptKey(identifier);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { isLocked: false, remainingSeconds: 0, attempts: 0, maxAttempts: MAX_ATTEMPTS };
    }

    const record: AttemptRecord = JSON.parse(raw);
    const now = Date.now();

    // Check if lockout has expired
    if (record.lockedUntil) {
      if (now < record.lockedUntil) {
        const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
        return {
          isLocked: true,
          remainingSeconds,
          attempts: record.attempts,
          maxAttempts: MAX_ATTEMPTS,
        };
      } else {
        // Lock expired, reset attempts
        resetRateLimit(identifier);
        return { isLocked: false, remainingSeconds: 0, attempts: 0, maxAttempts: MAX_ATTEMPTS };
      }
    }

    // Reset attempts if no attempt was made in the last 15 minutes
    if (now - record.lastAttemptAt > 15 * 60 * 1000) {
      resetRateLimit(identifier);
      return { isLocked: false, remainingSeconds: 0, attempts: 0, maxAttempts: MAX_ATTEMPTS };
    }

    return {
      isLocked: false,
      remainingSeconds: 0,
      attempts: record.attempts,
      maxAttempts: MAX_ATTEMPTS,
    };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attempts: 0, maxAttempts: MAX_ATTEMPTS };
  }
}

export function recordFailedAttempt(identifier: string): RateLimitStatus {
  if (!identifier) {
    return { isLocked: false, remainingSeconds: 0, attempts: 1, maxAttempts: MAX_ATTEMPTS };
  }

  try {
    const key = getAttemptKey(identifier);
    const current = getRateLimitStatus(identifier);
    const nextAttempts = current.attempts + 1;
    const now = Date.now();

    let lockedUntil: number | null = null;
    let isLocked = false;
    let remainingSeconds = 0;

    if (nextAttempts >= MAX_ATTEMPTS) {
      isLocked = true;
      lockedUntil = now + LOCKOUT_SECONDS * 1000;
      remainingSeconds = LOCKOUT_SECONDS;

      auditSecurityIncident('ACCOUNT_LOCKED_BRUTE_FORCE', {
        identifier: maskEmail(identifier),
        attempts: nextAttempts,
        lockedForSeconds: LOCKOUT_SECONDS,
      });
    }

    const record: AttemptRecord = {
      attempts: nextAttempts,
      lockedUntil,
      lastAttemptAt: now,
    };

    localStorage.setItem(key, JSON.stringify(record));

    return {
      isLocked,
      remainingSeconds,
      attempts: nextAttempts,
      maxAttempts: MAX_ATTEMPTS,
    };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attempts: 1, maxAttempts: MAX_ATTEMPTS };
  }
}

export function resetRateLimit(identifier: string): void {
  if (!identifier) return;
  try {
    localStorage.removeItem(getAttemptKey(identifier));
  } catch {}
}

// ---------------------------------------------------------------------------
// 3. Password Strength & Saudi Cyber Security Guidance
// ---------------------------------------------------------------------------
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      level: 'weak',
      labelAr: 'فارغة',
      labelEn: 'Empty',
      color: '#94A3B8',
      suggestionsAr: ['أدخل كلمة مرور قوية'],
      suggestionsEn: ['Enter a strong password'],
    };
  }

  let score = 0;
  const suggestionsAr: string[] = [];
  const suggestionsEn: string[] = [];

  if (password.length >= 8) score++;
  else {
    suggestionsAr.push('يجب أن تحتوي على 8 خانات على الأقل');
    suggestionsEn.push('At least 8 characters required');
  }

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  else {
    suggestionsAr.push('اجمع بين الحروف الكبيرة والصغيرة');
    suggestionsEn.push('Mix uppercase and lowercase letters');
  }

  if (/\d/.test(password)) score++;
  else {
    suggestionsAr.push('أضف رقماً واحداً على الأقل');
    suggestionsEn.push('Include at least one number');
  }

  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;
  else {
    suggestionsAr.push('أضف رمزاً خاصاً (مثل: @, #, $, !)');
    suggestionsEn.push('Include a special symbol (@, #, $, !)');
  }

  if (score <= 1) {
    return {
      score,
      level: 'weak',
      labelAr: 'ضعيفة',
      labelEn: 'Weak',
      color: '#EF4444',
      suggestionsAr,
      suggestionsEn,
    };
  }

  if (score === 2) {
    return {
      score,
      level: 'fair',
      labelAr: 'متوسطة',
      labelEn: 'Fair',
      color: '#F59E0B',
      suggestionsAr,
      suggestionsEn,
    };
  }

  if (score === 3) {
    return {
      score,
      level: 'good',
      labelAr: 'جيدة',
      labelEn: 'Good',
      color: '#3B82F6',
      suggestionsAr,
      suggestionsEn,
    };
  }

  return {
    score: 4,
    level: 'strong',
    labelAr: 'قوية ومحمية',
    labelEn: 'Strong & Secure',
    color: '#10B981',
    suggestionsAr: ['كلمة المرور متوافقة مع معايير الأمن السيبراني'],
    suggestionsEn: ['Meets cybersecurity compliance standards'],
  };
}

// ---------------------------------------------------------------------------
// 4. Input Sanitization & Masking Utilities
// ---------------------------------------------------------------------------
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // strip HTML brackets
    .replace(/javascript:/gi, '')
    .trim();
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

// ---------------------------------------------------------------------------
// 5. Security Incident Logging
// ---------------------------------------------------------------------------
const INCIDENT_LOGS_KEY = 'unityteck_security_audit_logs';

export function auditSecurityIncident(type: string, details: Record<string, unknown>): void {
  try {
    const raw = localStorage.getItem(INCIDENT_LOGS_KEY);
    const logs = raw ? JSON.parse(raw) : [];
    logs.unshift({
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      details,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    });
    // Keep max 50 recent audit records
    localStorage.setItem(INCIDENT_LOGS_KEY, JSON.stringify(logs.slice(0, 50)));
  } catch {
    // ignore logging failures
  }
}
