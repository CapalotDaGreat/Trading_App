import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/useAuth';

import { buildAiLearningMemory } from '../services/ai-memory.service';

export function useAiLearningMemory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ai', 'learning-memory', user?.uid ?? 'guest'] as const,
    queryFn: () => buildAiLearningMemory(user?.uid),
    staleTime: 60_000,
  });
}
