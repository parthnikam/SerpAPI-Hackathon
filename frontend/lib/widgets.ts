export type PlaceRow = {
  title: string;
  url?: string;
  kind?: string;
  price?: string;
  rating?: number;
  hours?: string;
  open?: boolean;
  address?: string;
  distance?: string;
  line?: string;
};

export type QuoteRow = {
  ticker: string;
  price: string;
  change?: string;
  percent?: string;
  up?: boolean;
  range?: number;
};

export type FilmRow = {
  title: string;
  url?: string;
  score?: number;
  meta?: string;
  line?: string;
};

export type CriticRow = {
  name: string;
  source?: string;
  line: string;
};

export type PersonRow = {
  name: string;
  url?: string;
  role?: string;
  line?: string;
  known?: string;
};

export type ReviewModel = {
  venue: string;
  average?: number;
  count?: number;
  bars: number[];
  quote?: string;
  reviews: { author: string; rating?: number; when?: string; line: string }[];
};

export type ProductRow = {
  title: string;
  url?: string;
  price?: string;
  source?: string;
  rating?: number;
  note?: string;
};

export type StoryRow = {
  title: string;
  url?: string;
  source?: string;
  when?: string;
  line?: string;
};

export type JobRow = {
  title: string;
  url?: string;
  company?: string;
  where?: string;
  posted?: string;
  tags: string[];
};

export type HotelRow = {
  name: string;
  url?: string;
  rate?: string;
  area?: string;
  rating?: number;
  perk?: string;
  distance?: string;
};

export type FlightRow = {
  airline: string;
  depart?: string;
  arrive?: string;
  from?: string;
  to?: string;
  stops: string;
  fare?: string;
  duration?: string;
  detail?: string;
};

export type SearchWidget =
  | { kind: "restaurants"; rows: PlaceRow[] }
  | { kind: "locations"; rows: PlaceRow[] }
  | { kind: "stocks"; rows: QuoteRow[] }
  | { kind: "movies"; films: FilmRow[]; critics: CriticRow[] }
  | { kind: "people"; rows: PersonRow[] }
  | { kind: "reviews"; review: ReviewModel }
  | { kind: "shopping"; rows: ProductRow[] }
  | { kind: "news"; rows: StoryRow[] }
  | { kind: "jobs"; rows: JobRow[] }
  | { kind: "hotels"; rows: HotelRow[] }
  | { kind: "flights"; rows: FlightRow[] };

export const WIDGET_LAYOUTS: Record<
  SearchWidget["kind"],
  readonly [{ name: string; note: string }, { name: string; note: string }]
> = {
  restaurants: [
    { name: "Place cards", note: "Rating, price, and hours on each venue." },
    { name: "Open list", note: "Status dot, distance, and score in a row." },
  ],
  stocks: [
    { name: "Quote board", note: "One stat per ticker, colored by the day's move." },
    { name: "Watchlist", note: "Price, change badge, and where the day sits in its range." },
  ],
  movies: [
    { name: "Score cards", note: "Critic score beside the title and a one-line consensus." },
    { name: "Critic thread", note: "Each review is a chat bubble with the writer's name." },
  ],
  people: [
    { name: "Profiles", note: "Initials, role, and a one-line bio." },
    { name: "Directory", note: "Name, role, and what they are known for." },
  ],
  locations: [
    { name: "Pin cards", note: "Distance sits on the corner of each place." },
    { name: "Route", note: "Stops in order, with distance on the timeline." },
  ],
  reviews: [
    { name: "Score breakdown", note: "Overall rating and how the stars are spread." },
    { name: "Review thread", note: "Each review opens on its own." },
  ],
  shopping: [
    { name: "Price tiles", note: "Name, store, rating, and a large price." },
    { name: "Compare", note: "Product, price, store, rating, and a short note." },
  ],
  news: [
    { name: "Front page", note: "One lead story, then the rest as a menu." },
    { name: "Wire", note: "Source, age, headline, and a single sentence." },
  ],
  jobs: [
    { name: "Postings", note: "Title, company, place, and tags such as remote." },
    { name: "Board", note: "Company mark, title, and location on one row." },
  ],
  hotels: [
    { name: "Stay cards", note: "Nightly rate, area, rating, and one perk." },
    { name: "Rate list", note: "Scan names against the price on the right." },
  ],
  flights: [
    { name: "Itinerary", note: "Depart, the flight itself, then arrival." },
    { name: "Fares", note: "Airline, times, stops, and price." },
  ],
};

const MAX_ROWS = 8;
const FOOD_KIND = /coffee|cafe|café|restaurant|diner|bakery|pizza|bar\b|food|bistro|pub|kitchen|grill|tea|dessert|ice cream/i;
const FOOD_QUERY = /\b(restaurants?|cafes?|cafés?|coffee shops?|diners?|baker(?:y|ies)|pizza|brunch|bistros?|eateries|eatery|bars?)\b/i;
const SHOP_QUERY = /\b(buy|shop|shopping|price|prices|deal|deals|under)\b|[$₹€£]\s?\d/i;
const NEWS_QUERY = /\b(news|headlines?)\b/i;
const JOB_QUERY = /\b(jobs?|hiring|careers?)\b/i;
const HOTEL_QUERY = /\bhotels?\b/i;
const FLIGHT_QUERY = /\bflights?\b/i;
const STOCK_QUERY = /\b(stocks?|shares?|ticker|nasdaq|nyse)\b/i;
const MOVIE_QUERY = /\b(movies?|films?|cinema)\b/i;
const PERSON_QUERY = /\b(who is|who was|biography)\b/i;
const PERSON_TYPE =
  /actor|actress|singer|rapper|author|writer|poet|scientist|mathematician|physicist|politician|president|athlete|player|footballer|artist|painter|director|composer|entrepreneur|philosopher|inventor|engineer|person\b|monarch|celebrity/i;
const NOT_PERSON =
  /company|organization|corporation|brand|product|software|website|film|movie|tv|series|restaurant|hotel|cafe|city|country|place|landmark|building|food|beverage|drink|album|song|book|game|university/i;
const MOVIE_TYPE = /film|movie|tv series|tv show/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clip(text: string, max: number): string {
  const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function asText(value: unknown, max = 180): string | undefined {
  if (typeof value === "string") {
    const text = clip(value, max);
    return text || undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function publicUrl(value: unknown): string | undefined {
  const text = asText(value, 500);
  if (!text || !/^https?:\/\//i.test(text) || text.includes("serpapi.com")) return undefined;
  return text;
}

function named(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") return asText(value);
  if (!isRecord(value)) return undefined;
  return asText(value.name) ?? asText(value.title) ?? asText(value.text);
}

function recordList(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];
  if (Array.isArray(value.places)) return value.places.filter(isRecord);
  if (typeof value.title === "string" || typeof value.name === "string") return [value];
  return [];
}

function newsRecords(value: unknown): Record<string, unknown>[] {
  const stories: Record<string, unknown>[] = [];
  for (const row of recordList(value)) {
    if (Array.isArray(row.stories)) {
      stories.push(...row.stories.filter(isRecord));
      continue;
    }
    stories.push(row);
  }
  return stories;
}

function numberOf(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function hostOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function cleanTitle(title: string): string {
  return title.split(/\s+[-|–—]\s+/)[0]?.trim() || title;
}

function clock(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const ampm = value.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
  if (ampm) return `${Number(ampm[1])}:${ampm[2]} ${ampm[3].toUpperCase()}`;
  const hm = value.match(/(\d{1,2}):(\d{2})/);
  if (!hm) return value;
  let hour = Number(hm[1]);
  if (hour > 23) return `${hm[1]}:${hm[2]}`;
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${hm[2]} ${suffix}`;
}

function durationLabel(minutes: number | undefined): string | undefined {
  if (minutes == null || minutes <= 0) return undefined;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && rest) return `${hours}h ${rest}m`;
  if (hours) return `${hours}h`;
  return `${rest}m`;
}

function dollars(amount: number): string {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

function money(value: unknown, extracted?: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return dollars(value);
  const text = asText(value, 40);
  if (text) return text;
  const amount = numberOf(extracted);
  return amount == null ? undefined : dollars(amount);
}

function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return asText(value, 80);
  if (!Array.isArray(value)) return undefined;
  for (const entry of value) {
    const text = typeof entry === "string" ? asText(entry, 80) : named(entry);
    if (text) return text;
  }
  return undefined;
}

function ratingOf(value: unknown): number | undefined {
  const rating = numberOf(value);
  if (rating == null || rating <= 0 || rating > 5) return undefined;
  return Math.round(rating * 10) / 10;
}

function scoreOf(value: unknown): number | undefined {
  const rating = numberOf(value);
  if (rating == null || rating <= 0) return undefined;
  if (rating <= 5) return Math.round(rating * 20);
  if (rating <= 10) return Math.round(rating * 10);
  if (rating <= 100) return Math.round(rating);
  return undefined;
}

function linkFrom(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const url = publicUrl(record[key]);
    if (url) return url;
  }
  const links = record.links;
  if (isRecord(links)) {
    return publicUrl(links.website) ?? publicUrl(links.directions);
  }
  return undefined;
}

function placeRows(results: Record<string, unknown>): PlaceRow[] {
  const source = recordList(results.local_results).length
    ? recordList(results.local_results)
    : recordList(results.place_results);
  const rows: PlaceRow[] = [];
  for (const record of source) {
    const title = asText(record.title, 160) ?? asText(record.name, 160);
    if (!title) continue;
    const hours = asText(record.hours, 60) ?? asText(record.open_state, 60);
    const openText = hours ?? "";
    let open: boolean | undefined;
    if (/\bclosed\b/i.test(openText) || /\bopens\b/i.test(openText)) open = false;
    else if (/\bopen\b/i.test(openText)) open = true;
    const kind = asText(record.type, 40) ?? firstString(record.types);
    const price = asText(record.price, 20);
    rows.push({
      title,
      url: linkFrom(record, ["link", "website", "url"]),
      kind,
      price,
      rating: ratingOf(record.rating),
      hours,
      open,
      address: asText(record.address, 120),
      distance: asText(record.distance, 40),
      line: asText(record.description, 140) ?? asText(record.snippet, 140),
    });
    if (rows.length >= MAX_ROWS) break;
  }
  return rows;
}

function quoteFrom(record: Record<string, unknown>): QuoteRow | undefined {
  const movement = isRecord(record.price_movement) ? record.price_movement : {};
  const price = money(record.price, record.extracted_price);
  const ticker = (asText(record.stock, 40) ?? asText(record.name, 40) ?? asText(record.title, 40))?.split(":")[0];
  if (!price || !ticker) return undefined;
  const direction = asText(movement.movement, 20)?.toLowerCase();
  const rawPercent = numberOf(movement.percentage);
  const rawDelta = numberOf(movement.value);
  const up = direction === "up" ? true : direction === "down" ? false : rawPercent != null ? rawPercent >= 0 : undefined;
  const percent = signedAmount(rawPercent, up);
  const delta = signedAmount(rawDelta, up);
  return {
    ticker,
    price,
    change: delta == null ? undefined : `${delta > 0 ? "+" : ""}${delta}`,
    percent: percent == null ? undefined : `${percent > 0 ? "+" : ""}${percent}%`,
    up,
  };
}

function signedAmount(value: number | undefined, up: boolean | undefined): number | undefined {
  if (value == null) return undefined;
  if (up === false) return -Math.abs(value);
  if (up === true) return Math.abs(value);
  return value;
}

function rangePercent(text: string | undefined, price: string | undefined): number | undefined {
  if (!text || !price) return undefined;
  const match = text.match(/(-?\d[\d,.]*)\s*[-–]\s*(-?\d[\d,.]*)/);
  const current = numberOf(price);
  if (!match || current == null) return undefined;
  const low = Number(match[1].replace(/,/g, ""));
  const high = Number(match[2].replace(/,/g, ""));
  if (!(high > low)) return undefined;
  return Math.round(Math.max(0, Math.min(100, ((current - low) / (high - low)) * 100)));
}

function stockRows(results: Record<string, unknown>): QuoteRow[] {
  const rows: QuoteRow[] = [];
  const summary = isRecord(results.summary) ? quoteFrom(results.summary) : undefined;
  if (summary) {
    const kg = isRecord(results.knowledge_graph) ? results.knowledge_graph : {};
    const stats = isRecord(kg.key_stats) && Array.isArray(kg.key_stats.stats) ? kg.key_stats.stats : [];
    const day = stats.find((stat) => isRecord(stat) && /day range/i.test(asText(stat.label, 40) ?? ""));
    summary.range = rangePercent(isRecord(day) ? asText(day.value ?? day.description, 40) : undefined, summary.price);
    rows.push(summary);
  }
  if (isRecord(results.markets)) {
    for (const value of Object.values(results.markets)) {
      for (const record of recordList(value)) {
        const quote = quoteFrom(record);
        if (!quote || rows.some((row) => row.ticker === quote.ticker)) continue;
        rows.push(quote);
        if (rows.length >= MAX_ROWS) return rows;
      }
    }
  }
  return rows;
}

function productRows(results: Record<string, unknown>): ProductRow[] {
  const source = recordList(results.shopping_results).length
    ? recordList(results.shopping_results)
    : recordList(results.inline_shopping_results);
  const rows: ProductRow[] = [];
  for (const record of source) {
    const title = asText(record.title, 160);
    if (!title) continue;
    rows.push({
      title,
      url: linkFrom(record, ["product_link", "link", "tracking_link"]),
      price: money(record.price, record.extracted_price),
      source: named(record.source),
      rating: ratingOf(record.rating),
      note: firstString(record.extensions) ?? asText(record.delivery, 80) ?? asText(record.snippet, 80),
    });
    if (rows.length >= MAX_ROWS) break;
  }
  return rows;
}

function storyRows(results: Record<string, unknown>, includeTop: boolean): StoryRow[] {
  const source = newsRecords(results.news_results);
  const rows = source.length || !includeTop ? source : newsRecords(results.top_stories);
  const stories: StoryRow[] = [];
  for (const record of rows) {
    const title = asText(record.title, 180);
    if (!title) continue;
    const url = linkFrom(record, ["link", "url"]);
    stories.push({
      title,
      url,
      source: named(record.source) ?? hostOf(url),
      when: asText(record.date, 40) ?? asText(record.published, 40),
      line: asText(record.snippet, 180),
    });
    if (stories.length >= MAX_ROWS) break;
  }
  return stories;
}

function jobRows(results: Record<string, unknown>): JobRow[] {
  const rows: JobRow[] = [];
  for (const record of recordList(results.jobs_results)) {
    const title = asText(record.title, 160);
    if (!title) continue;
    const detected = isRecord(record.detected_extensions) ? record.detected_extensions : {};
    const tags: string[] = [];
    const schedule = asText(detected.schedule_type, 40);
    if (schedule) tags.push(schedule);
    if (detected.work_from_home === true) tags.push("Remote");
    const salary = asText(detected.salary, 40);
    if (salary) tags.push(salary);
    if (Array.isArray(record.extensions)) {
      for (const entry of record.extensions) {
        const text = asText(entry, 40);
        if (text && !tags.includes(text)) tags.push(text);
      }
    }
    const apply = Array.isArray(record.apply_options) ? record.apply_options.find(isRecord) : undefined;
    rows.push({
      title,
      url: (apply ? publicUrl(apply.link) : undefined) ?? linkFrom(record, ["link", "url"]),
      company: asText(record.company_name, 80),
      where: asText(record.location, 80),
      posted: asText(detected.posted_at, 40),
      tags: tags.slice(0, 4),
    });
    if (rows.length >= MAX_ROWS) break;
  }
  return rows;
}

function hotelRows(results: Record<string, unknown>): HotelRow[] {
  const rows: HotelRow[] = [];
  for (const record of recordList(results.properties)) {
    const name = asText(record.name, 160) ?? asText(record.title, 160);
    const rateRecord = isRecord(record.rate_per_night) ? record.rate_per_night : isRecord(record.total_rate) ? record.total_rate : {};
    const rate = money(rateRecord.lowest ?? record.price, rateRecord.extracted_lowest ?? record.extracted_price);
    if (!name || !rate) continue;
    const nearby = recordList(record.nearby_places)[0];
    const ride = nearby && Array.isArray(nearby.transportations) ? nearby.transportations.find(isRecord) : undefined;
    rows.push({
      name,
      url: linkFrom(record, ["link", "url"]),
      rate,
      area: asText(record.neighborhood, 80) ?? (nearby ? asText(nearby.name, 80) : undefined) ?? asText(record.address, 80),
      rating: ratingOf(record.overall_rating ?? record.rating),
      perk: firstString(record.essential_info) ?? firstString(record.amenities),
      distance: ride ? asText(ride.duration, 40) : asText(record.distance, 40),
    });
    if (rows.length >= MAX_ROWS) break;
  }
  return rows;
}

function airport(value: unknown): { id?: string; time?: string } {
  if (!isRecord(value)) return {};
  return { id: asText(value.id, 12), time: clock(asText(value.time, 40)) };
}

function flightRows(results: Record<string, unknown>): FlightRow[] {
  const options = [...recordList(results.best_flights), ...recordList(results.other_flights)];
  const rows: FlightRow[] = [];
  for (const option of options) {
    const legs = recordList(option.flights);
    const first = legs[0];
    const last = legs[legs.length - 1] ?? first;
    if (!first) continue;
    const depart = airport(first.departure_airport);
    const arrive = airport(last.arrival_airport);
    const stopsCount = Array.isArray(option.layovers) ? option.layovers.length : Math.max(0, legs.length - 1);
    const airline = asText(first.airline, 40) ?? "Flight";
    const number = asText(first.flight_number, 20);
    const cabin = asText(first.travel_class, 40);
    rows.push({
      airline,
      depart: depart.time,
      arrive: arrive.time,
      from: depart.id,
      to: arrive.id,
      stops: stopsCount === 0 ? "Nonstop" : stopsCount === 1 ? "1 stop" : `${stopsCount} stops`,
      fare: money(option.price, option.extracted_price),
      duration: durationLabel(numberOf(option.total_duration) ?? numberOf(first.duration)),
      detail: [number ?? airline, cabin].filter(Boolean).join(" · "),
    });
    if (rows.length >= MAX_ROWS) break;
  }
  return rows;
}

function richRating(record: Record<string, unknown>): unknown {
  const rich = isRecord(record.rich_snippet) ? record.rich_snippet : {};
  const top = isRecord(rich.top) ? rich.top : {};
  const detected = isRecord(top.detected_extensions) ? top.detected_extensions : {};
  return detected.rating ?? detected.score;
}

function movieRows(results: Record<string, unknown>): { films: FilmRow[]; critics: CriticRow[] } {
  const films: FilmRow[] = [];
  const critics: CriticRow[] = [];
  const graph = isRecord(results.knowledge_graph) ? results.knowledge_graph : undefined;
  if (graph) {
    const title = asText(graph.title, 160);
    const line = asText(graph.description, 180);
    if (title) {
      films.push({
        title,
        url: publicUrl(isRecord(graph.source) ? graph.source.link : graph.website) ?? publicUrl(graph.link),
        score: scoreOf(graph.rating),
        meta: asText(graph.type, 60),
        line,
      });
    }
    if (line) critics.push({ name: "Overview", source: asText(graph.type, 40), line });
  }
  for (const record of recordList(results.organic_results)) {
    const title = asText(record.title, 160);
    const line = asText(record.snippet, 180);
    if (!title) continue;
    const url = linkFrom(record, ["link", "url"]);
    const source = named(record.source) ?? hostOf(url);
    if (!films.some((film) => film.title === title)) {
      films.push({
        title: cleanTitle(title),
        url,
        score: scoreOf(richRating(record)),
        meta: [source, asText(record.date, 40)].filter(Boolean).join(" · ") || undefined,
        line,
      });
    }
    if (line) critics.push({ name: source ?? cleanTitle(title), source, line });
    if (films.length >= MAX_ROWS) break;
  }
  return { films: films.slice(0, MAX_ROWS), critics: critics.slice(0, MAX_ROWS) };
}

function personRows(results: Record<string, unknown>): PersonRow[] {
  const rows: PersonRow[] = [];
  const graph = isRecord(results.knowledge_graph) ? results.knowledge_graph : undefined;
  if (graph) {
    const name = asText(graph.title, 120);
    const line = asText(graph.description, 180);
    if (name) {
      rows.push({
        name,
        url: publicUrl(isRecord(graph.source) ? graph.source.link : undefined),
        role: asText(graph.type, 60),
        line,
        known: line ? clip(line, 80) : undefined,
      });
    }
  }
  for (const record of recordList(results.organic_results)) {
    const raw = asText(record.title, 160);
    if (!raw) continue;
    const name = cleanTitle(raw);
    if (rows.some((row) => row.name === name)) continue;
    const url = linkFrom(record, ["link", "url"]);
    const line = asText(record.snippet, 180);
    rows.push({
      name,
      url,
      role: named(record.source) ?? hostOf(url),
      line,
      known: line ? clip(line, 80) : undefined,
    });
    if (rows.length >= MAX_ROWS) break;
  }
  return rows;
}

function looksLikeReview(record: Record<string, unknown>): boolean {
  const line = asText(record.snippet, 280) ?? asText(record.text, 280) ?? asText(record.comment, 280);
  const author = named(record.user) ?? named(record.author) ?? asText(record.username, 80);
  return Boolean(line && (author || ratingOf(record.rating)) && !record.address && !record.price);
}

function reviewModel(results: Record<string, unknown>, query: string): ReviewModel | undefined {
  const place = isRecord(results.place_results) ? results.place_results : {};
  const records = [
    ...(Array.isArray(results.reviews) ? results.reviews.filter(isRecord) : []),
    ...(Array.isArray(place.user_reviews) ? place.user_reviews.filter(isRecord) : []),
    ...(Array.isArray(place.reviews) ? place.reviews.filter(isRecord) : []),
  ].filter(looksLikeReview);
  if (!records.length) return undefined;
  const reviews = records.slice(0, MAX_ROWS).map((record) => ({
    author: named(record.user) ?? named(record.author) ?? asText(record.username, 80) ?? "Reviewer",
    rating: ratingOf(record.rating),
    when: asText(record.date, 40) ?? asText(record.relative_time, 40),
    line: asText(record.snippet, 280) ?? asText(record.text, 280) ?? asText(record.comment, 280) ?? "",
  }));
  const rated = reviews.map((review) => review.rating).filter((rating): rating is number => rating != null);
  const counts = [0, 0, 0, 0, 0];
  for (const rating of rated) counts[Math.max(1, Math.min(5, Math.round(rating))) - 1] += 1;
  const bars = [5, 4, 3, 2, 1].map((star) => (rated.length ? Math.round((counts[star - 1] / rated.length) * 100) : 0));
  const mean = rated.length ? Math.round((rated.reduce((sum, rating) => sum + rating, 0) / rated.length) * 10) / 10 : undefined;
  const first = reviews[0];
  return {
    venue: asText(place.title, 120) ?? (query.trim() || "Reviews"),
    average: ratingOf(place.rating) ?? mean,
    count: numberOf(place.reviews) ?? reviews.length,
    bars,
    quote: first ? `${first.line}${first.author ? ` — ${first.author}` : ""}${first.when ? `, ${first.when}` : ""}` : undefined,
    reviews,
  };
}

function foodPlaces(rows: PlaceRow[]): boolean {
  const typed = rows.filter((row) => row.kind);
  if (!typed.length) return false;
  const food = typed.filter((row) => FOOD_KIND.test(row.kind ?? "")).length;
  return food * 2 >= typed.length;
}

function graphType(results: Record<string, unknown>): string | undefined {
  return isRecord(results.knowledge_graph) ? asText(results.knowledge_graph.type, 80) : undefined;
}

export function adaptResults(
  engine: string | undefined,
  query: string | undefined,
  results: Record<string, unknown> | null | undefined,
): SearchWidget | null {
  if (!results) return null;
  const chosen = engine ?? "";
  const text = query ?? "";
  const maps = chosen === "google_maps" || chosen === "google_local";

  if (chosen === "google_flights" || (FLIGHT_QUERY.test(text) && (results.best_flights || results.other_flights))) {
    const rows = flightRows(results);
    if (rows.length) return { kind: "flights", rows };
  }

  if (chosen === "google_hotels" || (HOTEL_QUERY.test(text) && results.properties)) {
    const rows = hotelRows(results);
    if (rows.length) return { kind: "hotels", rows };
  }

  if (chosen === "google_finance" || (STOCK_QUERY.test(text) && (results.summary || results.markets))) {
    const rows = stockRows(results);
    if (rows.length) return { kind: "stocks", rows };
  }

  if (chosen === "google_jobs" || (JOB_QUERY.test(text) && results.jobs_results)) {
    const rows = jobRows(results);
    if (rows.length) return { kind: "jobs", rows };
  }

  const review = reviewModel(results, text);
  if (review && !maps && !results.local_results) return { kind: "reviews", review };

  if (chosen === "google_shopping" || (SHOP_QUERY.test(text) && (results.shopping_results || results.inline_shopping_results))) {
    const rows = productRows(results);
    if (rows.length) return { kind: "shopping", rows };
  }

  if (chosen === "google_news" || NEWS_QUERY.test(text)) {
    const rows = storyRows(results, true);
    if (rows.length) return { kind: "news", rows };
  }

  const wantsPlaces = maps || ((FOOD_QUERY.test(text) || /\b(near|nearby|around|where is|directions)\b/i.test(text) || /\bin\s+[A-Z]/.test(text)) && !JOB_QUERY.test(text));
  if (wantsPlaces && (results.local_results || results.place_results)) {
    const rows = placeRows(results);
    if (rows.length) {
      return FOOD_QUERY.test(text) || foodPlaces(rows) ? { kind: "restaurants", rows } : { kind: "locations", rows };
    }
  }

  const type = graphType(results);
  if (MOVIE_QUERY.test(text) || MOVIE_TYPE.test(type ?? "")) {
    const movies = movieRows(results);
    if (movies.films.length) return { kind: "movies", ...movies };
  }

  const personType = Boolean(type && PERSON_TYPE.test(type) && !NOT_PERSON.test(type));
  if ((PERSON_QUERY.test(text) || personType) && !(type && NOT_PERSON.test(type) && !personType)) {
    const rows = personRows(results);
    if (rows.length) return { kind: "people", rows };
  }

  return null;
}
