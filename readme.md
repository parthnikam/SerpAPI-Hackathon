# SerpAPI Hackathon 2026

A Single search box. Jev picks a SerpApi engine and a DaisyUI widget. The page renders live results in that widget.

Google results are a pile of different shapes (links, news, products, places, jobs). A chat model can sort that out, but it spends a time on long call and a lot of tokens to do it. 

This app spends two short Jev choices and one SerpApi search, then fills a widget we already wrote.

**Track:** AI Agents.
**Submit by:** 10 October 2026, 23:59 IST. Public GitHub repo, setup instructions, demo under three minutes.
**Status:** plan. `backend/` and `frontend/` are empty.

## What the user gets

Type a query. The page shows:

1. Which engine Jev chose, and its confidence.
2. Which widget Jev chose, and its confidence.
3. The live SerpApi results inside that widget.

The user can switch the widget from the ones that fit that result shape. Judges can see the routing, then see the results.

Demo queries:

| Query | Engine | Widget |
| --- | --- | --- |
| mechanical keyboards under 5000 | `google_shopping` | product grid |
| ISRO news this week | `google_news` | news list |
| coffee near Koramangala | `google_maps` | place list |
| python developer jobs in Bangalore | `google_jobs` | job list |

A fifth engine, `google` web search, is the fallback when Jev is unsure. It renders the generic result list.

## How one search runs

```
query
  → Jev picks one engine from the engine catalog
  → SerpApi search on that engine
  → normalizer turns the JSON into a fixed record list
  → schema check keeps only widgets that can render those records
  → Jev picks one widget from that short list
  → frontend renders { widget_id, items, trace }
```

Jev never writes HTML, JSON mappers, or code. It only chooses an id from a list we send. That is the same job as `jev_find` in [jev-mcp](https://github.com/jkudish/jev-mcp): a closed set of candidates, one best id, a probability for each.

The backend calls Jev over HTTP (`jev-latest` on TypeSafe or OpenRouter). The web app does not need an MCP session on the request path. The catalogs are the tool list.

Two catalogs, both static files:

- **Engines.** id, one-line description, SerpApi `engine` name, which record type it produces.
- **Widgets.** id, one-line description, DaisyUI layout, record type it can render, required fields.

A widget is offered to Jev only when its record type matches the engine. Product cards cannot be chosen for jobs. That is the structure check, before any model sees the choice.

## Record types

Each normalizer emits one of these. Fields the engine does not have are omitted. The widget renders what is present.

- `link`: title, url, snippet
- `news`: title, url, source, date, snippet
- `product`: title, url, price, source, rating, thumbnail
- `place`: title, url, rating, address, type
- `job`: title, url, company, location, posted

`result-list` accepts `link` and is also the fallback for every other type: title, url, and whatever short text we have.

## Verifier

Two checks, both in the same request. No second agent loop.

1. **Schema check.** After the SerpApi response is normalized, drop any widget whose required fields are missing on most items. If none of the specific widgets survive, use `result-list`.
2. **Confidence.** If Jev's top engine is under 0.6, search with `google` instead and say so in the trace. If the top widget is under 0.6, render `result-list` and still show the runner-up so the user can switch.

Empty SerpApi results stay on the chosen widget and show an empty state. We do not ask Jev again.

## What we are building

**Backend** (`backend/`, Python, FastAPI):

- `POST /search` with `{ "query": "..." }`.
- Engine catalog and widget catalog.
- One normalizer per engine.
- Jev client: one choice call for the engine, one for the widget.
- SerpApi client: one search per request. Cache the raw JSON on disk keyed by engine + query so styling does not spend credits twice.
- Response: `{ engine, widget, confidence, items, trace }`.

**Frontend** (`frontend/`, Vite, Tailwind, DaisyUI):

- Search box.
- Trace line: engine, widget, both confidences, runner-up.
- Five widgets, selected by `widget_id`: result list, news list, product grid, place list, job list.
- Widget switcher limited to widgets that match the record type.

**Happy path uses no chat model.** Filling a widget is a function from records to props. A small LLM is out of this submission. If a later version needs one (rewriting a vague query into engine parameters), it runs server-side on xAI (`XAI_API_KEY`, `https://api.x.ai/v1`) and only returns parameter JSON for a known engine.

## Out of scope

- All 100+ SerpApi engines. Five engines are enough to show routing.
- Generating components, HTML, or mapper code at request time.
- Accounts, saved searches, history.
- Multi-engine fan-out (search shopping and maps in one query).
- A chat transcript. One box, one result view.

## Keys

| Env var | Where |
| --- | --- |
| `SERPAPI_API_KEY` | backend only. Free plan is 250 searches a month. |
| `TYPESAFE_API_KEY` or `OPENROUTER_API_KEY` | backend only, for Jev. |

Never commit either key. The frontend talks only to our backend.

## Build order

Today is 8 October. Submit on 10 October, earlier if the demo path works.

**8 October — one query works end to end**

1. FastAPI app, `POST /search`, health check.
2. Catalogs for the five engines and five widgets.
3. SerpApi call plus the five normalizers. Cache raw responses.
4. Jev engine pick and widget pick. Keyword fallback if the Jev key is missing, so the UI can be built offline: shopping/price words → shopping, news → news, near/in a place → maps, jobs → jobs, anything else → google.
5. DaisyUI page that renders `result-list` and the trace.

**9 October — the four specific widgets and the verifier**

1. Product grid, news list, place list, job list.
2. Schema check and the 0.6 confidence fallback.
3. Widget switcher.
4. Run instructions in this file, from a clean checkout.
5. Run the four demo queries against live SerpApi and keep the recordings honest.

**10 October — submit**

1. Public GitHub repo. Confirm the link opens in a private window.
2. Screen recording under three minutes: the four queries, the trace visible, one manual widget switch, one low-confidence or fallback case if we can trigger it.
3. Submit on the [hackathon dashboard](https://serpapi.github.io/serpapi-india-hackathon-2026/submit.html). Editing stays open until 23:59 IST.

## Demo script (under three minutes)

1. Shopping query. Point at the trace: `google_shopping`, product grid.
2. News query. Point at the source and date on each row.
3. Maps query. Point at rating and address.
4. Jobs query. Switch the widget to the generic list and back.
5. One sentence on cost: two Jev choices and one SerpApi search. No generated UI.

## Submission notes

- **What it does:** turns a plain query into the SerpApi engine and the layout that fit it.
- **Who it is for:** someone who wants the useful slice of Google (products, news, places, jobs) without picking an API or reading raw JSON.
- **SerpApi usage:** `google`, `google_news`, `google_shopping`, `google_maps`, `google_jobs`. Search data is the page, not a side feature.
- **AI tools to disclose:** Jev (`jev-latest`) for the two runtime choices. Grok for planning and coding. Add anything else we actually use.
- **Judging:** idea (route by result shape, render a real widget), originality (typed model picks from catalogs, widgets are code), usefulness (four everyday searches), SerpApi is required for every result.

## Risks

| Risk | What we do |
| --- | --- |
| Jev picks a weak widget | It only sees widgets for that record type. Low confidence falls back to `result-list`. The user can switch. |
| Widget fields do not match the payload | Normalizers own the field names. The schema check drops a widget that would render blank required fields. |
| Jev or SerpApi is down during the demo | Disk cache replays the last raw response for that query. The trace says it is cached. |
| Credits run out while styling | Cache hits do not call SerpApi. Dev queries stay on the four demo strings. |
| Scope grows into a chat app | The submission is `POST /search` and one page. Extra engines wait until those four queries look right. |
