import assert from "node:assert/strict";
import test from "node:test";
import { extractItems } from "./items.ts";

test("prefers shopping results and keeps price over the raw number", () => {
  const items = extractItems({
    organic_results: [{ title: "Ignored", link: "https://example.com" }],
    shopping_results: [
      {
        title: "Keychron",
        product_link: "https://shop.example/keychron",
        price: "₹4,999",
        extracted_price: 4999,
        source: "Amazon",
        rating: 4.6,
        thumbnail: "https://img.example/key.jpg",
      },
    ],
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Keychron");
  assert.equal(items[0].url, "https://shop.example/keychron");
  assert.equal(items[0].image, "https://img.example/key.jpg");
  assert.deepEqual(
    items[0].facts.map((fact) => fact.label),
    ["Price", "Source", "Rating"],
  );
  assert.equal(items[0].facts[0].value, "₹4,999");
});

test("reads news source objects and nested stories", () => {
  const items = extractItems({
    news_results: [
      {
        title: "Section",
        stories: [
          {
            title: "Launch",
            link: "https://news.example/launch",
            snippet: "The rocket flew.",
            date: "2 hours ago",
            source: { name: "Reuters" },
          },
        ],
      },
    ],
  });
  assert.equal(items[0].title, "Launch");
  assert.equal(items[0].facts.find((fact) => fact.label === "Source")?.value, "Reuters");
  assert.equal(items[0].facts.find((fact) => fact.label === "Date")?.value, "2 hours ago");
});

test("reads a maps places object and drops SerpApi links", () => {
  const items = extractItems({
    local_results: {
      places: [
        {
          title: "Blue Tokai",
          address: "Indiranagar",
          rating: 4.4,
          type: "Coffee shop",
          link: "https://serpapi.com/search?api_key=secret",
        },
      ],
    },
  });
  assert.equal(items[0].title, "Blue Tokai");
  assert.equal(items[0].url, undefined);
  assert.equal(items[0].facts.find((fact) => fact.label === "Address")?.value, "Indiranagar");
});

test("reads a job apply link and clips the description", () => {
  const items = extractItems({
    jobs_results: [
      {
        title: "Go developer",
        company_name: "Example",
        location: "New York",
        description: `<p>${"word ".repeat(80)}</p>`,
        apply_options: [{ link: "https://jobs.example/1" }],
        detected_extensions: { posted_at: "3 days ago" },
      },
    ],
  });
  assert.equal(items[0].url, "https://jobs.example/1");
  assert.ok((items[0].snippet?.length ?? 0) <= 280);
  assert.equal(items[0].facts.find((fact) => fact.label === "Posted At")?.value, "3 days ago");
});

test("a google web search shows organic results when a local pack is also present", () => {
  const items = extractItems(
    {
      local_results: { places: [{ title: "Cafe", address: "1 Main" }] },
      organic_results: [{ title: "Coffee wiki", link: "https://en.wikipedia.org/wiki/Coffee", snippet: "A drink." }],
    },
    "google",
  );
  assert.equal(items[0].title, "Coffee wiki");
});

test("skips SerpApi image hosts and uses the next public image", () => {
  const items = extractItems({
    organic_results: [
      {
        title: "Beans",
        link: "https://example.com/beans",
        thumbnail: "https://serpapi.com/searches/x/images/a.jpeg",
        thumbnail_large: "https://lh3.googleusercontent.com/a.jpg",
      },
    ],
  });
  assert.equal(items[0].image, "https://lh3.googleusercontent.com/a.jpg");
});

test("ignores related questions and returns nothing for an empty payload", () => {
  assert.deepEqual(extractItems({ related_questions: [{ title: "Nope" }] }), []);
  assert.deepEqual(extractItems({}), []);
  assert.deepEqual(extractItems(undefined), []);
});
