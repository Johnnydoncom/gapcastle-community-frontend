"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { ApiError, api, authRequest } from "@/lib/api";
import { hasGuestHint } from "@/lib/auth-paths";
import type { Account, Session } from "@/lib/types";

export const SESSION_KEY = ["session"] as const;

type MeResponse = { data: Account; meta: { unread_notifications: number; unread_conversations: number } };

/**
 * The signed-in member (or null for visitors).
 *
 * Kept cheap on the hosting plan: every call here is a serverless function invocation.
 * - Visitors marked with the guest hint cookie make no request at all.
 * - Members refresh unread counts every 2 minutes while the tab is visible (React Query pauses
 *   polling in background tabs) and again when they come back to the tab.
 */
export function useSession() {
  const query = useQuery({
    queryKey: SESSION_KEY,
    queryFn: async (): Promise<Session | null> => {
      if (hasGuestHint()) return null;
      try {
        const response = await api.get<MeResponse>("auth/me");
        return {
          user: response.data,
          unreadNotifications: response.meta.unread_notifications,
          unreadConversations: response.meta.unread_conversations,
        };
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 60_000,
    refetchInterval: (query) => (query.state.data ? 120_000 : false),
    refetchOnWindowFocus: (query) => !!query.state.data,
  });

  return {
    session: query.data ?? null,
    user: query.data?.user ?? null,
    isLoading: query.isPending,
    refresh: query.refetch,
  };
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useCallback(async () => {
    await queryClient.cancelQueries();
    await authRequest("logout").catch(() => undefined);
    queryClient.clear();
    queryClient.setQueryData(SESSION_KEY, null);
    router.replace("/login");
    router.refresh();
  }, [queryClient, router]);
}

/** Seed the session cache right after sign in / join. */
export function sessionFromAccount(user: Account): Session {
  return { user, unreadNotifications: 0, unreadConversations: 0 };
}
