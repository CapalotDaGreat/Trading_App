import { redact } from '../redaction';

describe('observability redaction', () => {
  it('removes sensitive fields and inline credentials recursively', () => {
    const value = redact({
      email: 'trader@example.com',
      nested: {
        authorization: 'Bearer secret-token',
        note: 'contact trader@example.com',
        url: 'https://example.test/path?token=secret&safe=yes',
      },
    });

    expect(value).toEqual({
      email: '[REDACTED]',
      nested: {
        authorization: '[REDACTED]',
        note: 'contact [REDACTED_EMAIL]',
        url: 'https://example.test/path?token=[REDACTED]&safe=yes',
      },
    });
  });

  it('does not pass journal, AI, or portfolio payloads through as-is', () => {
    expect(
      redact({
        journal: 'sold everything after CPI',
        prompt: 'should I buy EURUSD',
        holdings: [{ quantity: 10, notional: 5000 }],
        apiKey: 'sk-test',
      }),
    ).toEqual({
      journal: '[REDACTED]',
      prompt: '[REDACTED]',
      holdings: '[REDACTED]',
      apiKey: '[REDACTED]',
    });
  });

  it('handles cycles without leaking or throwing', () => {
    const value: Record<string, unknown> = {};
    value.self = value;
    expect(redact(value)).toEqual({ self: '[CIRCULAR]' });
  });
});
