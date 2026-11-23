import "server-only";

import { cookies, headers } from "next/headers";
import { getStates, getViewer, locateArea } from "@/lib/server/api";

/** Cookie holding the visitor's chosen area: `{"lga":12,"state":25,"label":"Ikeja, Lagos"}`. */
export const AREA_COOKIE = "gc_area";

export type VisitorArea = {
  lgaId: number | null;
  stateId: number | null;
  label: string;
  /** Where the area came from — "default" means we're guessing, so the UI invites a choice. */
  source: "chosen" | "account" | "approximate" | "default";
};

/**
 * The visitor's area for "near me", in order of trust:
 *   1. the area they picked (cookie),
 *   2. their account's LGA / state,
 *   3. the hosting platform's approximate IP location (Vercel geo headers — no third-party lookup),
 *   4. Lagos, our launch state.
 * Only areas are used; exact positions are never stored.
 */
export async function getVisitorArea(): Promise<VisitorArea> {
  const chosen = parseAreaCookie((await cookies()).get(AREA_COOKIE)?.value);
  if (chosen) return chosen;

  const viewer = await getViewer().catch(() => null);
  const account = viewer?.data;
  if (account?.state?.id) {
    return {
      lgaId: account.lga?.id ?? null,
      stateId: account.state.id,
      label: [account.lga?.name, account.state.name].filter(Boolean).join(", "),
      source: "account",
    };
  }

  const requestHeaders = await headers();
  const lat = Number(requestHeaders.get("x-vercel-ip-latitude"));
  const lng = Number(requestHeaders.get("x-vercel-ip-longitude"));
  if (requestHeaders.get("x-vercel-ip-country") === "NG" && Number.isFinite(lat) && Number.isFinite(lng) && lat && lng) {
    const found = await locateArea(lat, lng).catch(() => null);
    if (found) {
      return { lgaId: found.data.lga.id, stateId: found.data.state.id, label: `${found.data.lga.name}, ${found.data.state.name}`, source: "approximate" };
    }
  }

  const lagos = await getStates()
    .then((response) => response.data.find((state) => state.code === "LA") ?? null)
    .catch(() => null);
  return { lgaId: null, stateId: lagos?.id ?? null, label: lagos?.name ?? "Lagos", source: "default" };
}

function parseAreaCookie(raw: string | undefined): VisitorArea | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as { lga?: unknown; state?: unknown; label?: unknown };
    const stateId = Number(value.state);
    if (!Number.isInteger(stateId) || stateId <= 0) return null;
    const lgaId = Number(value.lga);
    return {
      lgaId: Number.isInteger(lgaId) && lgaId > 0 ? lgaId : null,
      stateId,
      label: typeof value.label === "string" ? value.label.slice(0, 80) : "Your area",
      source: "chosen",
    };
  } catch {
    return null;
  }
}
