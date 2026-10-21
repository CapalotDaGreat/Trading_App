import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { useJournal } from '@/features/journal/hooks/useJournal';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { FilterChip } from '@/shared/components/ui/FilterChip';
import { Input } from '@/shared/components/ui/Input';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';
import { formatPrice } from '@/shared/utils/format';

import { IntradayChart } from '../components/IntradayChart';
import { netSessionPnl, transitionOrder } from '../services/execution.service';
import {
  createReplay,
  isReplayComplete,
  replayProgress,
  setPlaying,
  setSpeed,
  stepBackward,
  visibleCandles,
} from '../services/replay-engine.service';
import { evaluateRiskGate } from '../services/risk-controls.service';
import {
  advanceSession,
  createTradingDaySession,
  recordDecision,
  reviewSession,
  submitSessionOrder,
  tradedSeries,
  type TradingDaySession,
} from '../services/trading-day.service';
import { useIntradaySessionStore } from '../stores/intraday-session.store';
import type { IntradayInterval, IntradayOrder } from '../types/intraday.types';
import { INTRADAY_INTERVAL_MINUTES } from '../types/intraday.types';

export type IntradayMode = 'replay' | 'day' | 'scalp';

const MODE_COPY: Record<IntradayMode, { title: string; subtitle: string }> = {
  replay: {
    title: 'Intraday Replay',
    subtitle: 'Synthetic session, candle by candle. The future stays hidden until you commit.',
  },
  day: {
    title: 'Trading Day Simulator',
    subtitle: 'One coherent simulated day. Finishing flat by plan is a successful session.',
  },
  scalp: {
    title: 'Scalping Practice',
    subtitle:
      'Short, spread-aware sessions. Friction is charged honestly — watch gross versus net.',
  },
};

export function IntradaySessionScreen({ mode }: { mode: IntradayMode }) {
  const router = useRouter();
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const activeSession = useIntradaySessionStore((s) => s.activeSession);
  const activeMode = useIntradaySessionStore((s) => s.activeMode);
  const saveActive = useIntradaySessionStore((s) => s.saveActive);
  const completeSession = useIntradaySessionStore((s) => s.completeSession);
  const clearActive = useIntradaySessionStore((s) => s.clearActive);
  const records = useIntradaySessionStore((s) => s.records);
  const { createEntry } = useJournal();

  const [session, setSession] = useState<TradingDaySession>(() => {
    if (activeSession && activeMode === mode) return activeSession;
    return createTradingDaySession({
      seed: Math.floor(Date.now() % 1_000_000) + 17,
      scalp: mode === 'scalp',
    });
  });
  const [plan, setPlan] = useState(session.preSessionPlan);
  const [thesis, setThesis] = useState('');
  const [invalidation, setInvalidation] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<IntradayOrder['type']>('market');
  const [qty, setQty] = useState('100');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [review, setReview] = useState<ReturnType<typeof reviewSession> | null>(null);
  const orderSeq = useRef(session.orders.length + 1);

  const series = useMemo(() => tradedSeries(session), [session]);
  const visible = useMemo(() => visibleCandles(series, session.replay), [series, session.replay]);
  const current = series[session.replay.cursor];
  const gate = evaluateRiskGate({
    account: session.account,
    config: session.risk,
    markPrice: current?.close,
  });
  const net = netSessionPnl(session.account, current?.close);
  const complete = isReplayComplete(session.replay);
  const stage = useMemo(() => {
    const minuteIndex = session.replay.cursor * INTRADAY_INTERVAL_MINUTES[session.interval];
    const found = [...session.scenario.stages]
      .reverse()
      .find((s) => minuteIndex >= s.fromCandleIndex);
    return found ?? session.scenario.stages[0];
  }, [session]);

  const scalpLocked = mode === 'scalp' && !isPremium && records.some((r) => r.mode === 'scalp');

  // Playback timer. Cleans up on unmount; never advances a hidden screen.
  useEffect(() => {
    if (!session.replay.playing) return;
    const timer = setInterval(() => {
      setSession((prev) => {
        if (!prev.replay.playing) return prev;
        let next = prev;
        for (let i = 0; i < prev.replay.speed; i++) next = advanceSession(next);
        return next;
      });
    }, 650);
    return () => clearInterval(timer);
  }, [session.replay.playing]);

  useEffect(() => {
    saveActive(session, mode);
  }, [session, mode, saveActive]);

  if (scalpLocked) {
    return (
      <Screen scrollable>
        <Header title={MODE_COPY.scalp.title} onBack={() => router.back()} />
        <Surface className="mt-4">
          <Text variant="h3">Scalping practice continues with Aithera Pro</Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            Your first scalping session was free. Premium unlocks unlimited spread-aware scalping
            sessions, advanced execution lessons, and expert drills. Replay, Trading Day, lessons,
            and drills remain available without it.
          </Text>
          <Button className="mt-4" onPress={() => router.push('/subscription' as never)}>
            See Aithera Pro
          </Button>
          <Button variant="ghost" className="mt-2" onPress={() => router.back()}>
            Back
          </Button>
        </Surface>
      </Screen>
    );
  }

  const applyPlan = () => {
    setSession((prev) => ({ ...prev, preSessionPlan: plan }));
    setMessage(
      plan.trim().length >= 10
        ? 'Plan saved. Orders now follow it.'
        : 'Write at least a sentence: thesis, invalidation, maximum daily loss.',
    );
  };

  const step = (direction: 1 | -1) => {
    setSession((prev) =>
      direction === 1 ? advanceSession(prev) : { ...prev, replay: stepBackward(prev.replay) },
    );
  };

  const submitOrder = () => {
    const quantity = parseInt(qty, 10);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage('Quantity must be a positive whole number.');
      return;
    }
    const order: IntradayOrder = {
      id: `ord-${orderSeq.current++}`,
      side,
      type: orderType,
      quantity,
      filledQuantity: 0,
      status: 'pending',
      limitPrice: limitPrice ? parseFloat(limitPrice) : undefined,
      stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
      submittedAtCandle: session.replay.cursor,
    };
    if ((orderType === 'limit' || orderType === 'stop_limit') && order.limitPrice == null) {
      setMessage('Limit orders need a limit price.');
      return;
    }
    if ((orderType === 'stop_market' || orderType === 'stop_limit') && order.stopPrice == null) {
      setMessage('Stop orders need a stop price.');
      return;
    }
    const withDecision = recordDecision(session, {
      candleIndex: session.replay.cursor,
      action: session.account.positionQty === 0 ? 'enter' : 'reduce',
      thesis: thesis || undefined,
      invalidation: invalidation || undefined,
      at: new Date().toISOString(),
    });
    const result = submitSessionOrder(withDecision, order);
    setSession(result.session);
    setMessage(
      result.accepted
        ? `Order ${order.id} working (${orderType}). It fills on later candles, never instantly.`
        : `Order rejected: ${result.reason}`,
    );
  };

  const cancelOrder = (id: string) => {
    setSession((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => {
        if (o.id !== id || (o.status !== 'pending' && o.status !== 'partially_filled')) return o;
        try {
          return transitionOrder(o, 'cancelled');
        } catch {
          return o;
        }
      }),
    }));
  };

  const finish = async () => {
    const result = reviewSession(session, reflection);
    setReview(result);
    completeSession({
      id: session.id,
      at: new Date().toISOString(),
      mode,
      processScore: result.processScore,
      tradesPlaced: session.account.tradesPlaced,
      flat: result.flat,
      breakerHit: session.breakerEvents.length > 0,
      netPnl: net,
      reflection,
      findings: result.findings,
    });
    // Extend the existing journal (best-effort; local record above always persists).
    try {
      await createEntry({
        symbol: session.scenario.symbol,
        direction: 'long',
        entryPrice: current?.close ?? 0,
        quantity: 0,
        outcome: 'breakeven',
        notes: `Intraday ${mode} session (synthetic). Process score ${result.processScore}/100 — process, not P/L. Net simulated P/L ${net.toFixed(2)} (context only). ${result.findings.join(' ')}`,
        lessonsLearned: reflection || undefined,
        planAdhered: result.planWritten,
        tags: ['intraday', mode, 'synthetic-session'],
        linkedAcademyLessonIds: ['dt-session-plan'],
        tradedAt: new Date().toISOString(),
      });
    } catch {
      // Guest/local mode: the on-device intraday record remains the source of truth.
    }
  };

  const newSession = () => {
    clearActive();
    const fresh = createTradingDaySession({
      seed: Math.floor(Date.now() % 1_000_000) + 31,
      scalp: mode === 'scalp',
    });
    setSession(fresh);
    setPlan('');
    setReview(null);
    setReflection('');
    setMessage('New fictional session generated. It will not repeat the last tape.');
  };

  return (
    <Screen scrollable contentClassName="pb-10">
      <Header
        title={MODE_COPY[mode].title}
        subtitle={MODE_COPY[mode].subtitle}
        onBack={() => router.back()}
      />

      <Surface className="mt-3" testID="intraday-session-meta">
        <Text variant="caption" className="text-text-tertiary">
          {session.scenario.symbol} · {session.interval} candles · Synthetic educational session —
          fictional prices, not real market data
        </Text>
        <Text variant="body-sm" className="mt-1">
          Stage: {stage?.label} — {stage?.note}
        </Text>
        <Text variant="caption" className="mt-1 text-text-tertiary">
          Progress {Math.round(replayProgress(session.replay) * 100)}% · Candle{' '}
          {session.replay.cursor + 1} of {series.length}
        </Text>
        <View className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
          <View
            className="h-full rounded-full bg-accent"
            style={{ width: `${replayProgress(session.replay) * 100}%` }}
          />
        </View>
      </Surface>

      <View className="mt-4">
        <IntradayChart candles={visible} intervalLabel={session.interval} testID="intraday-chart" />
      </View>

      <View className="mt-3 flex-row flex-wrap gap-2" testID="intraday-controls">
        <Button
          size="sm"
          onPress={() =>
            setSession((p) => ({ ...p, replay: setPlaying(p.replay, !p.replay.playing) }))
          }
        >
          {session.replay.playing ? 'Pause' : 'Play'}
        </Button>
        <Button size="sm" variant="outline" onPress={() => step(1)}>
          Step +1 candle
        </Button>
        <Button size="sm" variant="outline" onPress={() => step(-1)}>
          Step back
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onPress={() => setSession((p) => ({ ...p, replay: createReplay(series.length) }))}
        >
          Reset
        </Button>
        {([1, 2, 4] as const).map((speed) => (
          <FilterChip
            key={speed}
            label={`${speed}×`}
            selected={session.replay.speed === speed}
            onPress={() => setSession((p) => ({ ...p, replay: setSpeed(p.replay, speed) }))}
          />
        ))}
      </View>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {(['1m', '3m', '5m', '15m'] as IntradayInterval[]).map((interval) => (
          <FilterChip
            key={interval}
            label={interval}
            selected={session.interval === interval}
            onPress={() => {
              if (session.orders.length > 0) {
                setMessage(
                  'Interval is locked once orders exist — order timing is defined on this series.',
                );
                return;
              }
              setSession((p) => {
                const minutes = p.replay.cursor * INTRADAY_INTERVAL_MINUTES[p.interval];
                const nextCursor = Math.max(
                  0,
                  Math.floor(minutes / INTRADAY_INTERVAL_MINUTES[interval]),
                );
                return {
                  ...p,
                  interval,
                  replay: {
                    ...createReplay(
                      Math.ceil(p.scenario.candles.length / INTRADAY_INTERVAL_MINUTES[interval]),
                    ),
                    cursor: nextCursor,
                  },
                };
              });
            }}
          />
        ))}
      </View>

      <Surface className="mt-4">
        <Text variant="label" className="text-text-tertiary">
          PRE-SESSION PLAN (REQUIRED BEFORE ORDERS)
        </Text>
        <Input
          className="mt-2"
          placeholder="Thesis, invalidation, maximum daily loss…"
          value={plan}
          onChangeText={setPlan}
          multiline
        />
        <Button size="sm" className="mt-2" onPress={applyPlan}>
          Save plan
        </Button>
        <Text variant="caption" className="mt-2 text-text-tertiary">
          {session.maxDailyLossNote}
        </Text>
      </Surface>

      {gate.circuitBreakerActive ? (
        <Surface className="mt-3" testID="intraday-breaker">
          <Text variant="h3">Daily loss circuit breaker active</Text>
          <Text variant="body-sm" className="mt-1 text-text-secondary">
            {gate.reasons[0]}
          </Text>
        </Surface>
      ) : null}

      <Surface className="mt-3" testID="intraday-account">
        <Text variant="label" className="text-text-tertiary">
          SIMULATED ACCOUNT
        </Text>
        <Text variant="body-sm" className="mt-1">
          Cash {formatPrice(session.account.cash, 'USD')} · Position {session.account.positionQty} @{' '}
          {formatPrice(session.account.averageEntryPrice, 'USD')} · Net P/L{' '}
          {formatPrice(net, 'USD')} (context only — process is the grade)
        </Text>
        <Text variant="caption" className="mt-1 text-text-tertiary">
          Costs so far — fees {formatPrice(session.account.feesTotal, 'USD')} · spread{' '}
          {formatPrice(session.account.spreadCostTotal, 'USD')} · slippage{' '}
          {formatPrice(session.account.slippageCostTotal, 'USD')} · Trades{' '}
          {session.account.tradesPlaced} · Loss streak {session.account.consecutiveLosses}
        </Text>
        {gate.reasons.length && !gate.circuitBreakerActive ? (
          <Text variant="caption" className="mt-1 text-bearish">
            {gate.reasons[0]}
          </Text>
        ) : null}
      </Surface>

      {mode !== 'replay' ? (
        <Surface className="mt-3" testID="intraday-order-panel">
          <Text variant="label" className="text-text-tertiary">
            SIMULATED ORDER
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {(['buy', 'sell'] as const).map((s) => (
              <FilterChip
                key={s}
                label={s.toUpperCase()}
                selected={side === s}
                onPress={() => setSide(s)}
              />
            ))}
            {(['market', 'limit', 'stop_market', 'stop_limit'] as const).map((t) => (
              <FilterChip
                key={t}
                label={t.replace('_', ' ')}
                selected={orderType === t}
                onPress={() => setOrderType(t)}
              />
            ))}
          </View>
          <Input
            label="Quantity"
            keyboardType="number-pad"
            value={qty}
            onChangeText={setQty}
            containerClassName="mt-3"
          />
          <Input
            label="Limit price (limit / stop-limit)"
            keyboardType="decimal-pad"
            value={limitPrice}
            onChangeText={setLimitPrice}
            containerClassName="mt-2"
          />
          <Input
            label="Stop price (stop orders)"
            keyboardType="decimal-pad"
            value={stopPrice}
            onChangeText={setStopPrice}
            containerClassName="mt-2"
          />
          <Input
            label="Thesis for this decision"
            value={thesis}
            onChangeText={setThesis}
            containerClassName="mt-2"
          />
          <Input
            label="Invalidation"
            value={invalidation}
            onChangeText={setInvalidation}
            containerClassName="mt-2"
          />
          <Button className="mt-3" onPress={submitOrder}>
            Submit simulated order
          </Button>
          <Text variant="caption" className="mt-2 text-text-tertiary">
            Market fills use later candles with spread, slippage, and latency. Limits may never
            fill. A stop does not guarantee a price.
          </Text>
          {session.orders.length ? (
            <View className="mt-3 gap-2">
              {session.orders.map((order) => (
                <View key={order.id} className="flex-row items-center justify-between gap-2">
                  <Text variant="caption" className="flex-1">
                    {order.id}: {order.side} {order.filledQuantity}/{order.quantity} {order.type} —{' '}
                    {order.status}
                    {order.rejectReason ? ` (${order.rejectReason})` : ''}
                  </Text>
                  {order.status === 'pending' || order.status === 'partially_filled' ? (
                    <Button size="sm" variant="ghost" onPress={() => cancelOrder(order.id)}>
                      Cancel
                    </Button>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </Surface>
      ) : (
        <Surface className="mt-3">
          <Text variant="label" className="text-text-tertiary">
            DECISION FREEZE
          </Text>
          <Input
            label="Thesis at this candle"
            value={thesis}
            onChangeText={setThesis}
            containerClassName="mt-2"
          />
          <Input
            label="Invalidation"
            value={invalidation}
            onChangeText={setInvalidation}
            containerClassName="mt-2"
          />
          <View className="mt-3 flex-row flex-wrap gap-2">
            <Button
              size="sm"
              onPress={() => {
                setSession((p) =>
                  recordDecision(p, {
                    candleIndex: p.replay.cursor,
                    action: 'wait',
                    thesis: thesis || undefined,
                    invalidation: invalidation || undefined,
                    at: new Date().toISOString(),
                  }),
                );
                setMessage(
                  'Decision committed: wait. Now step forward and grade it against what printed.',
                );
              }}
            >
              Commit: wait / observe
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={() => {
                setSession((p) =>
                  recordDecision(p, {
                    candleIndex: p.replay.cursor,
                    action: 'enter',
                    thesis: thesis || undefined,
                    invalidation: invalidation || undefined,
                    at: new Date().toISOString(),
                  }),
                );
                setMessage(
                  'Decision committed: would enter. Step forward — was the thesis honoured by the tape?',
                );
              }}
            >
              Commit: would enter
            </Button>
          </View>
        </Surface>
      )}

      {message ? (
        <Text variant="caption" className="mt-3 text-text-secondary" testID="intraday-message">
          {message}
        </Text>
      ) : null}

      <Surface className="mt-4" testID="intraday-review">
        <Text variant="label" className="text-text-tertiary">
          END-OF-SESSION REVIEW
        </Text>
        <Input
          placeholder="Reflection: what did the tape teach, what repeats, what will you change?"
          value={reflection}
          onChangeText={setReflection}
          multiline
          containerClassName="mt-2"
        />
        <Button className="mt-3" onPress={finish}>
          {complete ? 'Finish and review session' : 'End session early and review'}
        </Button>
        {review ? (
          <View className="mt-3">
            <Text variant="h3">
              {review.headline} — process {review.processScore}/100
            </Text>
            {review.findings.map((finding) => (
              <Text key={finding} variant="body-sm" className="mt-1 text-text-secondary">
                • {finding}
              </Text>
            ))}
            <Text variant="caption" className="mt-2 text-text-tertiary">
              Saved on this device and, when signed in, linked into your journal. Simulated P/L
              never grades the decisions.
            </Text>
          </View>
        ) : null}
        <Button variant="ghost" className="mt-2" onPress={newSession}>
          Generate a new session
        </Button>
      </Surface>
    </Screen>
  );
}
