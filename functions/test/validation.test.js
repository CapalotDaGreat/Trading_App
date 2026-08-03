const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Compiled JS after build
const { parseSymbol, parseInterval, parseLimit, parseQuery } = require('../lib/validation');

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
});
