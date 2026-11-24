import { NextResponse, type NextRequest } from "next/server";
import { AREA_COOKIE } from "@/lib/server/area";
import { BACKEND_TIMEOUT_MS, backendUrl } from "@/lib/server/backend";

export const maxDuration = 30;

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

type Body = { lat?: number; lng?: number; state_id?: number; lga_id?: number | null; label?: string };

/**
 * Save the visitor's "near me" area. Either a browser position (turned into the
 * nearest LGA by the API and then discarded) or a state/LGA picked from the list.
 * Only the area is kept, in a first-party cookie.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Body;

  if (typeof body.lat === "number" && typeof body.lng === "number") {
    const url = `${backendUrl("locate")}?lat=${body.lat.toFixed(3)}&lng=${body.lng.toFixed(3)}`;
    const upstream = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS) }).catch(() => null);
    const payload = upstream ? await upstream.json().catch(() => ({})) : {};
    if (!upstream?.ok || !payload?.data) {
      const firstError = payload?.errors ? (Object.values(payload.errors as Record<string, string[]>)[0]?.[0] ?? null) : null;
      return NextResponse.json({ message: firstError ?? payload?.message ?? "We couldn't work out your area. Please choose it from the list." }, { status: upstream?.status ?? 503 });
    }
    const area = { lga: payload.data.lga.id, state: payload.data.state.id, label: `${payload.data.lga.name}, ${payload.data.state.name}` };
    return withArea(area);
  }

  const stateId = Number(body.state_id);
  if (!Number.isInteger(stateId) || stateId <= 0) {
    return NextResponse.json({ message: "Please choose your state." }, { status: 422 });
  }
  const lgaId = Number(body.lga_id);
  const label = typeof body.label === "string" && body.label.trim() ? body.label.trim().slice(0, 80) : "Your area";

  return withArea({ lga: Number.isInteger(lgaId) && lgaId > 0 ? lgaId : null, state: stateId, label });
}

/** Forget the chosen area. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(AREA_COOKIE);
  return response;
}

function withArea(area: { lga: number | null; state: number; label: string }) {
  const response = NextResponse.json({ data: area });
  response.cookies.set(AREA_COOKIE, JSON.stringify(area), COOKIE_OPTIONS);
  return response;
}
