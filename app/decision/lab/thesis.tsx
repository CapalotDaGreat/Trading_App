import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { LabCritiqueCard } from '@/features/decision-lab/components/LabCards';
import { useDecisionLabStore } from '@/features/decision-lab/stores/lab.store';
import {
  LAB_SCENARIOS,
  type LabBias,
  type LabScenarioId,
} from '@/features/decision-lab/types/lab.types';
import {
  buildThesisChecklist,
  computeRiskReward,
  thesisBlockers,
} from '@/features/decision-lab/services/lab-thesis.service';
import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { useRegime, useTraderMemory } from '@/features/decision/hooks/useDecision';
import { usePortfolio } from '@/features/portfolio/hooks/usePortfolio';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

export default function LabThesisScreen() {
  const router = useRouter();
  const draft = useDecisionLabStore((s) => s.draft);
  const patchDraft = useDecisionLabStore((s) => s.patchDraft);
  const buildCritique = useDecisionLabStore((s) => s.buildCritique);
  const openFromCritique = useDecisionLabStore((s) => s.openFromCritique);
  const lastCritique = useDecisionLabStore((s) => s.lastCritique);
  const pendingThesis = useDecisionLabStore((s) => s.pendingThesis);

  const regimeQuery = useRegime();
  const memoryQuery = useTraderMemory();
  const { holdings } = usePortfolio();
  const appendDecision = useAppendDecisionRecord();

  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const liveRr = useMemo(() => {
    const low = Number(draft.entryLow);
    const high = Number(draft.entryHigh);
    const stop = Number(draft.stopLoss);
    const target = Number(draft.target);
    if (![low, high, stop, target].every((n) => Number.isFinite(n) && n > 0)) return 0;
    const mid = (low + high) / 2;
    return computeRiskReward(draft.bias, mid, stop, target);
  }, [draft.bias, draft.entryLow, draft.entryHigh, draft.stopLoss, draft.target]);

  const checklist = useMemo(
    () =>
      buildThesisChecklist({
        bias: draft.bias,
        entryLow: Number(draft.entryLow) || undefined,
        entryHigh: Number(draft.entryHigh) || undefined,
        stopLoss: Number(draft.stopLoss) || undefined,
        target: Number(draft.target) || undefined,
        riskReward: liveRr,
        catalyst: draft.catalyst,
        invalidation: draft.invalidation,
        confidence: Number(draft.confidence) || undefined,
        academyChecklistDone: draft.academyChecklistDone,
      }),
    [draft, liveRr],
  );

  const missing = thesisBlockers(checklist);

  const runCritique = () => {
    const result = buildCritique({
      regime: regimeQuery.data?.regime,
      memory: memoryQuery.data,
      holdings,
    });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
  };

  const openPosition = async () => {
    setBusy(true);
    try {
      const result = openFromCritique();
      if (!result.ok) {
        setErrors([result.error]);
        return;
      }
      await appendDecision.mutateAsync({
        symbol: result.position.thesis.symbol,
        regime: regimeQuery.data?.regime ?? 'lab',
        action: 'lab_opened',
        setupScore: result.position.thesis.confidence,
        researchValueScore: result.position.thesis.confidence,
        decisionQualityScore: Math.round(
          (Object.values(result.position.thesis.checklist).filter(Boolean).length / 9) * 100,
        ),
        bias: result.position.thesis.bias === 'long' ? 'bullish' : 'bearish',
        invalidation: result.position.thesis.invalidation,
        note: `Lab open · ${result.position.thesis.scenarioId} · R:R ${result.position.thesis.riskReward}`,
        risk: result.position.thesis.riskReward < 2 ? 'high' : 'medium',
      });
      router.replace(`/decision/lab/${result.position.id}` as never);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scrollable>
      <Header
        title="Lab thesis"
        subtitle="Complete every field — or you cannot open"
        onBack={() => router.back()}
      />

      <View className="mt-4 gap-3 pb-12">
        <GlassCard className="p-4">
          <Text variant="caption" className="mb-2 text-text-secondary">
            Research → thesis → AI critique → open. No shortcuts.
          </Text>
          <Text variant="caption" className="text-accent">
            Live R:R {liveRr > 0 ? `${liveRr}:1` : '—'} · Checklist {9 - missing.length}/9
          </Text>
        </GlassCard>

        <Input
          label="Symbol"
          value={draft.symbol}
          onChangeText={(symbol) => patchDraft({ symbol })}
          autoCapitalize="characters"
        />

        <Text variant="caption" className="font-semibold text-text-tertiary">
          Bias
        </Text>
        <View className="flex-row gap-2">
          {(['long', 'short'] as LabBias[]).map((b) => (
            <Pressable
              key={b}
              onPress={() => patchDraft({ bias: b })}
              className={cn(
                'flex-1 items-center rounded-xl py-2.5',
                draft.bias === b ? 'bg-accent-muted' : 'bg-surface',
              )}
            >
              <Text
                variant="label"
                className={draft.bias === b ? 'text-accent' : 'text-text-secondary'}
              >
                {b}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text variant="caption" className="font-semibold text-text-tertiary">
          Scenario
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {LAB_SCENARIOS.map((sc) => (
            <Pressable
              key={sc.id}
              onPress={() => patchDraft({ scenarioId: sc.id as LabScenarioId })}
              className={cn(
                'rounded-full px-3 py-1.5',
                draft.scenarioId === sc.id ? 'bg-accent-muted' : 'bg-surface',
              )}
            >
              <Text
                variant="caption"
                className={draft.scenarioId === sc.id ? 'text-accent' : 'text-text-secondary'}
              >
                {sc.title}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row gap-2">
          <Input
            label="Entry low"
            containerClassName="flex-1"
            keyboardType="decimal-pad"
            value={draft.entryLow}
            onChangeText={(entryLow) => patchDraft({ entryLow })}
          />
          <Input
            label="Entry high"
            containerClassName="flex-1"
            keyboardType="decimal-pad"
            value={draft.entryHigh}
            onChangeText={(entryHigh) => patchDraft({ entryHigh })}
          />
        </View>
        <View className="flex-row gap-2">
          <Input
            label="Stop loss"
            containerClassName="flex-1"
            keyboardType="decimal-pad"
            value={draft.stopLoss}
            onChangeText={(stopLoss) => patchDraft({ stopLoss })}
          />
          <Input
            label="Target"
            containerClassName="flex-1"
            keyboardType="decimal-pad"
            value={draft.target}
            onChangeText={(target) => patchDraft({ target })}
          />
        </View>

        <Input
          label="Catalyst"
          value={draft.catalyst}
          onChangeText={(catalyst) => patchDraft({ catalyst })}
          placeholder="Why this idea now?"
        />
        <Input
          label="Invalidation"
          value={draft.invalidation}
          onChangeText={(invalidation) => patchDraft({ invalidation })}
          placeholder="What proves the thesis wrong?"
        />
        <Input
          label="Process confidence (1–100)"
          keyboardType="number-pad"
          value={draft.confidence}
          onChangeText={(confidence) => patchDraft({ confidence })}
          hint="Not a price prediction — how complete is your plan?"
        />
        <Input
          label="Quantity (shares / units)"
          keyboardType="decimal-pad"
          value={draft.quantity}
          onChangeText={(quantity) => patchDraft({ quantity })}
        />
        <Input
          label="Notes"
          value={draft.notes}
          onChangeText={(notes) => patchDraft({ notes })}
          multiline
        />

        <Pressable
          onPress={() =>
            patchDraft({ academyChecklistDone: !draft.academyChecklistDone })
          }
          className={cn(
            'rounded-2xl px-4 py-3',
            draft.academyChecklistDone ? 'bg-accent-muted' : 'bg-surface',
          )}
        >
          <Text
            variant="label"
            className={draft.academyChecklistDone ? 'text-accent' : 'text-text-primary'}
          >
            {draft.academyChecklistDone ? '✓ ' : '○ '}Pre-trade checklist complete
          </Text>
          <Text variant="caption" className="mt-0.5 text-text-secondary">
            Bias, levels, R:R, catalyst, invalidation reviewed
          </Text>
        </Pressable>

        {missing.length > 0 ? (
          <GlassCard className="p-4">
            <Text variant="caption" className="mb-1 font-semibold text-warning">
              Required before open
            </Text>
            {missing.map((m) => (
              <Text key={m} variant="caption" className="text-text-secondary">
                • {m}
              </Text>
            ))}
          </GlassCard>
        ) : null}

        {errors.length > 0 ? (
          <GlassCard className="p-4">
            {errors.map((e) => (
              <Text key={e} variant="caption" className="text-bearish">
                {e}
              </Text>
            ))}
          </GlassCard>
        ) : null}

        <Button onPress={runCritique} disabled={missing.length > 0}>
          Run AI critique
        </Button>

        {lastCritique && pendingThesis ? (
          <>
            <LabCritiqueCard critique={lastCritique} />
            <Button
              onPress={() => void openPosition()}
              loading={busy}
              disabled={lastCritique.overall === 'block' || busy}
            >
              Open simulated position
            </Button>
          </>
        ) : null}
      </View>
    </Screen>
  );
}
