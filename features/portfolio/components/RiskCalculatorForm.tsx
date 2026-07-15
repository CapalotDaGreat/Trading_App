import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { formatNumber, formatPrice } from '@/shared/utils/format';

import {
  calculatePositionSize,
  calculateRiskReward,
} from '../services/risk-calculator.service';

const riskCalculatorSchema = z.object({
  accountBalance: z.coerce.number().positive('Balance must be positive'),
  riskPercent: z.coerce.number().min(0.1).max(100, 'Max 100% risk'),
  entryPrice: z.coerce.number().positive('Entry must be positive'),
  stopLossPrice: z.coerce.number().positive('Stop loss must be positive'),
  takeProfitPrice: z.coerce.number().positive('Take profit must be positive'),
});

type RiskCalculatorFormValues = z.infer<typeof riskCalculatorSchema>;

interface RiskCalculatorFormProps {
  currency?: string;
}

export function RiskCalculatorForm({ currency = 'USD' }: RiskCalculatorFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RiskCalculatorFormValues>({
    resolver: zodResolver(riskCalculatorSchema),
    defaultValues: {
      accountBalance: 10000,
      riskPercent: 1,
      entryPrice: 100,
      stopLossPrice: 95,
      takeProfitPrice: 110,
    },
  });

  const values = watch();

  let positionResult = null;
  let riskRewardResult = null;
  let calculationError: string | null = null;

  try {
    positionResult = calculatePositionSize({
      accountBalance: values.accountBalance,
      riskPercent: values.riskPercent,
      entryPrice: values.entryPrice,
      stopLossPrice: values.stopLossPrice,
    });
    riskRewardResult = calculateRiskReward({
      entryPrice: values.entryPrice,
      stopLossPrice: values.stopLossPrice,
      takeProfitPrice: values.takeProfitPrice,
      positionSize: positionResult.positionSize,
    });
  } catch (error) {
    calculationError = error instanceof Error ? error.message : 'Invalid inputs';
  }

  return (
    <GlassCard className="p-4">
      <Text variant="h3" className="mb-4">
        Risk Calculator
      </Text>

      <View className="gap-3">
        <Controller
          control={control}
          name="accountBalance"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Account Balance"
              keyboardType="decimal-pad"
              value={String(value)}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.accountBalance?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="riskPercent"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Risk Per Trade (%)"
              keyboardType="decimal-pad"
              value={String(value)}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.riskPercent?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="entryPrice"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Entry Price"
              keyboardType="decimal-pad"
              value={String(value)}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.entryPrice?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="stopLossPrice"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Stop Loss"
              keyboardType="decimal-pad"
              value={String(value)}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.stopLossPrice?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="takeProfitPrice"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Take Profit"
              keyboardType="decimal-pad"
              value={String(value)}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.takeProfitPrice?.message}
            />
          )}
        />
      </View>

      <Button
        className="mt-4"
        variant="secondary"
        onPress={handleSubmit(() => undefined)}
      >
        Recalculate
      </Button>

      {calculationError ? (
        <Text variant="caption" className="mt-3 text-bearish">
          {calculationError}
        </Text>
      ) : positionResult && riskRewardResult ? (
        <View className="mt-4 gap-2 rounded-xl bg-surface p-3">
          <ResultRow
            label="Position Size"
            value={`${formatNumber(positionResult.positionSize, 0)} shares`}
          />
          <ResultRow
            label="Position Value"
            value={formatPrice(positionResult.positionValue, currency)}
          />
          <ResultRow
            label="Max Loss"
            value={formatPrice(positionResult.maxLoss, currency)}
          />
          <ResultRow
            label="Risk/Reward"
            value={`1:${formatNumber(riskRewardResult.riskRewardRatio, 2)}`}
          />
          <ResultRow
            label="Potential Reward"
            value={formatPrice(riskRewardResult.rewardAmount, currency)}
          />
        </View>
      ) : null}
    </GlassCard>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="body-sm">{label}</Text>
      <Text variant="mono">{value}</Text>
    </View>
  );
}
