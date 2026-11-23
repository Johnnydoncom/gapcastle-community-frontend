/**
 * JSON-LD helpers shared by the public pages and the admin editor.
 *
 * Every structured-data block on the site goes through `serializeJsonLd`, which
 * escapes characters that could end the surrounding <script> tag — listing titles,
 * member names and bios are user-supplied text.
 */

export type JsonLdNode = Record<string, unknown>;

const SCHEMA_CONTEXTS = new Set(["https://schema.org", "http://schema.org", "https://schema.org/", "http://schema.org/"]);
export const MAX_CUSTOM_NODES = 20;

/** JSON for a <script type="application/ld+json"> body, safe against `</script>` and HTML-sensitive characters. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function isObject(value: unknown): value is JsonLdNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Flatten a node, a list of nodes or an `@graph` wrapper into plain nodes (without their own `@context`). */
export function toNodes(data: unknown): JsonLdNode[] {
  if (!data) return [];
  if (Array.isArray(data)) return data.flatMap(toNodes);
  if (!isObject(data)) return [];
  if (Array.isArray(data["@graph"])) return toNodes(data["@graph"]);
  const { ["@context"]: _context, ...node } = data;
  void _context;
  return [node];
}

export function nodeTypes(node: JsonLdNode): string[] {
  const type = node["@type"];
  return (Array.isArray(type) ? type : [type]).filter((value): value is string => typeof value === "string");
}

/** Drop properties set to null — that is how an admin removes a built-in property. */
function withoutNulls(node: JsonLdNode): JsonLdNode {
  return Object.fromEntries(Object.entries(node).filter(([, value]) => value !== null));
}

/**
 * Merge custom nodes from Admin › Pages & SEO into a page's built-in nodes.
 * A custom node updates the built-in node with the same `@id`, otherwise the first
 * built-in node with the same `@type`: its properties win, untouched built-in
 * properties (contact details, social links…) are kept, and a property set to
 * null is removed. Anything else is added to the page.
 */
export function mergeJsonLd(builtIn: JsonLdNode[], custom: JsonLdNode[]) {
  const nodes = [...builtIn];
  const matchedIndexes = new Set<number>();
  const updated: string[] = [];
  const added: string[] = [];

  for (const node of custom) {
    const id = typeof node["@id"] === "string" ? node["@id"] : null;
    const types = nodeTypes(node);
    let index = id ? nodes.findIndex((candidate, position) => position < builtIn.length && !matchedIndexes.has(position) && candidate["@id"] === id) : -1;
    if (index === -1) {
      index = nodes.findIndex((candidate, position) => position < builtIn.length && !matchedIndexes.has(position) && nodeTypes(candidate).some((type) => types.includes(type)));
    }
    if (index !== -1) {
      nodes[index] = withoutNulls({ ...nodes[index], ...node });
      matchedIndexes.add(index);
      updated.push(types.join(" / "));
    } else {
      nodes.push(withoutNulls(node));
      added.push(types.join(" / "));
    }
  }

  return { nodes, updated, added };
}

/** One problem with custom JSON-LD, mirroring the API's validation (App\Support\StructuredData). */
export function validateCustomJsonLd(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") return "Structured data must be a JSON object or a list of objects.";
  if (isObject(value) && "@graph" in value && !Array.isArray(value["@graph"])) return '"@graph" must be a list of objects.';
  const raw = Array.isArray(value) ? value : isObject(value) && Array.isArray(value["@graph"]) ? value["@graph"] : [value];
  if (raw.length > MAX_CUSTOM_NODES) return `Use at most ${MAX_CUSTOM_NODES} structured data items per page.`;
  for (const [index, node] of raw.entries()) {
    const label = `Item ${index + 1}`;
    if (!isObject(node)) return `${label} must be a JSON object such as {"@type": "FAQPage", …}.`;
    const context = node["@context"];
    if (context !== undefined && !(typeof context === "string" && SCHEMA_CONTEXTS.has(context))) return `${label}: "@context" must be "https://schema.org".`;
    const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
    if (!types.length || !types.every((type) => typeof type === "string" && /^[A-Z][A-Za-z0-9]{1,60}$/.test(type))) {
      return `${label} needs a schema.org "@type" such as "FAQPage", "Organization" or "Event".`;
    }
  }
  return null;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Plain text from the API's sanitised rich-text HTML. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(br|\/p|\/li|\/h[2-4]|\/blockquote)\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
      if (entity[0] === "#") {
        const code = entity[1]?.toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      return ENTITIES[entity.toLowerCase()] ?? match;
    })
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Questions and answers from FAQ content written in the editor: each heading
 * (H2/H3) is a question and the text below it, up to the next heading, its answer.
 */
export function faqItemsFromHtml(html: string): Array<{ question: string; answer: string }> {
  const parts = html.split(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
  const items: Array<{ question: string; answer: string }> = [];
  for (let index = 1; index < parts.length; index += 2) {
    const question = htmlToText(parts[index] ?? "");
    const answer = htmlToText(parts[index + 1] ?? "");
    if (question && answer) items.push({ question, answer });
  }
  return items;
}
