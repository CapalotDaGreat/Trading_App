import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

import type { CreateAlertInput } from '../services/alert.service';

const createAlertSchema = z.object({
  symbol: z.string().min(1, 'Symbol required').max(10),
  targetPrice: z.coerce.number().positive('Price must be positive'),
  condition: z.enum(['above', 'below']),
  note: z.string().max(200).optional(),
});

type CreateAlertFormValues = z.infer<typeof createAlertSchema>;

interface CreateAlertFormProps {
  onSubmit: (input: CreateAlertInput) => Promise<void>;
  isSubmitting?: boolean;
  disabled?: boolean;
  /** Capability-aware delivery note shown at create time. */
  deliveryHint?: string;
}

export function CreateAlertForm({
  onSubmit,
  isSubmitting,
  disabled,
  deliveryHint,
}: CreateAlertFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAlertFormValues>({
    resolver: zodResolver(createAlertSchema),
    defaultValues: {
      symbol: '',
      targetPrice: 0,
      condition: 'above',
      note: '',
    },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      symbol: values.symbol,
      targetPrice: values.targetPrice,
      condition: values.condition,
      note: values.note,
    });
    reset();
  });

  return (
    <GlassCard className="p-4">
      <Text variant="h3" className="mb-4">
        Create Price Alert
      </Text>

      <View className="gap-3">
        <Controller
          control={control}
          name="symbol"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Symbol"
              autoCapitalize="characters"
              placeholder="AAPL"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.symbol?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="targetPrice"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Target Price"
              keyboardType="decimal-pad"
              value={value ? String(value) : ''}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.targetPrice?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="condition"
          render={({ field: { onChange, value } }) => (
            <View>
              <Text variant="label" className="mb-2">
                Condition
              </Text>
              <View className="flex-row gap-2">
                {(['above', 'below'] as const).map((option) => (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    onPress={() => onChange(option)}
                    className={cn(
                      'flex-1 rounded-xl border py-2',
                      value === option
                        ? 'border-border-strong bg-accent-muted'
                        : 'border-border bg-surface',
                    )}
                  >
                    <Text
                      variant="body-sm"
                      className={cn(
                        'text-center font-medium',
                        value === option ? 'text-accent' : 'text-text-secondary',
                      )}
                    >
                      {option === 'above' ? 'Price Above' : 'Price Below'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="note"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Note (optional)"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.note?.message}
            />
          )}
        />
      </View>

      {deliveryHint ? (
        <Text variant="caption" className="mt-3 leading-relaxed text-text-tertiary">
          {deliveryHint}
        </Text>
      ) : null}

      <Button
        className="mt-4"
        loading={isSubmitting}
        disabled={disabled}
        onPress={submit}
        fullWidth
      >
        Create Alert
      </Button>
    </GlassCard>
  );
}
