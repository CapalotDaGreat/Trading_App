import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import { debriefSimulation } from '../services/scenario-debrief.service';
import { publicScenarioView } from '../services/scenario-visibility.service';
import type { ScenarioDecisionOption } from '../types/scenario.types';
import type { SimulationAccount } from '../types/simulation.types';
import { SimulationDecisionCard } from './SimulationDecisionCard';
import { SimulationDebriefPanel } from './SimulationDebriefPanel';
import { SimulationTapeChart } from './SimulationTapeChart';

interface SimulationScenarioPanelProps {
  account: SimulationAccount;
  onAdvance: () => void;
  onAdvanceToInformation: () => void;
  onAnswerDecision: (windowId: string, option: ScenarioDecisionOption, reasoning?: string) => void;
}

export function SimulationScenarioPanel({
  account,
  onAdvance,
  onAdvanceToInformation,
  onAnswerDecision,
}: SimulationScenarioPanelProps) {
  const scenario = account.scenario;
  if (!scenario) return null;

  const view = publicScenarioView(scenario);
  const focusSymbol = view.assets[0]?.symbol ?? scenario.assets[0]?.symbol ?? 'BRIX';
  const focusName = view.assets[0]?.name ?? focusSymbol;
  const bars = view.visibleBars[focusSymbol] ?? [];
  const paused = view.clockMode === 'paused' && view.pendingDecision;
  const showDebrief = view.completed && account.transactions.length + account.decisions.length > 0;

  return (
    <View>
      <Surface className="mb-4" testID="simulate-scenario">
        <Text variant="label">Uncertain paper market</Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          Day {view.clockDay} of {Math.max(0, view.horizonDays - 1)}. This path was generated for this book.
          You cannot memorize the next session.
        </Text>
        <Text variant="caption" className="mt-2 text-text-tertiary">
          {view.observableTape}
        </Text>
        <Text variant="caption" className="mt-1 text-text-tertiary">
          {view.climateHint} Future headlines, candles, and prints stay hidden.
        </Text>
        <Text variant="caption" className="mt-1 text-text-tertiary">
          {view.practiceLevelHint}
        </Text>
        {view.trainingRationale ? (
          <Text variant="caption" className="mt-2 text-text-secondary">
            {view.trainingRationale}
          </Text>
        ) : null}
        {view.visibleEvents.length ? (
          <View className="mt-3 gap-2">
            {view.visibleEvents.map((event) => (
              <View key={event.id} className="rounded-xl bg-background px-3 py-2">
                <Text variant="caption" className="text-text-tertiary">
                  {event.resolved ? 'Resolved (educational)' : 'Incomplete information'}
                  {event.expectedValue && !event.resolved ? ` · Consensus guess: ${event.expectedValue}` : ''}
                </Text>
                <Text variant="body-sm" className="mt-1">
                  {event.title}
                </Text>
                <Text variant="body-sm" className="mt-1 text-text-secondary">
                  {event.resolved ? event.outcome : event.briefing}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text variant="caption" className="mt-3 text-text-tertiary">
            No scheduled headline is visible yet. Size as if something can still change.
          </Text>
        )}
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={Boolean(paused)}
            onPress={onAdvance}
          >
            Advance one simulated day
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={Boolean(paused)}
            onPress={onAdvanceToInformation}
          >
            Advance to next information
          </Button>
        </View>
        {paused ? (
          <Text variant="caption" className="mt-2 text-text-tertiary">
            Clock paused at a decision. Answer below — the future tape stays closed.
          </Text>
        ) : null}
      </Surface>

      <SimulationTapeChart symbol={focusSymbol} name={focusName} bars={bars} clockDay={view.clockDay} />

      {view.pendingDecision ? (
        <SimulationDecisionCard
          window={view.pendingDecision}
          onAnswer={(option, reasoning) => onAnswerDecision(view.pendingDecision!.id, option, reasoning)}
        />
      ) : null}

      {showDebrief ? <SimulationDebriefPanel debrief={debriefSimulation(account)} /> : null}
    </View>
  );
}
