"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** The current year, read only in the browser so prerendered pages stay deterministic. */
export function CurrentYear() {
  const year = useSyncExternalStore(subscribe, () => new Date().getFullYear(), () => null);
  return <>{year ?? ""}</>;
}
