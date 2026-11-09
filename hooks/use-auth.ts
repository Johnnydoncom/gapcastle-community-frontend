"use client";

import { useSession } from "./use-session";

/**
 * Same shape as gapcastle-lovable/src/hooks/use-auth.ts, backed by the Laravel session
 * instead of Supabase, so the ported Lovable screens can use it unchanged.
 */
export type AuthState = {
  userId: string | null;
  email: string | null;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    location: string | null;
    bio: string | null;
  } | null;
  isAdmin: boolean;
  isModerator: boolean;
  loading: boolean;
};

export function useAuth(): AuthState {
  const { user, isLoading } = useSession();

  if (!user) {
    return { userId: null, email: null, profile: null, isAdmin: false, isModerator: false, loading: isLoading };
  }

  return {
    userId: String(user.id),
    email: user.email,
    profile: {
      id: String(user.id),
      full_name: user.name,
      avatar_url: user.avatar_url,
      location: user.location,
      bio: user.bio,
    },
    isAdmin: user.is_admin,
    isModerator: user.is_moderator,
    loading: false,
  };
}
