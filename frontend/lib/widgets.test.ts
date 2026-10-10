import assert from "node:assert/strict";
import test from "node:test";
import { adaptResults } from "./widgets.ts";

test("shopping keeps the display price, store, rating, and note", () => {
  const widget = adaptResults("google_shopping", "mechanical keyboards under 5000", {
    shopping_results: [
      {
        title: "Keychron K2",
        product_link: "https://shop.example/keychron",
        price: "₹4,999",
        extracted_price: 4999,
        source: "Amazon",
        rating: 4.6,
        extensions: ["Hot-swap"],
        thumbnail: "https://serpapi.com/searches/x/images/a.jpeg",
      },
    ],
  });
  assert.equal(widget?.kind, "shopping");
  if (widget?.kind !== "shopping") return;
  assert.equal(widget.rows[0].price, "₹4,999");
  assert.equal(widget.rows[0].source, "Amazon");
  assert.equal(widget.rows[0].rating, 4.6);
  assert.equal(widget.rows[0].note, "Hot-swap");
  assert.equal(widget.rows[0].url, "https://shop.example/keychron");
});

test("a shopping-shaped query still maps when the engine is google web", () => {
  const widget = adaptResults("google", "mechanical keyboards under 5000", {
    organic_results: [{ title: "Ignored", link: "https://example.com" }],
    shopping_results: [{ title: "RK84", price: "₹3,499", source: "Meckeys" }],
  });
  assert.equal(widget?.kind, "shopping");
});

test("news reads a source object and nested stories", () => {
  const widget = adaptResults("google_news", "SpaceX news this week", {
    news_results: [
      {
        title: "Section",
        stories: [
          {
            title: "SpaceX launches 23 satellites",
            link: "https://news.example/launch",
            snippet: "The booster landed.",
            date: "2 hours ago",
            source: { name: "Reuters" },
          },
        ],
      },
    ],
  });
  assert.equal(widget?.kind, "news");
  if (widget?.kind !== "news") return;
  assert.equal(widget.rows[0].title, "SpaceX launches 23 satellites");
  assert.equal(widget.rows[0].source, "Reuters");
  assert.equal(widget.rows[0].when, "2 hours ago");
});

test("coffee shops on maps become restaurant rows, not a generic list", () => {
  const widget = adaptResults("google_maps", "coffee shops in Bay Area", {
    local_results: {
      places: [
        {
          title: "High Road Coffee",
          address: "107 E Main St",
          rating: 4.9,
          type: "Coffee shop",
          price: "$",
          hours: "Open · Closes 6 PM",
          link: "https://serpapi.com/search?api_key=secret",
          links: { website: "https://highroad.example" },
        },
      ],
    },
  });
  assert.equal(widget?.kind, "restaurants");
  if (widget?.kind !== "restaurants") return;
  assert.equal(widget.rows[0].title, "High Road Coffee");
  assert.equal(widget.rows[0].open, true);
  assert.equal(widget.rows[0].price, "$");
  assert.equal(widget.rows[0].url, "https://highroad.example");
});

test("a landmark search becomes locations", () => {
  const widget = adaptResults("google_local", "Golden Gate Bridge", {
    local_results: [{ title: "Golden Gate Bridge", type: "Landmark", address: "San Francisco, CA", distance: "2.1 mi" }],
  });
  assert.equal(widget?.kind, "locations");
  if (widget?.kind !== "locations") return;
  assert.equal(widget.rows[0].distance, "2.1 mi");
});

test("a plain google search keeps the generic path", () => {
  const widget = adaptResults("google", "coffee", {
    local_results: { places: [{ title: "Cafe", type: "Coffee shop", address: "1 Main" }] },
    organic_results: [{ title: "Coffee", link: "https://en.wikipedia.org/wiki/Coffee", snippet: "A drink." }],
  });
  assert.equal(widget, null);
});

test("jobs win over the word in", () => {
  const widget = adaptResults("google_jobs", "golang developer jobs in New York", {
    jobs_results: [
      {
        title: "Go developer",
        company_name: "Northwind",
        location: "New York, NY",
        detected_extensions: { posted_at: "3 days ago", schedule_type: "Full-time" },
        apply_options: [{ link: "https://jobs.example/1" }],
      },
    ],
    local_results: { places: [{ title: "New York", address: "NY" }] },
  });
  assert.equal(widget?.kind, "jobs");
  if (widget?.kind !== "jobs") return;
  assert.equal(widget.rows[0].company, "Northwind");
  assert.deepEqual(widget.rows[0].tags, ["Full-time"]);
  assert.equal(widget.rows[0].url, "https://jobs.example/1");
});

test("finance summary uses the direction when the percent is unsigned", () => {
  const widget = adaptResults("google_finance", "AAPL stock", {
    summary: {
      title: "Apple Inc",
      stock: "AAPL:NASDAQ",
      price: "$227.12",
      extracted_price: 227.12,
      price_movement: { percentage: 1.42, value: 3.18, movement: "Up" },
    },
    knowledge_graph: { key_stats: { stats: [{ label: "Day range", value: "224.00 - 228.00" }] } },
    markets: {
      us: [{ name: "Dow Jones", price: "42,454.79", price_movement: { percentage: 0.4, value: 12, movement: "Down" } }],
    },
  });
  assert.equal(widget?.kind, "stocks");
  if (widget?.kind !== "stocks") return;
  assert.equal(widget.rows[0].ticker, "AAPL");
  assert.equal(widget.rows[0].percent, "+1.42%");
  assert.equal(widget.rows[0].up, true);
  assert.equal(widget.rows[0].range, 78);
  assert.equal(widget.rows[1].ticker, "Dow Jones");
  assert.equal(widget.rows[1].percent, "-0.4%");
  assert.equal(widget.rows[1].up, false);
});

test("hotels read nightly rate, area, and a perk", () => {
  const widget = adaptResults("google_hotels", "hotels in San Francisco", {
    properties: [
      {
        name: "Hotel Zephyr",
        link: "https://www.google.com/travel/hotels/entity/zephyr",
        serpapi_property_details_link: "https://serpapi.com/searches/hotel",
        rate_per_night: { lowest: "$214", extracted_lowest: 214 },
        overall_rating: 4.2,
        essential_info: ["Breakfast included"],
        nearby_places: [{ name: "Fisherman's Wharf", transportations: [{ type: "Walking", duration: "5 min" }] }],
      },
    ],
  });
  assert.equal(widget?.kind, "hotels");
  if (widget?.kind !== "hotels") return;
  assert.equal(widget.rows[0].rate, "$214");
  assert.equal(widget.rows[0].area, "Fisherman's Wharf");
  assert.equal(widget.rows[0].perk, "Breakfast included");
  assert.equal(widget.rows[0].distance, "5 min");
  assert.equal(widget.rows[0].url, "https://www.google.com/travel/hotels/entity/zephyr");
});

test("flights build an itinerary from the first leg and the last airport", () => {
  const widget = adaptResults("google_flights", "flights from SFO to JFK", {
    best_flights: [
      {
        flights: [
          {
            departure_airport: { id: "SFO", time: "2026-10-11 06:10" },
            arrival_airport: { id: "JFK", time: "2026-10-11 14:40" },
            duration: 330,
            airline: "United",
            flight_number: "UA 512",
            travel_class: "Economy",
          },
        ],
        total_duration: 330,
        price: 248,
      },
    ],
    other_flights: [
      {
        flights: [
          {
            departure_airport: { id: "SFO", time: "2026-10-11 11:15" },
            arrival_airport: { id: "ORD", time: "2026-10-11 17:20" },
            airline: "Delta",
          },
          {
            departure_airport: { id: "ORD", time: "2026-10-11 18:40" },
            arrival_airport: { id: "JFK", time: "2026-10-11 21:05" },
            airline: "Delta",
          },
        ],
        layovers: [{ id: "ORD" }],
        price: 198,
      },
    ],
  });
  assert.equal(widget?.kind, "flights");
  if (widget?.kind !== "flights") return;
  assert.equal(widget.rows[0].depart, "6:10 AM");
  assert.equal(widget.rows[0].arrive, "2:40 PM");
  assert.equal(widget.rows[0].stops, "Nonstop");
  assert.equal(widget.rows[0].fare, "$248");
  assert.equal(widget.rows[0].duration, "5h 30m");
  assert.equal(widget.rows[1].stops, "1 stop");
  assert.equal(widget.rows[1].to, "JFK");
});

test("place reviews summarize the star spread", () => {
  const widget = adaptResults("google", "blue bottle reviews", {
    place_results: { title: "Blue Bottle", rating: 4.6, reviews: 1284 },
    reviews: [
      { user: { name: "Priya" }, rating: 5, date: "a week ago", snippet: "The espresso was tight." },
      { user: { name: "Andre" }, rating: 4, date: "2 weeks ago", snippet: "Good pour-over." },
    ],
  });
  assert.equal(widget?.kind, "reviews");
  if (widget?.kind !== "reviews") return;
  assert.equal(widget.review.venue, "Blue Bottle");
  assert.equal(widget.review.average, 4.6);
  assert.equal(widget.review.count, 1284);
  assert.equal(widget.review.bars[0], 50);
  assert.equal(widget.review.bars[1], 50);
  assert.match(widget.review.quote ?? "", /Priya/);
});

test("a film knowledge graph becomes movie scores and a critic line", () => {
  const widget = adaptResults("google", "dune movie review", {
    knowledge_graph: { title: "Dune: Part Two", type: "2024 film", description: "A desert war.", rating: 4.6 },
    organic_results: [
      { title: "Dune review - NYT", link: "https://nytimes.example/dune", snippet: "Huge and clear.", source: "NYT" },
    ],
  });
  assert.equal(widget?.kind, "movies");
  if (widget?.kind !== "movies") return;
  assert.equal(widget.films[0].title, "Dune: Part Two");
  assert.equal(widget.films[0].score, 92);
  assert.equal(widget.critics[1].name, "NYT");
  assert.equal(widget.critics[1].line, "Huge and clear.");
});

test("a person type becomes profiles and ignores company graphs", () => {
  const person = adaptResults("google", "Ada Lovelace", {
    knowledge_graph: {
      title: "Ada Lovelace",
      type: "Mathematician",
      description: "Wrote the first published algorithm.",
    },
  });
  assert.equal(person?.kind, "people");
  if (person?.kind !== "people") return;
  assert.equal(person.rows[0].role, "Mathematician");

  const company = adaptResults("google", "who is Apple", {
    knowledge_graph: { title: "Apple", type: "Technology company", description: "Makes phones." },
    organic_results: [{ title: "Apple", link: "https://apple.com", snippet: "Shop." }],
  });
  assert.equal(company, null);
});
