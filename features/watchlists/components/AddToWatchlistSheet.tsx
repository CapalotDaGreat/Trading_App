import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { getTierLimits } from '@/shared/constants/subscription';
import { cn } from '@/shared/utils/cn';

import { useWatchlists } from '../hooks/useWatchlists';
import type { Watchlist } from '../services/watchlist.service';

interface AddToWatchlistSheetProps {
  visible: boolean;
  symbol: string;
  onClose: () => void;
  onAdded?: (watchlist: Watchlist) => void;
}

export function AddToWatchlistSheet({
  visible,
  symbol,
  onClose,
  onAdded,
}: AddToWatchlistSheetProps) {
  const { watchlists, createWatchlist, addSymbol, tier, isCreating } = useWatchlists();
  const [newListName, setNewListName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const limits = getTierLimits(tier);

  const handleAddToExisting = async (watchlistId: string) => {
    try {
      setError(null);
      const updated = await addSymbol({ watchlistId, symbol });
      onAdded?.(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add symbol');
    }
  };

  const handleCreateAndAdd = async () => {
    try {
      setError(null);
      const created = await createWatchlist({ name: newListName, symbols: [symbol] });
      onAdded?.(created);
      setNewListName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create watchlist');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/60" onPress={onClose}>
        <Pressable
          className="max-h-[80%] rounded-t-3xl border-t border-border bg-background px-4 pb-8 pt-4"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-border" />
          <Text variant="h3" className="mb-1">
            Add to Watchlist
          </Text>
          <Text variant="body-sm" className="mb-4">
            {symbol} · {watchlists.length}/{limits.watchlistMax} lists
          </Text>

          {error ? (
            <Text variant="caption" className="mb-3 text-bearish">
              {error}
            </Text>
          ) : null}

          <ScrollView className="max-h-48">
            {watchlists.map((list) => {
              const hasSymbol = list.symbols.includes(symbol.toUpperCase());
              return (
                <Pressable
                  key={list.id}
                  onPress={() => !hasSymbol && handleAddToExisting(list.id)}
                  disabled={hasSymbol}
                  className={cn(
                    'mb-2 flex-row items-center justify-between rounded-xl border border-border p-3',
                    hasSymbol && 'opacity-50',
                  )}
                >
                  <Text variant="body" className="font-medium">
                    {list.name}
                  </Text>
                  <Text variant="caption">
                    {hasSymbol ? 'Added' : `${list.symbols.length} symbols`}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="mt-4 border-t border-border pt-4">
            <Text variant="label" className="mb-2">
              Create new watchlist
            </Text>
            <Input
              value={newListName}
              onChangeText={setNewListName}
              placeholder="Watchlist name"
              maxLength={100}
            />
            <Button
              className="mt-3"
              onPress={handleCreateAndAdd}
              loading={isCreating}
              disabled={!newListName.trim()}
              fullWidth
            >
              Create & Add
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
