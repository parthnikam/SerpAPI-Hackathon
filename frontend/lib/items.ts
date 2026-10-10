export type Fact = { label: string; value: string };

export type Item = {
  title: string;
  url?: string;
  image?: string;
  snippet?: string;
  facts: Fact[];
};

const LIST_KEYS = [
  "shopping_results",
  "inline_shopping_results",
  "news_results",
  "jobs_results",
  "local_results",
  "organic_results",
];

const ENGINE_KEYS: Record<string, string[]> = {
  google: ["organic_results"],
  google_light: ["organic_results"],
  google_news: ["news_results"],
  google_shopping: ["shopping_results", "inline_shopping_results"],
  google_jobs: ["jobs_results"],
  google_maps: ["local_results", "place_results"],
  google_local: ["local_results", "place_results"],
};

const SKIP_LIST_KEYS = new Set([
  "related_questions",
  "related_searches",
  "pagination",
  "serpapi_pagination",
  "filters",
  "categories",
  "ads",
]);

const TITLE_KEYS = ["title", "name", "query"];
const URL_KEYS = ["link", "url", "product_link", "tracking_link", "website"];
const IMAGE_KEYS = ["thumbnail", "thumbnail_large", "image", "original", "thumbnail_url", "serpapi_thumbnail"];
const SNIPPET_KEYS = ["snippet", "description", "about"];

const FACT_KEYS: [string, string][] = [
  ["price", "Price"],
  ["extracted_price", "Price"],
  ["source", "Source"],
  ["rating", "Rating"],
  ["reviews", "Reviews"],
  ["address", "Address"],
  ["type", "Type"],
  ["company_name", "Company"],
  ["location", "Location"],
  ["via", "Via"],
  ["date", "Date"],
  ["displayed_link", "Site"],
  ["extensions", "Details"],
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clip(text: string, max: number): string {
  const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function asText(value: unknown, max = 80): string | undefined {
  if (typeof value === "string") {
    const text = clip(value, max);
    return text || undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function pickText(record: Record<string, unknown>, keys: string[], max = 80): string | undefined {
  for (const key of keys) {
    const text = asText(record[key], max);
    if (text) return text;
  }
  return undefined;
}

function nestedName(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") return asText(value);
  if (!isRecord(value)) return undefined;
  return pickText(value, ["name", "title", "text"]);
}

function publicUrl(value: string | undefined): string | undefined {
  if (!value || !/^https?:\/\//i.test(value) || value.includes("serpapi.com")) return undefined;
  return value;
}

function factValue(value: unknown): string | undefined {
  const text = asText(value);
  if (text) return text;
  if (Array.isArray(value)) {
    const parts = value.map((entry) => asText(entry)).filter((entry): entry is string => Boolean(entry));
    return parts.length ? clip(parts.join(", "), 80) : undefined;
  }
  return nestedName(value);
}

function applyLink(record: Record<string, unknown>): string | undefined {
  if (!Array.isArray(record.apply_options)) return undefined;
  for (const option of record.apply_options) {
    if (!isRecord(option)) continue;
    const link = publicUrl(pickText(option, ["link", "url"], 400));
    if (link) return link;
  }
  return undefined;
}

function toItem(record: Record<string, unknown>): Item | undefined {
  const title = pickText(record, TITLE_KEYS, 180);
  if (!title) return undefined;
  const facts: Fact[] = [];
  const seen = new Set<string>();
  const push = (label: string, value: string | undefined) => {
    if (!value || seen.has(label)) return;
    seen.add(label);
    facts.push({ label, value });
  };
  for (const [key, label] of FACT_KEYS) {
    if (key in record) push(label, factValue(record[key]));
  }
  const detected = record.detected_extensions;
  if (isRecord(detected)) {
    for (const [key, value] of Object.entries(detected)) {
      push(key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()), asText(value));
    }
  }
  return {
    title,
    url: publicUrl(pickText(record, URL_KEYS, 400)) ?? applyLink(record),
    image: IMAGE_KEYS.map((key) => publicUrl(asText(record[key], 500))).find((url) => url),
    snippet: pickText(record, SNIPPET_KEYS, 280),
    facts: facts.slice(0, 6),
  };
}

function rowsFrom(value: unknown): Item[] {
  if (Array.isArray(value)) {
    const items: Item[] = [];
    for (const entry of value) {
      if (!isRecord(entry)) continue;
      if (Array.isArray(entry.stories)) {
        items.push(...rowsFrom(entry.stories));
        continue;
      }
      const item = toItem(entry);
      if (item) items.push(item);
    }
    return items;
  }
  if (!isRecord(value)) return [];
  if (Array.isArray(value.places)) return rowsFrom(value.places);
  const item = toItem(value);
  return item ? [item] : [];
}

export function extractItems(results: Record<string, unknown> | null | undefined, engine?: string): Item[] {
  if (!results) return [];
  const keys = [...(engine ? ENGINE_KEYS[engine] ?? [] : []), ...LIST_KEYS];
  const seen = new Set<string>();
  for (const key of keys) {
    if (seen.has(key)) continue;
    seen.add(key);
    const items = rowsFrom(results[key]);
    if (items.length) return items.slice(0, 8);
  }
  const place = rowsFrom(results.place_results);
  if (place.length) return place.slice(0, 8);
  for (const [key, value] of Object.entries(results)) {
    if (SKIP_LIST_KEYS.has(key)) continue;
    const items = rowsFrom(value);
    if (items.length) return items.slice(0, 8);
  }
  return rowsFrom(results).slice(0, 8);
}
