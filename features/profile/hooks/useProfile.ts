import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { canUseFirestore } from '@/firebase/config';

import {
  createUserProfile,
  deleteUserProfile,
  getUserProfile,
  updateUserProfile,
  upsertUserProfile,
} from '../services/profile.service';
import type { CreateUserProfileInput, UpdateUserProfileInput } from '../types/profile.types';

const profileQueryKey = (uid: string | undefined) => ['profile', uid] as const;

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const uid = user?.uid;

  const profileQuery = useQuery({
    queryKey: profileQueryKey(uid),
    queryFn: () => getUserProfile(uid!),
    enabled: canUseFirestore(uid),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateUserProfileInput) => createUserProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey(profile.uid), profile);
    },
  });

  const upsertMutation = useMutation({
    mutationFn: (input: CreateUserProfileInput) => upsertUserProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey(profile.uid), profile);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ uid: profileUid, updates }: { uid: string; updates: UpdateUserProfileInput }) =>
      updateUserProfile(profileUid, updates),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey(profile.uid), profile);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (profileUid: string) => deleteUserProfile(profileUid),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: profileQueryKey(uid) });
    },
  });

  return {
    profile: profileQuery.data ?? null,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
    createProfile: createMutation.mutateAsync,
    upsertProfile: upsertMutation.mutateAsync,
    updateProfile: updateMutation.mutateAsync,
    deleteProfile: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
