import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { CandlestickChart } from '@/features/charts/components/CandlestickChart';
import { useDecisionLabStore } from '@/features/decision-lab/stores/lab.store';
import { SimulatorActionChooser } from '@/features/decision-simulator/components/SimulatorActionChooser';
import { SimulatorContextPanel } from '@/features/decision-simulator/components/SimulatorContextPanel';
import { SimulatorRevealCard } from '@/features/decision-simulator/components/SimulatorRevealCard';
import { useDecisionSimulator } from '@/features/decision-simulator/hooks/useDecisionSimulator';
import type {
  SimulatorAction,
  SimulatorChecklist,
} from '@/features/decision-simulator/types/simulator.types';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';

export function SimulatorSessionScreen() {
  const router = useRouter();
  const layout = useResponsiveLayout();
  const {
    activeSession,
    updateChecklist,
    setReasoningNote,
    submitDecision,
    isSubmitting,
    clearActive,
  } = useDecisionSimulator();
  const resetDraft = useDecisionLabStore((s) => s.resetDraft);

  useEffect(() => {
    if (!activeSession) {
      router.replace('/decision/simulator' as never);
    }
  }, [activeSession, router]);

  if (!activeSession) {
    return (
      <Screen className="items-center justify-center">
        <Text variant="body">Loading session…</Text>
      </Screen>
    );
  }

  const revealed = activeSession.phase === 'revealed';
  const chartCandles = revealed ? activeSession.fullCandles : activeSession.visibleCandles;

  const onChoose = async (action: SimulatorAction) => {
    const session = await submitDecision(action);
    if (action === 'create_thesis' && session) {
      resetDraft('freeform', session.symbol);
      router.push('/decision/lab/thesis' as never);
    }
  };

  const toggleCheck = (key: keyof SimulatorChecklist) => {
    updateChecklist({ [key]: !activeSession.checklist[key] });
  };

  return (
    <Screen scrollable contentClassName="pb-12">
      <Header
        title={`${activeSession.symbol} Simulator`}
        subtitle={
          revealed
            ? 'Future candles revealed · process scores only'
            : 'Future candles hidden · make a process decision'
        }
        onBack={() => router.back()}
      />

      <View className="mt-4 gap-4">
        <GlassCard className="overflow-hidden p-2">
          <View className="mb-2 px-2 pt-1">
            <Text variant="caption" className="text-text-tertiary">
              {revealed
                ? `Full path · freeze was bar ${activeSession.freezeIndex + 1}`
                : `Visible window only · ${activeSession.visibleCandles.length} bars`}
            </Text>
          </View>
          <CandlestickChart
            candles={chartCandles}
            height={layout.isLandscape ? 320 : 260}
            symbol={activeSession.symbol}
          />
        </GlassCard>

        {!revealed ? (
          <>
            <SimulatorContextPanel
              context={activeSession.context}
              checklist={activeSession.checklist}
              onToggleChecklist={toggleCheck}
            />
            <GlassCard className="p-4">
              <Input
                label="Reasoning note (required for a strong Reasoning score)"
                value={activeSession.reasoningNote ?? ''}
                onChangeText={setReasoningNote}
                placeholder="What confirms? What invalidates? Why this action?"
                multiline
                numberOfLines={4}
              />
            </GlassCard>
            <SimulatorActionChooser disabled={isSubmitting} onChoose={(a) => void onChoose(a)} />
          </>
        ) : (
          <>
            <SimulatorRevealCard session={activeSession} />
            <Button
              variant="secondary"
              onPress={() => {
                clearActive();
                router.replace('/decision/simulator' as never);
              }}
            >
              Train another decision
            </Button>
          </>
        )}
      </View>
    </Screen>
  );
}
