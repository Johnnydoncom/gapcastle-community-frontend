import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, backendUrl, sessionCookieOptions } from "@/lib/server/backend";

const ENDPOINTS: Record<string, string> = {
  login: "auth/login",
  register: "auth/register",
  logout: "auth/logout",
};

/**
 * Sign in, join and sign out. On success the API token is stored in an httpOnly cookie
 * and only the account details are returned to the browser.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/auth/[action]">) {
  const { action } = await ctx.params;
  const endpoint = ENDPOINTS[action];
  if (!endpoint) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (action === "logout") {
    if (token) {
      await fetch(backendUrl(endpoint), {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
    const response = NextResponse.json({ message: "Signed out." });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  const body = await request.json().catch(() => ({}));

  let upstream: Response;
  try {
    upstream = await fetch(backendUrl(endpoint), {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, device_name: "web" }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "We couldn't reach the Gap Castle service. Please try again in a moment." },
      { status: 503 },
    );
  }

  const payload = await upstream.json().catch(() => ({}));

  if (!upstream.ok || !payload.token) {
    return NextResponse.json(payload, { status: upstream.ok ? 500 : upstream.status });
  }

  const response = NextResponse.json({ user: payload.user }, { status: upstream.status });
  response.cookies.set(SESSION_COOKIE, payload.token, sessionCookieOptions);
  return response;
}
