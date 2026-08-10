import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { onCall, type CallableRequest } from 'firebase-functions/v2/https';

import {
  findServerCanonical,
  getServerInstrumentById,
  sanitizeInstrumentDto,
  type ServerInstrument,
} from './instruments-catalog';
import { consumeQuota } from './quota';
import { requireAppCheck, requireAuth, sanitizeVendorError } from './security';
import { parseQuery, parseSymbol } from './validation';
import { finnhubQuote, finnhubSearch } from './vendors';

const callableOpts = {
  enforceAppCheck: false,
  timeoutSeconds: 30,
  memory: '256MiB' as const,
};

const MARKET_TYPES = new Set(['stocks', 'forex', 'crypto', 'commodities', 'indices', 'options']);
const ASSET_CLASSES = new Set([
  'equity',
  'etf',
  'crypto',
  'forex',
  'commodity',
  'index',
  'option',
  'bond',
  'futures',
]);
const PROVIDERS = new Set([
  'finnhub',
  'alpha-vantage',
  'coingecko',
  'exchange-rate-api',
  'internal',
  'other',
]);

function invalidArg(message: string): never {
  throw new functions.https.HttpsError('invalid-argument', message);
}

function failedPrecondition(message: string): never {
  throw new functions.https.HttpsError('failed-precondition', message);
}

async function gate(request: CallableRequest, bucket: Parameters<typeof consumeQuota>[1]) {
  requireAppCheck(request);
  const uid = requireAuth(request);
  const quota = await consumeQuota(uid, bucket);
  return { uid, quota };
}

function mapFinnhubType(type: string): { marketType: string; assetClass: string } {
  const t = type.toLowerCase();
  if (t.includes('etp') || t.includes('etf')) {
    return { marketType: 'indices', assetClass: 'etf' };
  }
  return { marketType: 'stocks', assetClass: 'equity' };
}

async function hasUsableQuote(instrument: ServerInstrument): Promise<boolean> {
  if (instrument.marketType === 'crypto' || instrument.marketType === 'forex') {
    // Crypto/FX quotes are public on the client; server validates identity + shape.
    return true;
  }
  const quoteSymbol = instrument.providerSymbol || instrument.canonicalSymbol;
  const quote = await finnhubQuote(quoteSymbol.replace('^', ''));
  return Boolean(quote && quote.price > 0);
}

/**
 * Resolve a search query to sanitized instrument candidates (server-validated).
 */
export const resolveInstrument = onCall(callableOpts, async (request) => {
  const { quota } = await gate(request, 'market_search');
  let query: string;
  try {
    query = parseQuery(request.data?.query, 64);
  } catch {
    invalidArg('Invalid search query.');
  }

  try {
    const exact = findServerCanonical(query);
    const candidates: ReturnType<typeof sanitizeInstrumentDto>[] = [];

    if (exact) {
      candidates.push(sanitizeInstrumentDto(exact));
    }

    const remote = await finnhubSearch(query);
    for (const row of remote.slice(0, 12)) {
      try {
        parseSymbol(row.symbol);
      } catch {
        continue;
      }
      if (!row.description || row.description.length > 120) continue;
      const mapped = mapFinnhubType(row.type);
      const id = `${mapped.assetClass === 'etf' ? 'etf' : 'equity'}:${row.symbol}`;
      if (candidates.some((c) => c.id === id || c.canonicalSymbol === row.symbol)) continue;
      candidates.push({
        id,
        symbol: row.symbol,
        canonicalSymbol: row.symbol,
        name: row.description.slice(0, 120),
        marketType: mapped.marketType,
        assetClass: mapped.assetClass,
        currency: 'USD',
        exchange: row.type.slice(0, 40),
        provider: 'finnhub',
        providerSymbol: row.symbol,
      });
    }

    return {
      query,
      candidates,
      provider: 'finnhub' as const,
      quota,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    sanitizeVendorError(error);
  }
});

interface CreateHoldingPayload {
  instrumentId?: string;
  symbol?: string;
  canonicalSymbol?: string;
  name?: string;
  marketType?: string;
  assetClass?: string;
  currency?: string;
  exchange?: string;
  provider?: string;
  providerSymbol?: string;
  quantity?: number;
  averageCost?: number;
  currentPrice?: number;
  side?: string;
  notes?: string;
}

function validateCreatePayload(raw: CreateHoldingPayload) {
  const instrumentId = typeof raw.instrumentId === 'string' ? raw.instrumentId.trim() : '';
  const symbol = typeof raw.symbol === 'string' ? raw.symbol.trim() : '';
  const canonicalSymbol =
    typeof raw.canonicalSymbol === 'string' ? raw.canonicalSymbol.trim() : symbol;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const marketType = typeof raw.marketType === 'string' ? raw.marketType : '';
  const assetClass = typeof raw.assetClass === 'string' ? raw.assetClass : '';
  const currency =
    typeof raw.currency === 'string' && raw.currency.trim().length === 3
      ? raw.currency.trim().toUpperCase()
      : 'USD';
  const provider = typeof raw.provider === 'string' ? raw.provider : '';
  const providerSymbol =
    typeof raw.providerSymbol === 'string' ? raw.providerSymbol.trim() : canonicalSymbol;
  const quantity = Number(raw.quantity);
  const averageCost = Number(raw.averageCost);
  const currentPrice = Number(raw.currentPrice);
  const side = raw.side === 'short' ? 'short' : 'long';
  const notes = typeof raw.notes === 'string' ? raw.notes.slice(0, 2000) : undefined;
  const exchange = typeof raw.exchange === 'string' ? raw.exchange.slice(0, 40) : undefined;

  if (!instrumentId || instrumentId.length > 64) invalidArg('Invalid instrumentId.');
  try {
    parseSymbol(symbol);
    parseSymbol(canonicalSymbol);
    parseSymbol(providerSymbol);
  } catch {
    invalidArg('Invalid symbol.');
  }
  if (!name || name.length > 120) invalidArg('Invalid name.');
  if (!MARKET_TYPES.has(marketType)) invalidArg('Invalid marketType.');
  if (!ASSET_CLASSES.has(assetClass)) invalidArg('Invalid assetClass.');
  if (!PROVIDERS.has(provider)) invalidArg('Invalid provider.');
  if (!Number.isFinite(quantity) || quantity <= 0) invalidArg('Invalid quantity.');
  if (!Number.isFinite(averageCost) || averageCost < 0) invalidArg('Invalid averageCost.');
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    invalidArg('Invalid currentPrice — market data required.');
  }

  return {
    instrumentId,
    symbol,
    canonicalSymbol,
    name,
    marketType,
    assetClass,
    currency,
    exchange,
    provider,
    providerSymbol,
    quantity,
    averageCost,
    currentPrice,
    side,
    notes,
  };
}

/**
 * Create a portfolio holding after server-side instrument validation.
 * Admin write — clients cannot invent arbitrary holdings via Firestore rules.
 */
export const createPortfolioHolding = onCall(callableOpts, async (request) => {
  const { uid, quota } = await gate(request, 'market_search');
  const payload = validateCreatePayload((request.data ?? {}) as CreateHoldingPayload);

  try {
    const catalog = getServerInstrumentById(payload.instrumentId) ?? findServerCanonical(payload.canonicalSymbol);
    let trusted: ServerInstrument | null = catalog
      ? catalog
      : {
          id: payload.instrumentId,
          symbol: payload.symbol,
          canonicalSymbol: payload.canonicalSymbol,
          name: payload.name,
          marketType: payload.marketType,
          assetClass: payload.assetClass,
          currency: payload.currency,
          exchange: payload.exchange,
          provider: payload.provider,
          providerSymbol: payload.providerSymbol,
          aliases: [],
        };

    // Non-catalog equities must appear in Finnhub search results for this symbol.
    if (!catalog && (payload.marketType === 'stocks' || payload.marketType === 'indices')) {
      const remote = await finnhubSearch(payload.canonicalSymbol);
      const hit = remote.find(
        (r) => r.symbol.toUpperCase() === payload.canonicalSymbol.toUpperCase(),
      );
      if (!hit) {
        failedPrecondition('Instrument could not be verified with market data providers.');
      } else {
        trusted = {
          ...trusted,
          name: hit.description.slice(0, 120) || trusted.name,
          provider: 'finnhub',
          providerSymbol: hit.symbol,
        };
      }
    }

    if (!catalog && payload.marketType === 'crypto') {
      const knownCrypto = findServerCanonical(payload.canonicalSymbol);
      if (!knownCrypto) {
        failedPrecondition('Unsupported crypto instrument.');
      } else {
        trusted = knownCrypto;
      }
    }

    const quoteOk = await hasUsableQuote(trusted);
    if (!quoteOk) {
      failedPrecondition(
        'TradeInsight cannot currently provide reliable market data for this asset.',
      );
    }

    const db = admin.firestore();
    const holdingsRef = db.collection('users').doc(uid).collection('holdings');
    const existingSnap = await holdingsRef
      .where('instrumentId', '==', trusted.id)
      .limit(1)
      .get();
    if (!existingSnap.empty) {
      throw new functions.https.HttpsError(
        'already-exists',
        'You already have this asset in your portfolio.',
      );
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const doc = {
      instrumentId: trusted.id,
      symbol: trusted.symbol,
      canonicalSymbol: trusted.canonicalSymbol,
      name: trusted.name,
      marketType: trusted.marketType,
      assetClass: trusted.assetClass,
      quantity: payload.quantity,
      averageCost: payload.averageCost,
      currentPrice: payload.currentPrice,
      currency: trusted.currency,
      side: payload.side,
      notes: payload.notes ?? null,
      provider: trusted.provider,
      providerSymbol: trusted.providerSymbol,
      exchange: trusted.exchange ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await holdingsRef.add(doc);
    const written = await ref.get();
    const data = written.data() ?? doc;

    return {
      holding: {
        id: ref.id,
        ...data,
        createdAt:
          data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString(),
        updatedAt:
          data.updatedAt && typeof data.updatedAt.toDate === 'function'
            ? data.updatedAt.toDate().toISOString()
            : new Date().toISOString(),
      },
      quota,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    sanitizeVendorError(error);
  }
});
