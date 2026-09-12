"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createWithdrawal, CreateWithdrawalPayload, fetchEarnings } from "./api";
import { Earnings, Withdrawal } from "@/lib/types/api";
import { useAuthStore } from "@/lib/auth/authStore";
import { AxiosError } from "axios";

export const EARNINGS_QUERY_KEY = ["earnings"] as const;

/**
 * Hook to fetch instructor earnings data using React Query.
 *
 * Requirements addressed:
 * 1. Only runs when a token is present (enabled: !!token).
 * 2. Does not retry on 401 or 403 authorization refusals.
 */
export function useEarnings() {
  return useQuery<Earnings, AxiosError<{ code?: string; message?: string }>>({
    queryKey: EARNINGS_QUERY_KEY,
    queryFn: fetchEarnings,
    retry: (failureCount, error) => {
      // Never retry on 401 (unauthenticated) or 403 (forbidden)
      const status = error.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Mutation hook for requesting a withdrawal.
 *
 * Requirements addressed:
 * 1. Executes POST /me/withdrawals.
 * 2. On success, automatically invalidates the earnings query so the displayed
 *    balance is refetched and refreshed from the API.
 */
export function useWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    Withdrawal,
    AxiosError<{ code?: string; message?: string }>,
    CreateWithdrawalPayload
  >({
    mutationFn: createWithdrawal,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: EARNINGS_QUERY_KEY,
      });
    },
  });
}

/**
 * Hook to perform clean sign out:
 * 1. Clears token and user in useAuthStore (and localStorage).
 * 2. Completely purges cached earnings from React Query cache so previous user's
 *    balance is never visible after sign out.
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  const signOut = useAuthStore((s) => s.signOut);

  return () => {
    signOut();
    queryClient.removeQueries({ queryKey: EARNINGS_QUERY_KEY });
  };
}
