"use client";

import { useRef, useState } from "react";
import { ResultView } from "@/components/results";
import { extractItems } from "@/lib/items";
import type { SearchPayload } from "@/lib/types";

const DEMOS = [
  "mechanical keyboards under 5000",
  "SpaceX news this week",
  "coffee shops in Bay Area",
  "golang developer jobs in New York",
];

function componentLabel(id: string): string {
  return id.replace(/_/g, " ");
}

function paramLine(params: Record<string, unknown>): string {
  return Object.entries(params)
    .filter(([key]) => !/api.?key/i.test(key))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" · ");
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchPayload | null>(null);
  const [active, setActive] = useState(0);
  const requestId = useRef(0);

  async function search(text: string) {
    const nextQuery = text.trim();
    if (!nextQuery) return;
    const id = ++requestId.current;
    setQuery(nextQuery);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: nextQuery }),
      });
      const body = (await response.json()) as SearchPayload & { error?: string };
      if (requestId.current !== id) return;
      if (!response.ok) throw new Error(body.error || "Search failed.");
      setData(body);
      setActive(0);
      requestAnimationFrame(() => {
        document.getElementById("trace")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (caught) {
      if (requestId.current !== id) return;
      setData(null);
      setError(caught instanceof Error ? caught.message : "Search failed.");
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  }

  const names = (data?.components ?? []).filter((name): name is string => typeof name === "string");
  const activeName = names[active] ?? names[0] ?? "list";
  const items =
    data && data.results && typeof data.results === "object" && !Array.isArray(data.results)
      ? extractItems(data.results, data.engine)
      : [];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header>
        <p className="text-sm font-medium text-primary">SerpAPI Hackathon</p>
        <h1 className="mt-1 text-3xl font-bold">Search</h1>
        <p className="mt-2 text-base-content/70">
          Jev picks a SerpApi engine and three DaisyUI components. Switch components without searching again.
        </p>
      </header>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void search(query);
        }}
      >
        <label htmlFor="query" className="sr-only">
          Query
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="query"
            className="input input-bordered input-lg w-full"
            value={query}
            placeholder="Search products, news, places, or jobs"
            onChange={(event) => setQuery(event.target.value)}
            disabled={loading}
          />
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading || !query.trim()}>
            {loading ? <span className="loading loading-spinner" /> : "Search"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Demo queries">
          {DEMOS.map((demo) => (
            <button
              key={demo}
              type="button"
              className={`btn btn-sm btn-outline ${query === demo ? "btn-active" : ""}`}
              disabled={loading}
              onClick={() => {
                setQuery(demo);
                void search(demo);
              }}
            >
              {demo}
            </button>
          ))}
        </div>
      </form>

      {loading ? (
        <div role="status" className="alert">
          <span className="loading loading-spinner loading-md" />
          <span>Asking Jev, then searching SerpApi. The first search can take a minute.</span>
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{error}</span>
        </div>
      ) : null}

      {data && !loading ? (
        <section id="trace" className="flex flex-col gap-4">
          <div className="rounded-box border border-base-300 bg-base-100 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content/60">Trace</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="badge badge-primary badge-lg">{data.engine}</span>
            </div>
            {data.params && typeof data.params === "object" ? (
              <p className="mt-2 break-all text-sm text-base-content/70">{paramLine(data.params)}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {names.map((name, index) => (
                <button
                  key={`${name}-${index}`}
                  type="button"
                  className={`btn btn-sm ${index === active ? "btn-primary" : "btn-outline"}`}
                  aria-pressed={index === active}
                  onClick={() => setActive(index)}
                >
                  {componentLabel(name)}
                </button>
              ))}
            </div>
          </div>

          <section aria-label={componentLabel(activeName)}>
            <h2 className="mb-3 text-lg font-semibold capitalize">{componentLabel(activeName)}</h2>
            <ResultView component={activeName} items={items} />
          </section>
        </section>
      ) : null}

      <p className="text-sm text-base-content/60">
        One search runs two Jev choices and one SerpApi call. Switching a component stays on this page.
      </p>
    </main>
  );
}
