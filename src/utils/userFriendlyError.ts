/**
 * Map raw API / network / DB / server errors to short user-facing EN or AR copy.
 * Never surface SQL, stack traces, artisan commands, or HTTP jargon in the UI.
 */

export type FriendlyLocale = 'ar' | 'en';

type MsgPair = { en: string; ar: string };

const M: Record<string, MsgPair> = {
  network: {
    en: 'Unable to connect. Check your internet and try again.',
    ar: 'تعذر الاتصال. تحقق من الإنترنت ثم حاول مرة أخرى.',
  },
  timeout: {
    en: 'The request took too long. Please try again.',
    ar: 'استغرق الطلب وقتاً طويلاً. يرجى المحاولة مرة أخرى.',
  },
  unauthorized: {
    en: 'Your session expired. Please sign in again.',
    ar: 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
  },
  forbidden: {
    en: 'You do not have permission for this action.',
    ar: 'ليس لديك صلاحية لهذا الإجراء.',
  },
  notFound: {
    en: 'The requested item was not found.',
    ar: 'العنصر المطلوب غير موجود.',
  },
  validation: {
    en: 'Please check the form and try again.',
    ar: 'يرجى التحقق من البيانات والمحاولة مرة أخرى.',
  },
  rateLimit: {
    en: 'Too many requests. Please wait a moment and try again.',
    ar: 'طلبات كثيرة جداً. انتظر قليلاً ثم حاول مرة أخرى.',
  },
  conflict: {
    en: 'This change conflicts with existing data. Refresh and try again.',
    ar: 'هذا التغيير يتعارض مع بيانات موجودة. حدّث الصفحة ثم حاول مرة أخرى.',
  },
  server: {
    en: 'Something went wrong on our side. Please try again shortly.',
    ar: 'حدث خطأ من طرفنا. يرجى المحاولة بعد قليل.',
  },
  database: {
    en: 'We could not save or load data right now. Please try again.',
    ar: 'تعذر حفظ أو تحميل البيانات حالياً. يرجى المحاولة مرة أخرى.',
  },
  maintenance: {
    en: 'Service is temporarily unavailable. Please try again later.',
    ar: 'الخدمة غير متاحة مؤقتاً. يرجى المحاولة لاحقاً.',
  },
  session: {
    en: 'Sign in is required to continue.',
    ar: 'يلزم تسجيل الدخول للمتابعة.',
  },
  empty: {
    en: 'No records found.',
    ar: 'لا توجد سجلات.',
  },
  offline: {
    en: 'Connection to the server is unavailable. Working in limited mode.',
    ar: 'الاتصال بالخادم غير متاح. العمل في وضع محدود.',
  },
  upload: {
    en: 'Upload failed. Check the file and try again.',
    ar: 'فشل الرفع. تحقق من الملف ثم حاول مرة أخرى.',
  },
  unknown: {
    en: 'Something went wrong. Please try again.',
    ar: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
  },
};

export function resolveFriendlyLocale(
  locale?: FriendlyLocale | string | boolean | null,
): FriendlyLocale {
  if (locale === true || locale === 'ar') return 'ar';
  if (locale === false || locale === 'en') return 'en';
  if (typeof document !== 'undefined') {
    const lang = document.documentElement.getAttribute('lang') || '';
    const dir = document.documentElement.getAttribute('dir') || '';
    if (lang.startsWith('ar') || dir === 'rtl') return 'ar';
  }
  return 'en';
}

function pick(key: keyof typeof M, locale: FriendlyLocale): string {
  return M[key][locale];
}

function extractRaw(input: unknown): string {
  if (input == null) return '';
  if (typeof input === 'string') return input.trim();
  if (input instanceof Error) return (input.message || '').trim();
  if (typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message.trim();
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error.trim();
    try {
      return JSON.stringify(input);
    } catch {
      return String(input);
    }
  }
  return String(input).trim();
}

/** True when the string looks like a stack / SQL / HTTP dump merchants must never see. */
export function isTechnicalErrorMessage(raw: string): boolean {
  if (!raw) return true;
  const s = raw.toLowerCase();
  if (raw.length > 280) return true;
  if (raw.includes('\n') && (s.includes('at ') || s.includes('stack'))) return true;

  const technical = [
    'sqlstate',
    'sql syntax',
    'mysql',
    'mariadb',
    'pdoexception',
    'queryexception',
    'integrity constraint',
    'duplicate entry',
    'econnrefused',
    'econnreset',
    'enotfound',
    'etimedout',
    'eai_again',
    'failed to fetch',
    'networkerror',
    'load failed',
    'net::err',
    'cors',
    'cross-origin',
    'api 4',
    'api 5',
    'http 4',
    'http 5',
    'internal server error',
    'bad gateway',
    'service unavailable',
    'gateway timeout',
    '<!doctype',
    '<html',
    'whoops',
    'exception',
    'traceback',
    'artisan',
    'npm run',
    'php ',
    ' Fatal ',
    'undefined index',
    'undefined variable',
    'call to undefined',
    'class "',
    'syntax error',
    'json.parse',
    'unexpected token',
    'non-json',
    'csrf',
    'token mismatch',
    'Illuminate\\',
    'App\\',
    '/vendor/',
    'hostinger',
    'srv1422',
    'u920689430',
    'resilient fallback',
    'mock/guest mode',
    'no active backend',
  ];

  return technical.some((t) => s.includes(t.toLowerCase()));
}

/** Keep short, clean validation / business messages from the API. */
function isSafeUserMessage(raw: string): boolean {
  if (!raw || isTechnicalErrorMessage(raw)) return false;
  if (raw.length > 180) return false;
  // Prefer messages that look like product copy (Arabic or plain English sentences).
  const hasArabic = /[\u0600-\u06FF]/.test(raw);
  if (hasArabic) return true;
  // Reject bare status codes / path dumps
  if (/^API\s+\d{3}/i.test(raw)) return false;
  if (/^Error:\s/i.test(raw) && raw.length > 100) return false;
  return true;
}

function classifyByStatus(status: number, locale: FriendlyLocale): string | null {
  if (status === 401) return pick('unauthorized', locale);
  if (status === 403) return pick('forbidden', locale);
  if (status === 404) return pick('notFound', locale);
  if (status === 408 || status === 504) return pick('timeout', locale);
  if (status === 409) return pick('conflict', locale);
  if (status === 422) return pick('validation', locale);
  if (status === 429) return pick('rateLimit', locale);
  if (status === 503) return pick('maintenance', locale);
  if (status >= 500) return pick('server', locale);
  if (status >= 400) return pick('validation', locale);
  return null;
}

function classifyByText(raw: string, locale: FriendlyLocale): string | null {
  const s = raw.toLowerCase();

  if (
    s.includes('failed to fetch') ||
    s.includes('network') ||
    s.includes('econnrefused') ||
    s.includes('econnreset') ||
    s.includes('enotfound') ||
    s.includes('load failed') ||
    s.includes('net::err') ||
    s.includes('cors') ||
    s.includes('offline') ||
    s.includes('api unavailable') ||
    s.includes('resilient fallback')
  ) {
    return pick(s.includes('fallback') || s.includes('unavailable') ? 'offline' : 'network', locale);
  }

  if (s.includes('timeout') || s.includes('etimedout') || s.includes('aborted')) {
    return pick('timeout', locale);
  }

  if (
    s.includes('sqlstate') ||
    s.includes('mysql') ||
    s.includes('mariadb') ||
    s.includes('pdo') ||
    s.includes('queryexception') ||
    s.includes('database') ||
    s.includes('db:') ||
    s.includes('no stores in database') ||
    s.includes('integrity constraint') ||
    s.includes('duplicate entry')
  ) {
    return pick('database', locale);
  }

  if (
    s.includes('unauthorized') ||
    s.includes('unauthenticated') ||
    s.includes('session expired') ||
    s.includes('token expired') ||
    s.includes('invalid token')
  ) {
    return pick('unauthorized', locale);
  }

  if (
    s.includes('forbidden') ||
    s.includes('access denied') ||
    s.includes('not allowed') ||
    s.includes('permission') ||
    s.includes('partner role')
  ) {
    return pick('forbidden', locale);
  }

  if (s.includes('not found') || s.includes('404')) {
    return pick('notFound', locale);
  }

  if (s.includes('too many') || s.includes('rate limit') || s.includes('429')) {
    return pick('rateLimit', locale);
  }

  if (s.includes('validation') || s.includes('given data was invalid') || s.includes('422')) {
    return pick('validation', locale);
  }

  if (
    s.includes('upload') &&
    (s.includes('fail') || s.includes('error') || s.includes('invalid'))
  ) {
    return pick('upload', locale);
  }

  if (
    s.includes('no active backend') ||
    s.includes('mock/guest') ||
    s.includes('sign in') ||
    s.includes('login required')
  ) {
    return pick('session', locale);
  }

  if (
    s.includes('503') ||
    s.includes('maintenance') ||
    s.includes('service unavailable')
  ) {
    return pick('maintenance', locale);
  }

  if (
    s.includes('500') ||
    s.includes('502') ||
    s.includes('504') ||
    s.includes('server') ||
    s.includes('internal') ||
    s.includes('non-json') ||
    s.includes('whoops') ||
    s.includes('exception')
  ) {
    return pick('server', locale);
  }

  return null;
}

/**
 * Convert any thrown value / API message into a short bilingual-safe UI string.
 */
export function toUserFriendlyError(
  input: unknown,
  locale?: FriendlyLocale | string | boolean | null,
): string {
  const loc = resolveFriendlyLocale(locale);
  const raw = extractRaw(input);

  if (!raw) return pick('unknown', loc);

  // Explicit HTTP status if caller passes { status }
  if (input && typeof input === 'object' && 'status' in (input as object)) {
    const status = Number((input as { status?: unknown }).status);
    if (Number.isFinite(status) && status >= 400) {
      const byStatus = classifyByStatus(status, loc);
      if (byStatus) {
        // Prefer clean validation field text when present
        if (status === 422 && isSafeUserMessage(raw) && !/^API\s+/i.test(raw)) {
          return raw;
        }
        return byStatus;
      }
    }
  }

  // Technical dumps (SQL, Failed to fetch, HTML, artisan…) → always remap.
  if (isTechnicalErrorMessage(raw)) {
    return classifyByText(raw, loc) || pick('unknown', loc);
  }

  // Soft remap only for clear auth / permission / offline phrases (keep other UI copy).
  const softKeys = classifyByText(raw, loc);
  if (
    softKeys &&
    (softKeys === pick('unauthorized', loc) ||
      softKeys === pick('forbidden', loc) ||
      softKeys === pick('network', loc) ||
      softKeys === pick('offline', loc) ||
      softKeys === pick('database', loc) ||
      softKeys === pick('session', loc) ||
      softKeys === pick('timeout', loc) ||
      softKeys === pick('rateLimit', loc) ||
      softKeys === pick('maintenance', loc))
  ) {
    return softKeys;
  }

  if (isSafeUserMessage(raw)) return raw;

  return softKeys || pick('unknown', loc);
}

/** Convenience for catch blocks: friendly message with optional action fallback key. */
export function friendlyCatchMessage(
  err: unknown,
  fallback?: MsgPair | string,
  locale?: FriendlyLocale | string | boolean | null,
): string {
  const loc = resolveFriendlyLocale(locale);
  const mapped = toUserFriendlyError(err, loc);
  if (mapped !== pick('unknown', loc)) return mapped;
  if (!fallback) return mapped;
  if (typeof fallback === 'string') return toUserFriendlyError(fallback, loc);
  return fallback[loc];
}

/** Map HTTP status (+ optional JSON body message) for apiFetch. */
export function friendlyHttpError(
  status: number,
  statusText: string,
  bodyMessage?: string | null,
  locale?: FriendlyLocale | string | boolean | null,
): string {
  const loc = resolveFriendlyLocale(locale);
  if (status === 422 && bodyMessage && isSafeUserMessage(bodyMessage)) {
    return bodyMessage;
  }
  const byStatus = classifyByStatus(status, loc);
  if (byStatus) return byStatus;
  if (bodyMessage && isSafeUserMessage(bodyMessage)) return bodyMessage;
  if (statusText) {
    const fromText = classifyByText(`${status} ${statusText}`, loc);
    if (fromText) return fromText;
  }
  return pick('unknown', loc);
}
