import type { CSSProperties } from "react";
import type {
  CriticRow,
  FilmRow,
  FlightRow,
  HotelRow,
  JobRow,
  PersonRow,
  PlaceRow,
  ProductRow,
  QuoteRow,
  ReviewModel,
  SearchWidget,
  StoryRow,
} from "@/lib/widgets";

function Stars({ value, name }: { value: number; name: string }) {
  const filled = Math.max(1, Math.min(5, Math.round(value)));
  return (
    <div className="rating rating-sm pointer-events-none" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <input
          key={star}
          type="radio"
          name={name}
          className="mask mask-star-2 bg-orange-400"
          aria-label={`${star} star`}
          defaultChecked={star === filled}
        />
      ))}
    </div>
  );
}

function Score({ value }: { value: number }) {
  return (
    <div
      className={`radial-progress shrink-0 text-sm font-semibold ${value >= 80 ? "text-success" : "text-warning"}`}
      style={{ "--value": value, "--size": "4.25rem", "--thickness": "4px" } as CSSProperties}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {value}
    </div>
  );
}

function Initial({ letters, tone = "primary" }: { letters: string; tone?: "primary" | "neutral" | "secondary" }) {
  const toneClass =
    tone === "neutral"
      ? "bg-neutral text-neutral-content"
      : tone === "secondary"
        ? "bg-secondary text-secondary-content"
        : "bg-primary text-primary-content";
  return (
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${toneClass}`}>
      {letters}
    </div>
  );
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter((part) => /[A-Za-z0-9]/.test(part));
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) || name.slice(0, 2)).toUpperCase();
}

function Linked({ text, url, className }: { text: string; url?: string; className?: string }) {
  if (!url) return <span className={className}>{text}</span>;
  return (
    <a className={`${className ?? ""} hover:underline`} href={url} target="_blank" rel="noreferrer">
      {text}
    </a>
  );
}

function metaLine(parts: Array<string | number | undefined>): string {
  return parts.filter((part) => part != null && part !== "").join(" · ");
}

function RestaurantCards({ rows }: { rows: PlaceRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((place, index) => (
        <article className="card card-border bg-base-100" key={`${place.title}-${index}`}>
          <div className="card-body gap-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="card-title text-base">
                <Linked text={place.title} url={place.url} />
              </h3>
              {place.hours ? (
                <span className={`badge badge-soft ${place.open ? "badge-success" : "badge-ghost"}`}>{place.hours}</span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {place.rating != null ? (
                <>
                  <Stars value={place.rating} name={`rest-${index}`} />
                  <span className="text-sm">{place.rating}</span>
                </>
              ) : null}
              {place.kind ? <span className="badge badge-outline">{place.kind}</span> : null}
              {place.price ? <span className="text-sm text-base-content/70">{place.price}</span> : null}
            </div>
            {place.address ? <p className="text-sm text-base-content/70">{place.address}</p> : null}
            {place.url ? (
              <div className="card-actions justify-end">
                <a className="btn btn-primary btn-sm" href={place.url} target="_blank" rel="noreferrer">
                  Directions
                </a>
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function RestaurantList({ rows }: { rows: PlaceRow[] }) {
  return (
    <ul className="list">
      {rows.map((place, index) => (
        <li className="list-row" key={`${place.title}-${index}`}>
          <span className={`status mt-1 ${place.open ? "status-success" : place.open === false ? "status-warning" : ""}`} />
          <div className="list-col-grow min-w-0">
            <div className="font-semibold">
              <Linked text={place.title} url={place.url} />
            </div>
            <div className="text-xs opacity-60">{metaLine([place.kind, place.price, place.distance ?? place.address])}</div>
          </div>
          <div className="text-right">
            {place.rating != null ? <div className="font-semibold">{place.rating}</div> : null}
            {place.open != null ? <div className="text-xs opacity-60">{place.open ? "Open" : "Closed"}</div> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function StockStats({ rows }: { rows: QuoteRow[] }) {
  return (
    <div className="stats stats-vertical w-full bg-base-100 shadow">
      {rows.map((quote) => (
        <div className="stat" key={quote.ticker}>
          <div className="stat-title !whitespace-normal">{quote.ticker}</div>
          <div className={`stat-value text-2xl ${quote.up === false ? "text-error" : "text-success"}`}>{quote.price}</div>
          {quote.change || quote.percent ? (
            <div className={`stat-desc !whitespace-normal ${quote.up === false ? "text-error" : "text-success"}`}>
              {[quote.change, quote.percent ? `(${quote.percent})` : undefined].filter(Boolean).join(" ")} today
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function StockTable({ rows }: { rows: QuoteRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Price</th>
            <th>Change</th>
            <th>Day range</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((quote) => (
            <tr key={quote.ticker}>
              <td className="font-mono font-semibold">{quote.ticker}</td>
              <td>{quote.price}</td>
              <td>
                {quote.percent ? (
                  <span className={`badge badge-soft ${quote.up === false ? "badge-error" : "badge-success"}`}>{quote.percent}</span>
                ) : (
                  "—"
                )}
              </td>
              <td>
                {quote.range != null ? (
                  <progress
                    className={`progress w-24 ${quote.up === false ? "progress-error" : "progress-success"}`}
                    value={quote.range}
                    max={100}
                  />
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MovieScores({ films }: { films: FilmRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      {films.map((film, index) => (
        <article className="flex items-center gap-4" key={`${film.title}-${index}`}>
          {film.score != null ? <Score value={film.score} /> : null}
          <div className="min-w-0">
            <h3 className="font-semibold">
              <Linked text={film.title} url={film.url} />
            </h3>
            {film.meta ? <p className="text-xs uppercase tracking-wide text-base-content/50">{film.meta}</p> : null}
            {film.line ? <p className="mt-1 text-sm">{film.line}</p> : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function MovieChat({ critics }: { critics: CriticRow[] }) {
  return (
    <div className="flex flex-col">
      {critics.map((critic, index) => (
        <div className={`chat ${index % 2 ? "chat-end" : "chat-start"}`} key={`${critic.name}-${index}`}>
          <div className="chat-header text-xs">
            {critic.name}
            {critic.source && critic.source !== critic.name ? <span className="ml-2 opacity-60">{critic.source}</span> : null}
          </div>
          <div className={`chat-bubble ${index % 2 ? "chat-bubble-primary" : ""}`}>{critic.line}</div>
        </div>
      ))}
    </div>
  );
}

function PersonCards({ rows }: { rows: PersonRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((person, index) => (
        <article className="card card-border bg-base-100" key={`${person.name}-${index}`}>
          <div className="card-body flex-row items-start gap-4 p-4">
            <Initial letters={initials(person.name)} tone={index % 2 ? "secondary" : "primary"} />
            <div className="min-w-0">
              <h3 className="font-semibold">
                <Linked text={person.name} url={person.url} />
              </h3>
              {person.role ? <p className="text-sm text-base-content/60">{person.role}</p> : null}
              {person.line ? <p className="mt-1 text-sm">{person.line}</p> : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function PersonTable({ rows }: { rows: PersonRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Known for</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((person, index) => (
            <tr key={`${person.name}-${index}`}>
              <td className="font-semibold">
                <Linked text={person.name} url={person.url} />
              </td>
              <td>{person.role ?? "—"}</td>
              <td>{person.known ?? person.line ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LocationCards({ rows }: { rows: PlaceRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((place, index) => {
        const card = (
          <article className="card card-border w-full bg-base-100">
            <div className="card-body p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">
                  <Linked text={place.title} url={place.url} />
                </h3>
                {place.kind ? <span className="badge badge-ghost badge-sm">{place.kind}</span> : null}
              </div>
              {place.address || place.line ? <p className="text-sm text-base-content/70">{place.address ?? place.line}</p> : null}
            </div>
          </article>
        );
        if (!place.distance) return <div key={`${place.title}-${index}`}>{card}</div>;
        return (
          <div className="indicator mt-2 w-full" key={`${place.title}-${index}`}>
            <span className="indicator-item badge badge-primary">{place.distance}</span>
            {card}
          </div>
        );
      })}
    </div>
  );
}

function LocationTimeline({ rows }: { rows: PlaceRow[] }) {
  return (
    <ul className="timeline timeline-vertical timeline-compact">
      {rows.map((place, index) => (
        <li key={`${place.title}-${index}`}>
          {index > 0 ? <hr /> : null}
          <div className="timeline-start text-xs">{place.distance ?? place.kind ?? `${index + 1}`}</div>
          <div className="timeline-middle">
            <span className="status status-primary" />
          </div>
          <div className="timeline-end timeline-box">
            <div className="font-semibold">
              <Linked text={place.title} url={place.url} />
            </div>
            {place.line || place.address ? <div className="text-sm">{place.line ?? place.address}</div> : null}
          </div>
          {index < rows.length - 1 ? <hr /> : null}
        </li>
      ))}
    </ul>
  );
}

function ReviewSummary({ review }: { review: ReviewModel }) {
  const hasBars = review.bars.some((value) => value > 0);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-4">
        <div>
          <div className="text-4xl font-bold leading-none">{review.average ?? "—"}</div>
          {review.average != null ? <Stars value={review.average} name="review-overall" /> : null}
          <p className="text-xs text-base-content/60">
            {review.count != null ? `${review.count.toLocaleString()} reviews · ` : null}
            {review.venue}
          </p>
        </div>
        {hasBars ? (
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {review.bars.map((value, index) => (
              <div className="flex items-center gap-2" key={5 - index}>
                <span className="w-3 text-xs">{5 - index}</span>
                <progress className="progress progress-warning w-full" value={value} max={100} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {review.quote ? (
        <div className="alert alert-soft items-start">
          <span>{review.quote}</span>
        </div>
      ) : null}
    </div>
  );
}

function ReviewThread({ review }: { review: ReviewModel }) {
  return (
    <div className="flex flex-col gap-2">
      {review.reviews.map((entry, index) => (
        <div className="collapse collapse-arrow border border-base-300 bg-base-100" key={`${entry.author}-${index}`}>
          <input type="checkbox" defaultChecked={index === 0} />
          <div className="collapse-title flex flex-wrap items-center gap-3 pe-10 font-semibold">
            <span>{entry.author}</span>
            {entry.rating != null ? <Stars value={entry.rating} name={`rev-${index}`} /> : null}
            {entry.when ? <span className="text-xs font-normal text-base-content/50">{entry.when}</span> : null}
          </div>
          <div className="collapse-content text-sm">{entry.line}</div>
        </div>
      ))}
    </div>
  );
}

function ShoppingTiles({ rows }: { rows: ProductRow[] }) {
  return (
    <div className="grid gap-3">
      {rows.map((product, index) => (
        <article className="flex items-center justify-between gap-3 rounded-box border border-base-300 p-3" key={`${product.title}-${index}`}>
          <div className="min-w-0">
            <h3 className="font-semibold">
              <Linked text={product.title} url={product.url} />
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {product.source ? <span className="badge badge-outline badge-sm">{product.source}</span> : null}
              {product.rating != null ? <Stars value={product.rating} name={`shop-${index}`} /> : null}
            </div>
          </div>
          {product.price ? <p className="text-xl font-bold">{product.price}</p> : null}
        </article>
      ))}
    </div>
  );
}

function ShoppingTable({ rows }: { rows: ProductRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Store</th>
            <th>Rating</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((product, index) => (
            <tr key={`${product.title}-${index}`}>
              <td className="font-semibold">
                <Linked text={product.title} url={product.url} />
              </td>
              <td>{product.price ?? "—"}</td>
              <td>{product.source ?? "—"}</td>
              <td>{product.rating ?? "—"}</td>
              <td>{product.note ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NewsFront({ rows }: { rows: StoryRow[] }) {
  const [lead, ...rest] = rows;
  if (!lead) return null;
  return (
    <div>
      <div className="hero rounded-box bg-base-200">
        <div className="hero-content items-start px-2 py-6">
          <div>
            {lead.source || lead.when ? (
              <span className="badge badge-primary badge-sm">{metaLine([lead.source, lead.when])}</span>
            ) : null}
            <h3 className="mt-2 text-xl font-bold">
              <Linked text={lead.title} url={lead.url} />
            </h3>
            {lead.line ? <p className="mt-1 text-sm">{lead.line}</p> : null}
          </div>
        </div>
      </div>
      {rest.length ? (
        <ul className="menu mt-1 w-full px-0">
          {rest.map((story, index) => (
            <li key={`${story.title}-${index}`}>
              {story.url ? (
                <a className="whitespace-normal" href={story.url} target="_blank" rel="noreferrer">
                  <span className="font-medium">{story.title}</span>
                  <span className="block text-xs opacity-60">{metaLine([story.source, story.when])}</span>
                </a>
              ) : (
                <span className="whitespace-normal">
                  <span className="font-medium">{story.title}</span>
                  <span className="block text-xs opacity-60">{metaLine([story.source, story.when])}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function NewsWire({ rows }: { rows: StoryRow[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {rows.map((story, index) => (
        <li key={`${story.title}-${index}`}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/50">
            {story.source ? <span className="badge badge-ghost badge-sm">{story.source}</span> : null}
            {story.when ? <span>{story.when}</span> : null}
          </div>
          <h3 className="mt-1 font-semibold">
            <Linked text={story.title} url={story.url} />
          </h3>
          {story.line ? <p className="text-sm text-base-content/70">{story.line}</p> : null}
        </li>
      ))}
    </ul>
  );
}

function JobCards({ rows }: { rows: JobRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((job, index) => (
        <article className="card card-border bg-base-100" key={`${job.title}-${index}`}>
          <div className="card-body gap-2 p-4">
            <h3 className="card-title text-base">
              <Linked text={job.title} url={job.url} />
            </h3>
            <p className="text-sm">{metaLine([job.company, job.where])}</p>
            <div className="flex flex-wrap items-center gap-2">
              {job.tags.map((tag) => (
                <span className="badge badge-outline badge-sm" key={tag}>
                  {tag}
                </span>
              ))}
              {job.posted ? <span className="text-xs text-base-content/50">{job.posted}</span> : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function JobRows({ rows }: { rows: JobRow[] }) {
  return (
    <ul className="list">
      {rows.map((job, index) => (
        <li className="list-row" key={`${job.title}-${index}`}>
          <Initial letters={initials(job.company ?? job.title)} tone="neutral" />
          <div className="list-col-grow min-w-0">
            <div className="font-semibold">
              <Linked text={job.title} url={job.url} />
            </div>
            {job.company ? <div className="text-xs opacity-60">{job.company}</div> : null}
          </div>
          <div className="text-right text-sm">
            {job.where ? <div>{job.where}</div> : null}
            {job.posted ? <div className="text-xs opacity-60">{job.posted}</div> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function HotelCards({ rows }: { rows: HotelRow[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((hotel, index) => (
        <article className="card card-border bg-base-100" key={`${hotel.name}-${index}`}>
          <div className="card-body gap-1 p-4">
            <p className="text-2xl font-bold">
              {hotel.rate}
              <span className="text-sm font-normal text-base-content/50"> / night</span>
            </p>
            <h3 className="font-semibold">
              <Linked text={hotel.name} url={hotel.url} />
            </h3>
            {hotel.area ? <p className="text-sm text-base-content/70">{hotel.area}</p> : null}
            {hotel.rating != null ? (
              <div className="mt-1 flex items-center gap-2">
                <Stars value={hotel.rating} name={`hotel-${index}`} />
                <span className="text-sm">{hotel.rating}</span>
              </div>
            ) : null}
            {hotel.perk ? <span className="badge badge-ghost badge-sm mt-2">{hotel.perk}</span> : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function HotelList({ rows }: { rows: HotelRow[] }) {
  return (
    <ul className="list">
      {rows.map((hotel, index) => (
        <li className="list-row" key={`${hotel.name}-${index}`}>
          <div className="list-col-grow">
            <div className="font-semibold">
              <Linked text={hotel.name} url={hotel.url} />
            </div>
            <div className="text-xs opacity-60">{metaLine([hotel.area, hotel.distance, hotel.rating])}</div>
          </div>
          <div className="text-lg font-bold">{hotel.rate}</div>
        </li>
      ))}
    </ul>
  );
}

function FlightTimeline({ row }: { row: FlightRow }) {
  const legs = [
    { when: row.depart ?? "", title: `Depart ${row.from ?? ""}`.trim(), line: row.detail ?? row.airline },
    { when: row.duration ?? "", title: row.stops, line: metaLine([row.fare, row.airline]) },
    { when: row.arrive ?? "", title: `Arrive ${row.to ?? ""}`.trim(), line: "" },
  ];
  return (
    <ul className="timeline timeline-vertical timeline-compact">
      {legs.map((leg, index) => (
        <li key={leg.title}>
          {index > 0 ? <hr /> : null}
          <div className="timeline-start text-xs">{leg.when}</div>
          <div className="timeline-middle">
            <span className={`status ${index === 1 ? "status-warning" : "status-primary"}`} />
          </div>
          <div className="timeline-end timeline-box">
            <div className="font-semibold">{leg.title}</div>
            {leg.line ? <div className="text-sm">{leg.line}</div> : null}
          </div>
          {index < legs.length - 1 ? <hr /> : null}
        </li>
      ))}
    </ul>
  );
}

function FlightTable({ rows }: { rows: FlightRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Airline</th>
            <th>Depart</th>
            <th>Arrive</th>
            <th>Stops</th>
            <th>Fare</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((flight, index) => (
            <tr key={`${flight.airline}-${flight.depart}-${index}`}>
              <td className="font-semibold">{flight.airline}</td>
              <td>{flight.depart ?? "—"}</td>
              <td>{flight.arrive ?? "—"}</td>
              <td>
                <span className={`badge badge-sm ${flight.stops === "Nonstop" ? "badge-success badge-soft" : "badge-ghost"}`}>
                  {flight.stops}
                </span>
              </td>
              <td className="font-semibold">{flight.fare ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty() {
  return (
    <div role="status" className="alert alert-soft">
      <span>SerpApi returned no results.</span>
    </div>
  );
}

export function WidgetBody({ model, layout }: { model: SearchWidget; layout: number }) {
  const side = layout === 1 ? 1 : 0;
  if (model.kind === "restaurants") {
    if (!model.rows.length) return <Empty />;
    return side === 0 ? <RestaurantCards rows={model.rows} /> : <RestaurantList rows={model.rows} />;
  }
  if (model.kind === "locations") {
    if (!model.rows.length) return <Empty />;
    return side === 0 ? <LocationCards rows={model.rows} /> : <LocationTimeline rows={model.rows} />;
  }
  if (model.kind === "stocks") {
    if (!model.rows.length) return <Empty />;
    return side === 0 ? <StockStats rows={model.rows} /> : <StockTable rows={model.rows} />;
  }
  if (model.kind === "movies") {
    if (side === 0) return model.films.length ? <MovieScores films={model.films} /> : <Empty />;
    const critics = model.critics.length
      ? model.critics
      : model.films.filter((film) => film.line).map((film) => ({ name: film.title, source: film.meta, line: film.line ?? "" }));
    return critics.length ? <MovieChat critics={critics} /> : <Empty />;
  }
  if (model.kind === "people") {
    if (!model.rows.length) return <Empty />;
    return side === 0 ? <PersonCards rows={model.rows} /> : <PersonTable rows={model.rows} />;
  }
  if (model.kind === "reviews") {
    if (!model.review.reviews.length) return <Empty />;
    return side === 0 ? <ReviewSummary review={model.review} /> : <ReviewThread review={model.review} />;
  }
  if (model.kind === "shopping") {
    if (!model.rows.length) return <Empty />;
    return side === 0 ? <ShoppingTiles rows={model.rows} /> : <ShoppingTable rows={model.rows} />;
  }
  if (model.kind === "news") {
    if (!model.rows.length) return <Empty />;
    return side === 0 ? <NewsFront rows={model.rows} /> : <NewsWire rows={model.rows} />;
  }
  if (model.kind === "jobs") {
    if (!model.rows.length) return <Empty />;
    return side === 0 ? <JobCards rows={model.rows} /> : <JobRows rows={model.rows} />;
  }
  if (model.kind === "hotels") {
    if (!model.rows.length) return <Empty />;
    return side === 0 ? <HotelCards rows={model.rows} /> : <HotelList rows={model.rows} />;
  }
  if (!model.rows.length) return <Empty />;
  return side === 0 ? <FlightTimeline row={model.rows[0]} /> : <FlightTable rows={model.rows} />;
}
