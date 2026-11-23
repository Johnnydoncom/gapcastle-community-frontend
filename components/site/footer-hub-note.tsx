import { getStates } from "@/lib/server/api";

/** Footer copy derived from the states that actually have an active pickup hub (Lagos only today). */
export async function FooterHubNote() {
  const names = await getStates()
    .then(({ data }) => data.filter((state) => state.pickup_available).map((state) => state.name.replace(" (FCT)", "")))
    .catch((): string[] => []);

  if (names.length === 0) return <>Collect from a Gratis Castle pickup hub.</>;
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  return <>Collect from our {list} hub{names.length === 1 ? "" : "s"}.</>;
}
