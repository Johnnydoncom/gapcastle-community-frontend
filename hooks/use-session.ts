"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { ApiError, api, authRequest } from "@/lib/api";
import type { Account, Session } from "@/lib/types";

export const SESSION_KEY = ["session"] as const;

type MeResponse = { data: Account; meta: { unread_notifications: number; unread_conversations: number } };

/** The signed-in member (or null for visitors), refreshed every minute for unread counts. */
export function useSession() {
  const query = useQuery({
    queryKey: SESSION_KEY,
    queryFn: async (): Promise<Session | null> => {
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
    staleTime: 30_000,
    refetchInterval: 60_000,
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
    router.replace("/auth");
    router.refresh();
  }, [queryClient, router]);
}

/** Seed the session cache right after sign in / join. */
export function sessionFromAccount(user: Account): Session {
  return { user, unreadNotifications: 0, unreadConversations: 0 };
}
