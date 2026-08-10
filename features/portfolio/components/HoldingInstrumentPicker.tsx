import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { useInstrumentSearch } from '@/features/markets/hooks/useInstrumentSearch';
import { resolveInstrument } from '@/features/markets/services/instrument-resolver.service';
import type { Instrument } from '@/features/markets/types/instrument.types';
import { instrumentClassLabel } from '@/features/markets/types/instrument.types';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';

interface HoldingInstrumentPickerProps {
  onResolved: (instrument: Instrument) => void;
  disabled?: boolean;
}

export function HoldingInstrumentPicker({
  onResolved,
  disabled,
}: HoldingInstrumentPickerProps) {
  const [query, setQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [candidates, setCandidates] = useState<Instrument[] | null>(null);

  const search = useInstrumentSearch({ query, enabled: query.trim().length >= 1 });

  const runResolve = async (raw: string) => {
    setIsResolving(true);
    setStatusMessage(null);
    setCandidates(null);
    try {
      const result = await resolveInstrument(raw);
      if (result.status === 'resolved') {
        onResolved(result.instrument);
        setQuery('');
        return;
      }
      if (result.status === 'ambiguous') {
        setCandidates(result.candidates);
        setStatusMessage(result.reason ?? 'Select the asset you mean.');
        return;
      }
      if (result.status === 'unsupported') {
        setStatusMessage(
          result.reason ??
            'We found this asset, but TradeInsight cannot currently provide reliable market data for it.',
        );
        return;
      }
      setStatusMessage(
        result.reason ??
          "We couldn't find a supported market asset. Try Apple, AAPL, Bitcoin, BTC/USD, or Gold.",
      );
    } catch {
      setStatusMessage('Search is temporarily unavailable. Try again in a moment.');
    } finally {
      setIsResolving(false);
    }
  };

  const selectCandidate = async (instrument: Instrument) => {
    setIsResolving(true);
    setStatusMessage(null);
    try {
      const result = await resolveInstrument(instrument.canonicalSymbol);
      if (result.status === 'resolved') {
        onResolved(result.instrument);
        setCandidates(null);
        setQuery('');
        return;
      }
      if (result.status === 'unsupported') {
        setStatusMessage(
          result.reason ??
            'TradeInsight cannot currently provide reliable market data for this asset.',
        );
        return;
      }
      // Already capability-checked in list path — accept selected instrument if quote-capable
      if (instrument.dataCapabilities.quote) {
        onResolved(instrument);
        setCandidates(null);
        setQuery('');
        return;
      }
      setStatusMessage('This asset could not be confirmed with market data.');
    } finally {
      setIsResolving(false);
    }
  };

  const hits = candidates ?? search.data?.map((h) => h.instrument) ?? [];
  const showList = query.trim().length >= 1 || Boolean(candidates?.length);

  return (
    <View className="gap-3" testID="holding-instrument-picker">
      <Text variant="h3" headingLevel={3}>
        Search investments
      </Text>
      <Text variant="caption" className="text-text-secondary">
        Search by name or symbol. Holdings are only created after TradeInsight resolves a real
        market asset.
      </Text>
      <Input
        label="Search by name or symbol"
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          setStatusMessage(null);
          setCandidates(null);
        }}
        placeholder="Apple, AAPL, Bitcoin, Gold…"
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        onSubmitEditing={() => {
          if (query.trim()) void runResolve(query);
        }}
        editable={!disabled && !isResolving}
        accessibilityLabel="Search investments by name or symbol"
      />

      {(search.isFetching || isResolving) && query.trim().length >= 1 ? (
        <View
          className="min-h-11 flex-row items-center gap-2"
          accessibilityLiveRegion="polite"
          accessibilityLabel="Searching investments"
        >
          <ActivityIndicator />
          <Text variant="caption" className="text-text-tertiary">
            Searching…
          </Text>
        </View>
      ) : null}

      {statusMessage ? (
        <Text
          variant="body-sm"
          className="text-text-secondary"
          accessibilityLiveRegion="polite"
          accessibilityRole="text"
        >
          {statusMessage}
        </Text>
      ) : null}

      {showList && hits.length > 0 ? (
        <View className="overflow-hidden rounded-2xl bg-background-elevated">
          {hits.slice(0, 8).map((item) => (
            <Pressable
              key={item.id}
              disabled={disabled || isResolving}
              onPress={() => void selectCandidate(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${item.canonicalSymbol}, ${instrumentClassLabel(item.assetClass)}`}
              className="min-h-14 border-b border-border px-4 py-3.5 active:bg-surface"
            >
              <Text variant="body">{item.name}</Text>
              <Text variant="caption" className="mt-1 text-text-tertiary">
                {item.canonicalSymbol} · {instrumentClassLabel(item.assetClass)}
                {item.exchange ? ` · ${item.exchange}` : ''}
                {item.currency ? ` · ${item.currency}` : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {showList && !search.isFetching && !isResolving && hits.length === 0 && query.trim() ? (
        <Text variant="body-sm" className="text-text-secondary">
          No supported matches yet. Try a company name, ticker, crypto pair, or commodity.
        </Text>
      ) : null}
    </View>
  );
}
