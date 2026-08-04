import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

import type {
  CreateJournalEntryInput,
  JournalMistakeCategory,
  TradeDirection,
  TradeEmotion,
} from '../types/journal.types';

const journalSchema = z.object({
  symbol: z.string().min(1).max(10),
  direction: z.enum(['long', 'short']),
  entryPrice: z.coerce.number().min(0),
  exitPrice: z.union([z.coerce.number().positive(), z.literal('')]).optional(),
  quantity: z.coerce.number().min(0),
  stopLoss: z.union([z.coerce.number().positive(), z.literal('')]).optional(),
  takeProfit: z.union([z.coerce.number().positive(), z.literal('')]).optional(),
  strategy: z.string().max(100).optional(),
  tags: z.string().max(200).optional(),
  emotion: z.enum(['confident', 'fearful', 'greedy', 'neutral', 'fomo']).optional(),
  planAdhered: z.enum(['yes', 'no', 'unset']).optional(),
  mistakeCategory: z
    .enum(['invalidation', 'fomo', 'size', 'revenge', 'no_plan', 'regime_mismatch', 'other', 'none'])
    .optional(),
  notes: z.string().min(1, 'Notes are required').max(2000),
  lessonsLearned: z.string().max(1000).optional(),
  improvementCommitment: z.string().max(500).optional(),
  linkedReplayHref: z.string().max(200).optional(),
});

type JournalFormValues = z.infer<typeof journalSchema>;

interface JournalFormProps {
  onSubmit: (input: CreateJournalEntryInput) => Promise<void>;
  isSubmitting?: boolean;
  initialSymbol?: string;
}

const EMOTIONS: TradeEmotion[] = ['confident', 'fearful', 'greedy', 'neutral', 'fomo'];
const DIRECTIONS: TradeDirection[] = ['long', 'short'];
const MISTAKES: Array<JournalMistakeCategory | 'none'> = [
  'none',
  'invalidation',
  'fomo',
  'size',
  'revenge',
  'no_plan',
  'regime_mismatch',
  'other',
];

export function JournalForm({ onSubmit, isSubmitting, initialSymbol = '' }: JournalFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      symbol: initialSymbol.toUpperCase(),
      direction: 'long',
      entryPrice: 0,
      exitPrice: '',
      quantity: 0,
      stopLoss: '',
      takeProfit: '',
      strategy: '',
      tags: '',
      emotion: 'neutral',
      planAdhered: 'unset',
      mistakeCategory: 'none',
      notes: '',
      lessonsLearned: '',
      improvementCommitment: '',
      linkedReplayHref: '',
    },
  });

  const submit = handleSubmit(async (values) => {
    const tags = (values.tags ?? '')
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean);
    await onSubmit({
      symbol: values.symbol,
      direction: values.direction,
      entryPrice: values.entryPrice,
      exitPrice: values.exitPrice ? Number(values.exitPrice) : undefined,
      quantity: values.quantity,
      stopLoss: values.stopLoss ? Number(values.stopLoss) : undefined,
      takeProfit: values.takeProfit ? Number(values.takeProfit) : undefined,
      strategy: values.strategy,
      tags,
      emotion: values.emotion,
      planAdhered:
        values.planAdhered === 'yes' ? true : values.planAdhered === 'no' ? false : undefined,
      mistakeCategory:
        values.mistakeCategory && values.mistakeCategory !== 'none'
          ? values.mistakeCategory
          : undefined,
      notes: values.notes,
      lessonsLearned: values.lessonsLearned,
      improvementCommitment: values.improvementCommitment?.trim() || undefined,
      linkedReplayHref: values.linkedReplayHref?.trim() || undefined,
    });
    reset();
  });

  return (
    <GlassCard className="p-4" testID="journal-form">
      <Text variant="h3" className="mb-1">
        Log decision
      </Text>
      <Text variant="caption" className="mb-4 text-text-tertiary">
        Process notes welcome — quantity can be 0 for research/skip journals.
      </Text>

      <View className="gap-3">
        <Controller
          control={control}
          name="symbol"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Symbol"
              autoCapitalize="characters"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.symbol?.message}
              testID="journal-symbol"
            />
          )}
        />

        <Controller
          control={control}
          name="direction"
          render={({ field: { onChange, value } }) => (
            <View>
              <Text variant="label" className="mb-2">
                Direction
              </Text>
              <View className="flex-row gap-2">
                {DIRECTIONS.map((dir) => (
                  <Pressable
                    key={dir}
                    accessibilityRole="button"
                    onPress={() => onChange(dir)}
                    className={cn(
                      'flex-1 rounded-xl border py-2',
                      value === dir ? 'border-border-strong bg-accent-muted' : 'border-border',
                    )}
                  >
                    <Text
                      variant="body-sm"
                      className={cn(
                        'text-center font-medium capitalize',
                        value === dir ? 'text-accent' : 'text-text-secondary',
                      )}
                    >
                      {dir}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Controller
              control={control}
              name="entryPrice"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Entry"
                  keyboardType="decimal-pad"
                  value={value ? String(value) : ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.entryPrice?.message}
                  testID="journal-entry-price"
                />
              )}
            />
          </View>
          <View className="flex-1">
            <Controller
              control={control}
              name="exitPrice"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Exit (optional)"
                  keyboardType="decimal-pad"
                  value={value ? String(value) : ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="quantity"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Quantity"
              keyboardType="decimal-pad"
              value={value ? String(value) : ''}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.quantity?.message}
              testID="journal-quantity"
            />
          )}
        />

        <Controller
          control={control}
          name="strategy"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Strategy"
              placeholder="Breakout, swing, etc."
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        <Controller
          control={control}
          name="tags"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Tags"
              placeholder="checklist, regime, patience"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              testID="journal-tags"
            />
          )}
        />

        <Controller
          control={control}
          name="emotion"
          render={({ field: { onChange, value } }) => (
            <View>
              <Text variant="label" className="mb-2">
                Emotion
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {EMOTIONS.map((emotion) => (
                  <Pressable
                    key={emotion}
                    accessibilityRole="button"
                    onPress={() => onChange(emotion)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5',
                      value === emotion ? 'border-border-strong bg-accent-muted' : 'border-border',
                    )}
                  >
                    <Text
                      variant="caption"
                      className={cn(
                        'capitalize',
                        value === emotion ? 'text-accent' : 'text-text-secondary',
                      )}
                    >
                      {emotion}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="planAdhered"
          render={({ field: { onChange, value } }) => (
            <View>
              <Text variant="label" className="mb-2">
                Plan adhered?
              </Text>
              <View className="flex-row gap-2">
                {(
                  [
                    ['yes', 'Yes'],
                    ['no', 'No'],
                    ['unset', 'N/A'],
                  ] as const
                ).map(([key, label]) => (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    onPress={() => onChange(key)}
                    className={cn(
                      'flex-1 rounded-xl border py-2',
                      value === key ? 'border-border-strong bg-accent-muted' : 'border-border',
                    )}
                  >
                    <Text
                      variant="body-sm"
                      className={cn(
                        'text-center',
                        value === key ? 'text-accent' : 'text-text-secondary',
                      )}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="mistakeCategory"
          render={({ field: { onChange, value } }) => (
            <View>
              <Text variant="label" className="mb-2">
                Mistake category
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {MISTAKES.map((mistake) => (
                  <Pressable
                    key={mistake}
                    accessibilityRole="button"
                    onPress={() => onChange(mistake)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5',
                      value === mistake ? 'border-border-strong bg-accent-muted' : 'border-border',
                    )}
                  >
                    <Text
                      variant="caption"
                      className={cn(
                        'capitalize',
                        value === mistake ? 'text-accent' : 'text-text-secondary',
                      )}
                    >
                      {mistake === 'none' ? 'None' : mistake.replace('_', ' ')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Decision notes"
              multiline
              numberOfLines={4}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.notes?.message}
              inputClassName="min-h-[80px]"
              testID="journal-notes"
            />
          )}
        />

        <Controller
          control={control}
          name="lessonsLearned"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Lessons learned"
              multiline
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        <Controller
          control={control}
          name="improvementCommitment"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Improvement commitment"
              placeholder="One process change for next time"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        <Controller
          control={control}
          name="linkedReplayHref"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Replay reference (optional)"
              placeholder="/decision/replay-tv or Process Tape path"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
      </View>

      <Button
        className="mt-4"
        loading={isSubmitting}
        onPress={submit}
        fullWidth
        testID="journal-save"
      >
        Save Entry
      </Button>
    </GlassCard>
  );
}
