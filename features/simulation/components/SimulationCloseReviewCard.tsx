import { useState } from 'react';

import type { SimulationCloseReview } from '@/features/simulation/types/simulation.types';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

interface SimulationCloseReviewCardProps {
  symbol: string;
  onSubmit: (review: SimulationCloseReview) => void;
  onJournal: () => void;
}

export function SimulationCloseReviewCard({ symbol, onSubmit, onJournal }: SimulationCloseReviewCardProps) {
  const [whatHappened, setWhatHappened] = useState('');
  const [behavedAsExpected, setBehavedAsExpected] = useState('');
  const [thesisCorrect, setThesisCorrect] = useState('');
  const [riskAppropriate, setRiskAppropriate] = useState('');
  const [wouldChange, setWouldChange] = useState('');

  return (
    <Surface className="mb-4" testID="simulate-close-review">
      <Text variant="label">Position closed</Text>
      <Text variant="body-sm" className="mt-2 text-text-secondary">
        Review your process for {symbol}. Simulated P/L is not the grade.
      </Text>
      <Input
        containerClassName="mt-3"
        label="What happened?"
        value={whatHappened}
        onChangeText={setWhatHappened}
        multiline
      />
      <Input
        containerClassName="mt-3"
        label="Did the market behave as expected?"
        value={behavedAsExpected}
        onChangeText={setBehavedAsExpected}
        multiline
      />
      <Input
        containerClassName="mt-3"
        label="Was your thesis correct?"
        value={thesisCorrect}
        onChangeText={setThesisCorrect}
        multiline
      />
      <Input
        containerClassName="mt-3"
        label="Was your risk appropriate?"
        value={riskAppropriate}
        onChangeText={setRiskAppropriate}
        multiline
      />
      <Input
        containerClassName="mt-3"
        label="What would you change?"
        value={wouldChange}
        onChangeText={setWouldChange}
        multiline
      />
      <Button
        className="mt-4"
        onPress={() =>
          onSubmit({
            whatHappened,
            behavedAsExpected,
            thesisCorrect,
            riskAppropriate,
            wouldChange,
          })
        }
      >
        Save review
      </Button>
      <Button className="mt-2" variant="ghost" onPress={onJournal}>
        Journal this close
      </Button>
    </Surface>
  );
}
