import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { EducationalChart } from '@/features/academy/components/EducationalChart';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { formatPercent, formatPrice } from '@/shared/utils/format';

import { quantityForRisk } from '../services/simulation-engine.service';
import { parseFxPair, unitPriceInAccountCurrency } from '../services/fx-conversion.service';
import type {
  SimulationAccount,
  SimulationQuote,
  SimulationResult,
  SimulationSide,
  SimulationTradeInput,
  SimulationTradePreview,
} from '../types/simulation.types';

interface SimulationTradeTicketProps {
  account: SimulationAccount;
  quotes: SimulationQuote[];
  listedName: (symbol: string) => string;
  onPreview: (
    side: SimulationSide,
    input: Omit<SimulationTradeInput, 'price'> & { price?: number },
  ) => SimulationResult<SimulationTradePreview>;
  onConfirm: (
    side: SimulationSide,
    input: Omit<SimulationTradeInput, 'price'> & { price?: number },
  ) => SimulationResult<SimulationAccount>;
  onJournal: (symbol: string) => void;
}

export function SimulationTradeTicket({
  account,
  quotes,
  listedName,
  onPreview,
  onConfirm,
  onJournal,
}: SimulationTradeTicketProps) {
  const router = useRouter();
  const [symbol, setSymbol] = useState(quotes.find((item) => item.symbol === 'SPY')?.symbol ?? quotes[0]?.symbol ?? 'SPY');
  const [side, setSide] = useState<SimulationSide>('buy');
  const [quantity, setQuantity] = useState('10');
  const [amount, setAmount] = useState('');
  const [stop, setStop] = useState('');
  const [target, setTarget] = useState('');
  const [thesis, setThesis] = useState('');
  const [setup, setSetup] = useState('');
  const [evidence, setEvidence] = useState('');
  const [invalidation, setInvalidation] = useState('');
  const [expectedRisk, setExpectedRisk] = useState('');
  const [intendedSize, setIntendedSize] = useState('');
  const [expectedScenarios, setExpectedScenarios] = useState('');
  const [managementChange, setManagementChange] = useState('');
  const [exitReasoning, setExitReasoning] = useState('');
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<SimulationTradePreview | null>(null);

  const quote = useMemo(
    () => quotes.find((item) => item.symbol === symbol.toUpperCase()) ?? quotes[0],
    [quotes, symbol],
  );
  const pair = quote ? parseFxPair(quote.symbol) : null;
  const accountUnitPrice =
    quote != null ? unitPriceInAccountCurrency(quote.symbol, quote.price, account.currency) : 0;

  const owned = account.positions.find((position) => position.symbol === symbol.toUpperCase());

  const buildInput = (): Omit<SimulationTradeInput, 'price'> & { price?: number } => {
    const stopPrice = stop.trim() ? Number(stop) : undefined;
    const targetPrice = target.trim() ? Number(target) : undefined;
    const amountValue = amount.trim() ? Number(amount) : undefined;
    let qty = Number(quantity);
    if (amountValue && quote && amountValue > 0 && accountUnitPrice > 0) {
      qty = amountValue / accountUnitPrice;
    }
    return {
      symbol: symbol.toUpperCase(),
      quantity: qty,
      price: quote?.price,
      stopPrice: Number.isFinite(stopPrice) ? stopPrice : undefined,
      targetPrice: Number.isFinite(targetPrice) ? targetPrice : undefined,
      thesis: thesis.trim() || undefined,
      setup: setup.trim() || undefined,
      evidence: evidence.trim() || undefined,
      invalidation: invalidation.trim() || undefined,
      expectedRisk: expectedRisk.trim() || undefined,
      intendedPositionSize: intendedSize.trim() || undefined,
      expectedScenarios: expectedScenarios.trim() || undefined,
      managementChange: managementChange.trim() || undefined,
      exitReasoning: exitReasoning.trim() || undefined,
      confidence,
      reason: thesis.trim() || undefined,
    };
  };

  const suggestSize = () => {
    if (!quote) return;
    const stopPrice = Number(stop);
    if (!Number.isFinite(stopPrice) || stopPrice <= 0) {
      setMessage('Add a stop to suggest a 1% risk size. This is a teaching aid, not a recommendation.');
      return;
    }
    const qty = quantityForRisk({
      equity: account.equity,
      entry: accountUnitPrice,
      stop: unitPriceInAccountCurrency(quote.symbol, stopPrice, account.currency),
      riskPercent: 0.01,
    });
    setQuantity(String(qty));
    setAmount('');
    setMessage('Suggested quantity uses 1% of simulated equity between entry and stop. Confirm only if that matches your plan.');
  };

  const reviewOrder = () => {
    if (side === 'buy' && !thesis.trim()) {
      setPreview(null);
      setMessage('Write a one-line thesis before a simulated buy. Process first — this is not a broker ticket.');
      return;
    }
    const input = buildInput();
    const result = onPreview(side, input);
    if (!result.ok) {
      setPreview(null);
      setMessage(result.message);
      return;
    }
    setPreview(result.value);
    setMessage('Review the paper order. Nothing is filled until you confirm.');
  };

  const confirmOrder = () => {
    if (side === 'buy' && !thesis.trim()) {
      setMessage('Write a one-line thesis before a simulated buy. Process first — this is not a broker ticket.');
      return;
    }
    const input = buildInput();
    const result = onConfirm(side, input);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setPreview(null);
    setMessage(
      side === 'buy'
        ? 'Decision completed. Review whether the size and thesis still match your plan.'
        : 'Position closed. Review your process — simulated P/L is not the grade.',
    );
  };

  return (
    <Surface className="mb-4" testID="simulate-ticket">
      <Text variant="label">{listedName(symbol)}</Text>
      <Text variant="body-sm" className="mt-1 text-text-secondary">
        Simulated price {quote ? formatPrice(quote.price, quote.currency) : '—'} · {quote?.label}. Not a live
        quote.
      </Text>
      {pair && quote ? (
        <Text variant="caption" className="mt-1 text-text-secondary">
          {pair.base}/{pair.quote}: one {pair.base} costs {formatPrice(quote.price, pair.quote)}. In this{' '}
          {account.currency} book that is about {formatPrice(accountUnitPrice, account.currency)} per unit.
        </Text>
      ) : quote && quote.currency !== account.currency ? (
        <Text variant="caption" className="mt-1 text-text-secondary">
          Quoted in {quote.currency}. Paper cost in {account.currency}:{' '}
          {formatPrice(accountUnitPrice, account.currency)} per unit (sample conversion).
        </Text>
      ) : null}
      {owned ? (
        <Text variant="caption" className="mt-2 text-text-secondary">
          Quantity owned: {owned.quantity}
        </Text>
      ) : null}

      <View className="mt-3" testID="simulate-study-chart">
        <EducationalChart
          spec={{
            id: `sim-study-${symbol.toUpperCase()}`,
            kind: 'candles',
            title: `${symbol.toUpperCase()} synthetic tape`,
            caption: 'Educational sample for this paper name — not a live quote and not an order ticket.',
          }}
        />
        <Button
          className="mt-2"
          size="sm"
          variant="outline"
          accessibilityLabel={`Study the synthetic chart for ${symbol.toUpperCase()}`}
          onPress={() =>
            router.push(
              `/asset/${encodeURIComponent(symbol.toUpperCase())}?from=simulate` as never,
            )
          }
        >
          Study this name
        </Button>
      </View>

      <View className="mt-3">
        <Text variant="caption" className="mb-1 text-text-tertiary">
          US names (USD-quoted sample)
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {quotes
            .filter((item) => item.symbol !== 'NESN' && !parseFxPair(item.symbol))
            .map((item) => (
              <Button
                key={item.symbol}
                size="sm"
                variant={item.symbol === symbol.toUpperCase() ? 'primary' : 'ghost'}
                onPress={() => {
                  setSymbol(item.symbol);
                  setPreview(null);
                }}
              >
                {item.symbol}
              </Button>
            ))}
        </View>
        <Text variant="caption" className="mb-1 mt-3 text-text-tertiary">
          Currency pairs
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {quotes
            .filter((item) => parseFxPair(item.symbol))
            .map((item) => (
              <Button
                key={item.symbol}
                size="sm"
                variant={item.symbol === symbol.toUpperCase() ? 'primary' : 'ghost'}
                onPress={() => {
                  setSymbol(item.symbol);
                  setPreview(null);
                }}
              >
                {item.symbol}
              </Button>
            ))}
        </View>
      </View>

      <SegmentedControl
        className="mt-3"
        options={[
          { value: 'buy', label: 'Buy' },
          { value: 'sell', label: 'Sell / close' },
        ]}
        value={side}
        onChange={(next) => {
          setSide(next);
          setPreview(null);
        }}
      />

      <Input
        containerClassName="mt-3"
        label="Quantity"
        keyboardType="decimal-pad"
        value={quantity}
        onChangeText={(value) => {
          setQuantity(value);
          setAmount('');
          setPreview(null);
        }}
      />
      <Input
        containerClassName="mt-3"
        label={`Amount (${account.currency}, optional)`}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={(value) => {
          setAmount(value);
          setPreview(null);
        }}
        hint="If set, quantity is derived from simulated price × amount."
      />
      <Input
        containerClassName="mt-3"
        label="Stop (optional, required in 1% risk challenge)"
        keyboardType="decimal-pad"
        value={stop}
        onChangeText={setStop}
      />
      <Input
        containerClassName="mt-3"
        label="Target (optional, recorded only)"
        keyboardType="decimal-pad"
        value={target}
        onChangeText={setTarget}
      />
      <Button className="mt-2" size="sm" variant="ghost" onPress={suggestSize}>
        Suggest 1% risk size
      </Button>

      <CollapsibleSection
        className="mt-3"
        title="Record the decision"
        description="A one-line thesis is required for simulated buys. Evidence and invalidation make the review useful later."
        defaultExpanded
      >
        <Input
          containerClassName="mt-1"
          label="Thesis / reason for entry"
          placeholder="What is the idea, and what would prove it wrong?"
          value={thesis}
          onChangeText={setThesis}
          multiline
        />
        <Input containerClassName="mt-3" label="Setup" value={setup} onChangeText={setSetup} />
        <Input containerClassName="mt-3" label="Evidence" value={evidence} onChangeText={setEvidence} multiline />
        <Input
          containerClassName="mt-3"
          label="Invalidation"
          value={invalidation}
          onChangeText={setInvalidation}
        />
        <Input
          containerClassName="mt-3"
          label="Expected risk"
          value={expectedRisk}
          onChangeText={setExpectedRisk}
        />
        <Input
          containerClassName="mt-3"
          label="Intended position size"
          value={intendedSize}
          onChangeText={setIntendedSize}
        />
        <Input
          containerClassName="mt-3"
          label="Expected scenarios"
          placeholder="What could go right, wrong, or sideways?"
          value={expectedScenarios}
          onChangeText={setExpectedScenarios}
          multiline
        />
        {side === 'sell' ? (
          <>
            <Input
              containerClassName="mt-3"
              label="Management change"
              placeholder="What did you change, and why?"
              value={managementChange}
              onChangeText={setManagementChange}
            />
            <Input
              containerClassName="mt-3"
              label="Exit reasoning"
              placeholder="Why close or reduce now?"
              value={exitReasoning}
              onChangeText={setExitReasoning}
              multiline
            />
          </>
        ) : null}
        <Text variant="label" className="mb-2 mt-3">
          Confidence
        </Text>
        <SegmentedControl
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
          value={confidence}
          onChange={setConfidence}
        />
      </CollapsibleSection>

      {preview ? (
        <Surface tone="subtle" className="mt-4" testID="simulate-preview">
          <Text variant="label">Before confirmation</Text>
          <Text variant="caption" className="mt-2 text-text-secondary">
            {preview.simulationWarning}
          </Text>
          <Text variant="caption" className="mt-2 text-text-secondary">
            Estimated price {formatPrice(preview.executionPrice, account.currency)} · position value{' '}
            {formatPrice(preview.estimatedPositionValue, account.currency)}
          </Text>
          <Text variant="caption" className="mt-1 text-text-secondary">
            Cash {formatPrice(preview.cashBefore, account.currency)} →{' '}
            {formatPrice(preview.cashAfter, account.currency)}
          </Text>
          <Text variant="caption" className="mt-1 text-text-secondary">
            Portfolio weight after {formatPercent(preview.portfolioWeightAfter * 100, { showSign: false })}
            {preview.riskPercent != null
              ? ` · risk ${formatPercent(preview.riskPercent * 100, { showSign: false })} of equity`
              : ''}
          </Text>
          {preview.estimatedRealizedPnL != null ? (
            <Text variant="caption" className="mt-1 text-text-secondary">
              Estimated realized P/L {formatPrice(preview.estimatedRealizedPnL, account.currency)} · remaining{' '}
              {preview.remainingQuantity}
            </Text>
          ) : null}
        </Surface>
      ) : null}

      <Button className="mt-4" variant="outline" onPress={reviewOrder}>
        Review paper order
      </Button>
      <Button className="mt-2" onPress={confirmOrder} disabled={!preview}>
        Confirm {side === 'buy' ? 'simulated buy' : 'simulated sell'}
      </Button>
      {message ? (
        <Text
          variant="body-sm"
          className="mt-3 text-text-secondary"
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {message}
        </Text>
      ) : null}
      <Button className="mt-2" size="sm" variant="ghost" onPress={() => onJournal(symbol.toUpperCase())}>
        Journal this decision
      </Button>
    </Surface>
  );
}
