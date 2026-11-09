import "server-only";

export const SESSION_COOKIE = "gc_session";

/** Base URL of the Laravel API, e.g. http://localhost:8010 */
export function backendUrl(path: string): string {
  const base = (process.env.BACKEND_URL ?? "http://localhost:8010").replace(/\/$/, "");
  return `${base}/api/v1/${path.replace(/^\//, "")}`;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};
