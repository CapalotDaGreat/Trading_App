import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

import { EducationalModeBadge } from '../components/EducationalModeBadge';
import { EducationalPanel } from '../components/EducationalPanel';
import { EDUCATIONAL_MODE_MISSION } from '../content/educational-mode.content';

const SECTIONS: {
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    title: 'Learn',
    body: 'Academy paths teach usable skills with charts, exercises, and knowledge checks — not article dumps or get-rich slogans.',
    icon: 'school-outline',
  },
  {
    title: 'Practice',
    body: 'Short drills and replay rooms train judgment. A correct answer is the reasoning, not a predicted tick.',
    icon: 'fitness-outline',
  },
  {
    title: 'Simulate',
    body: 'Paper capital is labelled simulated. Default starting cash is $100,000 USD. Simulated P/L does not grade the decision.',
    icon: 'play-circle-outline',
  },
  {
    title: 'Review & Improve',
    body: 'Journal and Trading DNA come from records you kept. The question is what you learned about your process — not whether paper profit went up.',
    icon: 'film-outline',
  },
  {
    title: 'Decision Simulator',
    body: 'Practice Study / Wait / Ignore / Create Thesis with future candles hidden. Scores measure process quality — never profits.',
    icon: 'fitness-outline',
  },
  {
    title: 'Ask',
    body: 'The mentor explains concepts, evidence, and process. It does not invent headlines or issue buy/sell language.',
    icon: 'sparkles-outline',
  },
  {
    title: 'Trading Mentor',
    body: 'A long-term process coach that answers what to improve, what mistakes repeat, and what to focus on today. It never predicts markets or issues buy/sell language.',
    icon: 'compass-outline',
  },
  {
    title: 'How AI works',
    body: 'Ask explains concepts and process. Outputs can be incomplete or wrong. They are not predictions, signals, or personalised financial advice.',
    icon: 'sparkles-outline',
  },
  {
    title: 'Decision quality',
    body: 'Decision quality grades checklist and process completeness — evidence, invalidation, sizing rationale. It does not forecast whether a trade will profit.',
    icon: 'checkbox-outline',
  },
  {
    title: 'Research quality',
    body: 'Research quality asks whether the thesis, evidence, assumptions, and unknowns were written down. It is not a rank of trade opportunities.',
    icon: 'search-outline',
  },
  {
    title: 'Decision Replay',
    body: 'Replay helps you review process cues over time. End each session by asking what you learned — not whether you made money.',
    icon: 'play-back-outline',
  },
  {
    title: 'Decision Lab',
    body: 'Lab is simulated practice: no real money, no brokerage, no live execution. Thesis quality and discipline matter more than simulated P&L.',
    icon: 'flask-outline',
  },
  {
    title: 'Limitations of AI',
    body: 'Models and rules engines can hallucinate, omit context, or overweight recent data. Always verify independently.',
    icon: 'alert-circle-outline',
  },
  {
    title: 'Market uncertainty',
    body: 'Markets are uncertain. Good decisions come from discipline, risk limits, journaling, and patience — never from guaranteed outcomes.',
    icon: 'cloudy-outline',
  },
];

export function EducationalModeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Screen scrollable contentClassName="pb-12">
      <Header title="Educational Mode" onBack={() => router.back()} />

      <View className="mt-4 gap-4">
        <EducationalModeBadge size="md" />

        <GlassCard className="p-4" bordered>
          <Text variant="caption" className="font-semibold uppercase tracking-wide text-info">
            Mission
          </Text>
          <Text variant="body" className="mt-2 leading-relaxed text-text-primary">
            {EDUCATIONAL_MODE_MISSION}
          </Text>
          <Text variant="body-sm" className="mt-3 leading-relaxed text-text-secondary">
            Educational Mode is always on. It is not a popup disclaimer — it is how TradeAcademy is
            built: education, simulated practice, and honest review over brokerage or signals.
          </Text>
        </GlassCard>

        <EducationalPanel
          variant="practice"
          body="We celebrate checklist completion, risk management, journaling, patience, and following a plan. We never celebrate overtrading or gambling behaviour."
        />

        {SECTIONS.map((section) => (
          <GlassCard key={section.title} className="p-4">
            <View className="mb-2 flex-row items-center">
              <Ionicons name={section.icon} size={18} color={colors.info.primary} />
              <Text variant="label" className="ml-2 text-text-primary">
                {section.title}
              </Text>
            </View>
            <Text variant="body-sm" className="leading-relaxed text-text-secondary">
              {section.body}
            </Text>
          </GlassCard>
        ))}

        <EducationalPanel
          variant="risk"
          body="TradeAcademy does not execute trades, custody funds, or guarantee future performance. Simulated trading is not real money. You remain responsible for every live decision with your own broker."
          learnMoreHref="/legal/risk"
          learnMoreLabel="Read risk disclaimer"
        />
      </View>
    </Screen>
  );
}
