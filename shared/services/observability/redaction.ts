const SENSITIVE_KEY =
  /authorization|cookie|password|passcode|secret|token|email|phone|address|displayname|firstname|lastname|idtoken|credential|dsn/i;
const URL_CREDENTIALS = /([?&](?:token|key|secret|code|email)=)[^&\s]+/gi;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const MAX_DEPTH = 5;
const MAX_STRING_LENGTH = 500;

function redactString(value: string): string {
  return value
    .replace(BEARER, 'Bearer [REDACTED]')
    .replace(EMAIL, '[REDACTED_EMAIL]')
    .replace(URL_CREDENTIALS, '$1[REDACTED]')
    .slice(0, MAX_STRING_LENGTH);
}

export function redact(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (typeof value === 'string') return redactString(value);
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[TRUNCATED]';
  if (seen.has(value)) return '[CIRCULAR]';
  seen.add(value);

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => redact(item, depth + 1, seen));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, 50)
      .map(([key, item]) => [
        key,
        SENSITIVE_KEY.test(key) ? '[REDACTED]' : redact(item, depth + 1, seen),
      ]),
  );
}

export function redactContext(
  context: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  return context ? (redact(context) as Record<string, unknown>) : undefined;
}
