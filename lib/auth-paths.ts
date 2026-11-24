/** Public auth routes. Each has its own URL, title and description for search engines. */
export const LOGIN_PATH = "/login";
export const REGISTER_PATH = "/register";
export const FORGOT_PASSWORD_PATH = "/forgot-password";
export const RESET_PASSWORD_PATH = "/reset-password";

/** Only same-site paths are allowed as a post-sign-in destination (no open redirects). */
export function safeNext(next?: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/** Append `?next=` to an auth path, skipping it when the destination is the homepage. */
export function withNext(path: string, next?: string | null): string {
  const target = safeNext(next);
  return target === "/" ? path : `${path}?next=${encodeURIComponent(target)}`;
}

/** Sign-in URL that returns the member to `next` afterwards. */
export function loginHref(next?: string | null): string {
  return withNext(LOGIN_PATH, next);
}

/** Join URL that returns the new member to `next` after verifying their email. */
export function registerHref(next?: string | null): string {
  return withNext(REGISTER_PATH, next);
}

/**
 * Readable (non-httpOnly) hint cookie meaning "this browser has no session". It holds no
 * secret, only "1". The server sets it when the API says the visitor isn't signed in and
 * clears it on sign-in, so the browser can skip the "who am I?" call on every page load.
 * Without the hint the browser simply asks, so it can never sign a member out by mistake.
 */
export const GUEST_HINT_COOKIE = "gc_guest";

/** True when the guest hint is present (browser only). */
export function hasGuestHint(): boolean {
  return typeof document !== "undefined" && document.cookie.split("; ").includes(`${GUEST_HINT_COOKIE}=1`);
}
