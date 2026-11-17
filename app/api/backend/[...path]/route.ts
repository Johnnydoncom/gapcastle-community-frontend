import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, backendUrl } from "@/lib/server/backend";

/**
 * Same-origin proxy to the Laravel API. It forwards the request and attaches the member's
 * bearer token from the httpOnly session cookie, so tokens never reach browser JavaScript
 * and no CORS configuration is needed.
 */
async function forward(request: NextRequest, ctx: RouteContext<"/api/backend/[...path]">) {
  const { path } = await ctx.params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  const headers = new Headers({ Accept: "application/json" });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) headers.set("X-Forwarded-For", forwardedFor);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const target = `${backendUrl(path.map(encodeURIComponent).join("/"))}${request.nextUrl.search}`;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return NextResponse.json(
      { message: "We couldn't reach the Gratis Castle service. Please try again in a moment." },
      { status: 503 },
    );
  }

  const body = upstream.status === 204 ? null : await upstream.arrayBuffer();
  const response = new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });

  // A rejected token means the session has ended — clear the stale cookie.
  if (upstream.status === 401 && token) {
    response.cookies.delete(SESSION_COOKIE);
  }

  return response;
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
