import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { CACHE_TAGS } from "@/lib/server/api";

/** Only these tags can be purged from outside. */
const ALLOWED_TAGS = new Set<string>([...Object.values(CACHE_TAGS), "sitemap"]);

function authorised(request: NextRequest): boolean {
  const secret = process.env.REVALIDATE_SECRET ?? "";
  const given = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (secret.length < 16 || given.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

/**
 * Purge shared public data after an admin edit. Called by the Laravel API
 * (App\Support\FrontendCache) with `Authorization: Bearer REVALIDATE_SECRET` and
 * `{ "tags": ["categories", ...] }`.
 *
 * Uses stale-while-revalidate ("max"): the next visitor still gets the old copy instantly
 * while a fresh one is built, so a purge never causes a burst of blocking renders.
 */
export async function POST(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { tags?: unknown };
  const tags = Array.isArray(body.tags) ? body.tags.filter((tag): tag is string => typeof tag === "string" && ALLOWED_TAGS.has(tag)) : [];

  for (const tag of new Set(tags)) {
    revalidateTag(tag, "max");
  }

  return NextResponse.json({ revalidated: [...new Set(tags)] });
}
