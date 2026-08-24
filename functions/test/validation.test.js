const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Compiled JS after build
const { parseSymbol, parseInterval, parseLimit, parseQuery, parseCalendarRange, parseNewsCategory } = require('../lib/validation');

describe('proxy validation', () => {
  it('accepts valid symbols', () => {
    assert.equal(parseSymbol('AAPL'), 'AAPL');
    assert.equal(parseSymbol('EUR/USD'), 'EUR/USD');
  });

  it('rejects invalid symbols', () => {
    assert.throws(() => parseSymbol(''), /invalid_symbol/);
    assert.throws(() => parseSymbol('x'.repeat(40)), /invalid_symbol/);
  });

  it('validates intervals and limits', () => {
    assert.equal(parseInterval('1d'), '1d');
    assert.throws(() => parseInterval('2y'), /invalid_interval/);
    assert.equal(parseLimit(9999, 500), 500);
  });

  it('validates search queries', () => {
    assert.equal(parseQuery('nvda'), 'nvda');
    assert.throws(() => parseQuery(''), /invalid_query/);
  });

  it('allowlists news categories', () => {
    assert.equal(parseNewsCategory('technology'), 'technology');
    assert.equal(parseNewsCategory('not-a-category'), 'business');
    assert.equal(parseNewsCategory({ nested: true }), 'business');
  });

  it('rejects inverted or oversized calendar ranges', () => {
    const now = Date.parse('2026-08-24T12:00:00.000Z');
    assert.deepEqual(parseCalendarRange('2026-08-24', '2026-08-31', now), {
      from: '2026-08-24',
      to: '2026-08-31',
    });
    assert.throws(() => parseCalendarRange('2026-08-31', '2026-08-24', now), /invalid_calendar_range/);
    assert.throws(() => parseCalendarRange('2026-08-01', '2026-09-15', now), /invalid_calendar_range/);
    assert.throws(() => parseCalendarRange('2026-02-31', '2026-03-01', now), /invalid_calendar_range/);
  });
});
