import type { CSSProperties, ReactNode } from "react";

const CASES = [
  ["restaurants", "Restaurants"],
  ["stocks", "Stock prices"],
  ["movies", "Movie reviews"],
  ["people", "Person search"],
  ["locations", "Locations"],
  ["reviews", "Place reviews"],
  ["shopping", "Shopping"],
  ["news", "News"],
  ["jobs", "Jobs"],
  ["hotels", "Hotels"],
  ["flights", "Flights"],
] as const;

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

function View({ name, note, children }: { name: string; note: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div>
        <h3 className="font-semibold">{name}</h3>
        <p className="text-sm text-base-content/60">{note}</p>
      </div>
      <div className="rounded-box border border-base-300 bg-base-100 p-4">{children}</div>
    </div>
  );
}

function Case({
  id,
  title,
  blurb,
  left,
  right,
}: {
  id: string;
  title: string;
  blurb: string;
  left: { name: string; note: string; body: ReactNode };
  right: { name: string; note: string; body: ReactNode };
}) {
  return (
    <section id={id} className="scroll-mt-8 flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-1 max-w-3xl text-base-content/70">{blurb}</p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <View name={left.name} note={left.note}>
          {left.body}
        </View>
        <View name={right.name} note={right.note}>
          {right.body}
        </View>
      </div>
    </section>
  );
}

function RestaurantCards() {
  const places = [
    ["hr", "High Road Coffee", "Coffee", "$", 4.9, "Open", "107 E Main St", true],
    ["hersh", "Hersh's Coffee House", "Coffee", "$$", 4.8, "Opens 8 AM", "123 W 9th St", false],
  ] as const;
  return (
    <div className="flex flex-col gap-3">
      {places.map(([id, name, kind, price, rating, hours, address, open]) => (
        <article className="card card-border bg-base-100" key={id}>
          <div className="card-body gap-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="card-title text-base">{name}</h3>
              <span className={`badge badge-soft ${open ? "badge-success" : "badge-ghost"}`}>{hours}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Stars value={rating} name={`rest-${id}`} />
              <span className="text-sm">{rating}</span>
              <span className="badge badge-outline">{kind}</span>
              <span className="text-sm text-base-content/70">{price}</span>
            </div>
            <p className="text-sm text-base-content/70">{address}</p>
            <div className="card-actions justify-end">
              <button className="btn btn-primary btn-sm" type="button">
                Directions
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function RestaurantList() {
  const rows = [
    ["High Road Coffee", "Coffee · $ · 0.4 mi", 4.9, true],
    ["Hersh's Coffee House", "Coffee · $$ · 1.1 mi", 4.8, false],
    ["Scooter's Coffee", "Coffee · $ · 1.4 mi", 4.3, true],
  ] as const;
  return (
    <ul className="list">
      {rows.map(([name, meta, rating, open]) => (
        <li className="list-row" key={name}>
          <span className={`status mt-1 ${open ? "status-success" : "status-warning"}`} />
          <div className="list-col-grow min-w-0">
            <div className="font-semibold">{name}</div>
            <div className="text-xs opacity-60">{meta}</div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{rating}</div>
            <div className="text-xs opacity-60">{open ? "Open" : "Closed"}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function StockStats() {
  const quotes = [
    ["AAPL", "227.12", "+3.18", "+1.42%", true],
    ["NVDA", "131.20", "-2.82", "-2.10%", false],
    ["MSFT", "418.55", "+1.26", "+0.30%", true],
  ] as const;
  return (
    <div className="stats stats-vertical w-full bg-base-100 shadow">
      {quotes.map(([ticker, price, change, percent, up]) => (
        <div className="stat" key={ticker}>
          <div className="stat-title">{ticker}</div>
          <div className={`stat-value text-2xl ${up ? "text-success" : "text-error"}`}>{price}</div>
          <div className={`stat-desc ${up ? "text-success" : "text-error"}`}>
            {change} ({percent}) today
          </div>
        </div>
      ))}
    </div>
  );
}

function StockTable() {
  const rows = [
    ["AAPL", "227.12", "+1.42%", 78, true],
    ["NVDA", "131.20", "-2.10%", 35, false],
    ["MSFT", "418.55", "+0.30%", 55, true],
  ] as const;
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
          {rows.map(([ticker, price, change, range, up]) => (
            <tr key={ticker}>
              <td className="font-mono font-semibold">{ticker}</td>
              <td>{price}</td>
              <td>
                <span className={`badge badge-soft ${up ? "badge-success" : "badge-error"}`}>{change}</span>
              </td>
              <td>
                <progress className={`progress w-24 ${up ? "progress-success" : "progress-error"}`} value={range} max={100} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MovieScores() {
  const films = [
    [92, "Dune: Part Two", "Denis Villeneuve · 2024", "Huge, clear, and loud in the right places."],
    [88, "The Substance", "Coralie Fargeat · 2024", "Mean, glossy, and hard to look away from."],
    [76, "Twisters", "Lee Isaac Chung · 2024", "A straight storm movie with a good cast."],
  ] as const;
  return (
    <div className="flex flex-col gap-4">
      {films.map(([score, title, meta, line]) => (
        <article className="flex items-center gap-4" key={title}>
          <Score value={score} />
          <div className="min-w-0">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-xs uppercase tracking-wide text-base-content/50">{meta}</p>
            <p className="mt-1 text-sm">{line}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function MovieChat() {
  const notes = [
    ["Manohla Dargis", "NYT", "It has the scale of a myth and the clarity of a map.", false],
    ["Justin Chang", "New Yorker", "The desert has never looked this expensive, or this sad.", true],
    ["Audience", "Verified", "Imax or don't bother.", false],
  ] as const;
  return (
    <div className="flex flex-col">
      {notes.map(([name, source, line, end]) => (
        <div className={`chat ${end ? "chat-end" : "chat-start"}`} key={name}>
          <div className="chat-header text-xs">
            {name}
            <span className="ml-2 opacity-60">{source}</span>
          </div>
          <div className={`chat-bubble ${end ? "chat-bubble-primary" : ""}`}>{line}</div>
        </div>
      ))}
    </div>
  );
}

function PersonCards() {
  const people = [
    ["AL", "Ada Lovelace", "Mathematician", "Wrote the first published algorithm, for Babbage's Analytical Engine.", "primary"],
    ["KR", "Katherine Johnson", "Mathematician", "Calculated trajectories for the first U.S. crewed spaceflights.", "secondary"],
  ] as const;
  return (
    <div className="flex flex-col gap-3">
      {people.map(([initials, name, role, line, tone]) => (
        <article className="card card-border bg-base-100" key={name}>
          <div className="card-body flex-row items-start gap-4 p-4">
            <Initial letters={initials} tone={tone === "secondary" ? "secondary" : "primary"} />
            <div className="min-w-0">
              <h3 className="font-semibold">{name}</h3>
              <p className="text-sm text-base-content/60">{role}</p>
              <p className="mt-1 text-sm">{line}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function PersonTable() {
  const rows = [
    ["Ada Lovelace", "Mathematician", "Analytical Engine"],
    ["Katherine Johnson", "Mathematician", "NASA"],
    ["Grace Hopper", "Computer scientist", "U.S. Navy"],
  ] as const;
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
          {rows.map(([name, role, known]) => (
            <tr key={name}>
              <td className="font-semibold">{name}</td>
              <td>{role}</td>
              <td>{known}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LocationCards() {
  const places = [
    ["Golden Gate Bridge", "Landmark", "2.1 mi", "San Francisco, CA"],
    ["Ferry Building", "Market", "0.6 mi", "1 Ferry Building"],
    ["Alcatraz Island", "Park", "3.4 mi", "San Francisco Bay"],
  ] as const;
  return (
    <div className="flex flex-col gap-3">
      {places.map(([name, kind, distance, address]) => (
        <div className="indicator mt-2 w-full" key={name}>
          <span className="indicator-item badge badge-primary">{distance}</span>
          <article className="card card-border w-full bg-base-100">
            <div className="card-body p-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{name}</h3>
                <span className="badge badge-ghost badge-sm">{kind}</span>
              </div>
              <p className="text-sm text-base-content/70">{address}</p>
            </div>
          </article>
        </div>
      ))}
    </div>
  );
}

function LocationTimeline() {
  const stops = [
    ["0.6 mi", "Ferry Building", "Start here. Market hall on the Embarcadero."],
    ["2.1 mi", "Golden Gate Bridge", "Walk or drive out to the vista point."],
    ["3.4 mi", "Alcatraz", "Ferries leave from Pier 33."],
  ] as const;
  return (
    <ul className="timeline timeline-vertical timeline-compact">
      {stops.map(([distance, name, line], index) => (
        <li key={name}>
          {index > 0 ? <hr /> : null}
          <div className="timeline-start text-xs">{distance}</div>
          <div className="timeline-middle">
            <span className="status status-primary" />
          </div>
          <div className="timeline-end timeline-box">
            <div className="font-semibold">{name}</div>
            <div className="text-sm">{line}</div>
          </div>
          {index < stops.length - 1 ? <hr /> : null}
        </li>
      ))}
    </ul>
  );
}

function ReviewSummary() {
  const bars = [
    [5, 72],
    [4, 16],
    [3, 7],
    [2, 3],
    [1, 2],
  ] as const;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-4">
        <div>
          <div className="text-4xl font-bold leading-none">4.6</div>
          <Stars value={4.6} name="review-overall" />
          <p className="text-xs text-base-content/60">1,284 reviews · Blue Bottle</p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {bars.map(([star, value]) => (
            <div className="flex items-center gap-2" key={star}>
              <span className="w-3 text-xs">{star}</span>
              <progress className="progress progress-warning w-full" value={value} max={100} />
            </div>
          ))}
        </div>
      </div>
      <div className="alert alert-soft items-start">
        <span>The espresso was tight and the room was quiet enough to work. — Priya, last week</span>
      </div>
    </div>
  );
}

function ReviewThread() {
  const reviews = [
    ["Priya", 5, "Last week", "The espresso was tight and the room was quiet enough to work."],
    ["Andre", 4, "2 weeks ago", "Good pour-over. The line at 9 is longer than the coffee is worth."],
    ["Mei", 3, "Last month", "Fine pastry, slow service on Sunday."],
  ] as const;
  return (
    <div className="flex flex-col gap-2">
      {reviews.map(([name, stars, when, line], index) => (
        <div className="collapse collapse-arrow border border-base-300 bg-base-100" key={name}>
          <input type="checkbox" defaultChecked={index === 0} />
          <div className="collapse-title flex items-center gap-3 pe-10 font-semibold">
            <span>{name}</span>
            <Stars value={stars} name={`rev-${name}`} />
            <span className="text-xs font-normal text-base-content/50">{when}</span>
          </div>
          <div className="collapse-content text-sm">{line}</div>
        </div>
      ))}
    </div>
  );
}

function ShoppingTiles() {
  const products = [
    ["Keychron K2", "₹4,999", "Amazon", 4.6],
    ["RK84", "₹3,499", "Meckeys", 4.4],
    ["MX Mechanical", "₹8,495", "Logitech", 4.7],
  ] as const;
  return (
    <div className="grid gap-3">
      {products.map(([title, price, source, rating]) => (
        <article className="flex items-center justify-between gap-3 rounded-box border border-base-300 p-3" key={title}>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="badge badge-outline badge-sm">{source}</span>
              <Stars value={rating} name={`shop-${title}`} />
            </div>
          </div>
          <p className="text-xl font-bold">{price}</p>
        </article>
      ))}
    </div>
  );
}

function ShoppingTable() {
  const rows = [
    ["Keychron K2", "₹4,999", "Amazon", "4.6", "Hot-swap"],
    ["RK84", "₹3,499", "Meckeys", "4.4", "Knob"],
    ["MX Mechanical", "₹8,495", "Logitech", "4.7", "Low profile"],
  ] as const;
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
          {rows.map(([product, price, store, rating, note]) => (
            <tr key={product}>
              <td className="font-semibold">{product}</td>
              <td>{price}</td>
              <td>{store}</td>
              <td>{rating}</td>
              <td>{note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NewsFront() {
  const rest = [
    ["AP", "4h", "Crew arrives at the station after a one-day chase"],
    ["The Verge", "6h", "What the new booster reuse record actually means"],
    ["BBC", "9h", "Weather held. The window was eleven minutes."],
  ] as const;
  return (
    <div>
      <div className="hero rounded-box bg-base-200">
        <div className="hero-content items-start px-2 py-6">
          <div>
            <span className="badge badge-primary badge-sm">Reuters · 2h ago</span>
            <h3 className="mt-2 text-xl font-bold">SpaceX launches 23 satellites before dawn</h3>
            <p className="mt-1 text-sm">The booster landed on the drone ship nine minutes later.</p>
          </div>
        </div>
      </div>
      <ul className="menu mt-1 w-full px-0">
        {rest.map(([source, when, title]) => (
          <li key={title}>
            <span className="whitespace-normal">
              <span className="font-medium">{title}</span>
              <span className="block text-xs opacity-60">
                {source} · {when}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewsWire() {
  const stories = [
    ["Reuters", "2h", "SpaceX launches 23 satellites before dawn", "The booster landed on the drone ship nine minutes later."],
    ["AP", "4h", "Crew arrives at the station after a one-day chase", "Docking was delayed once while they checked a sensor."],
    ["BBC", "9h", "Weather held for an eleven-minute window", "The next attempt was already booked for Thursday."],
  ] as const;
  return (
    <ul className="flex flex-col gap-4">
      {stories.map(([source, when, title, line]) => (
        <li key={title}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-base-content/50">
            <span className="badge badge-ghost badge-sm">{source}</span>
            <span>{when} ago</span>
          </div>
          <h3 className="mt-1 font-semibold">{title}</h3>
          <p className="text-sm text-base-content/70">{line}</p>
        </li>
      ))}
    </ul>
  );
}

function JobCards() {
  const jobs = [
    ["Go developer", "Northwind", "New York, NY", "3 days ago", ["Full-time", "On-site"]],
    ["Platform engineer", "Example", "Remote", "1 week ago", ["Full-time", "Remote"]],
  ] as const;
  return (
    <div className="flex flex-col gap-3">
      {jobs.map(([title, company, where, posted, tags]) => (
        <article className="card card-border bg-base-100" key={title}>
          <div className="card-body gap-2 p-4">
            <h3 className="card-title text-base">{title}</h3>
            <p className="text-sm">
              {company} · {where}
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span className="badge badge-outline badge-sm" key={tag}>
                  {tag}
                </span>
              ))}
              <span className="text-xs text-base-content/50">{posted}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function JobRows() {
  const rows = [
    ["NW", "Go developer", "Northwind", "New York", "3d"],
    ["EX", "Platform engineer", "Example", "Remote", "1w"],
    ["HL", "Backend engineer", "Helios", "Austin", "2w"],
  ] as const;
  return (
    <ul className="list">
      {rows.map(([initials, title, company, where, posted]) => (
        <li className="list-row" key={title}>
          <Initial letters={initials} tone="neutral" />
          <div className="list-col-grow min-w-0">
            <div className="font-semibold">{title}</div>
            <div className="text-xs opacity-60">{company}</div>
          </div>
          <div className="text-right text-sm">
            <div>{where}</div>
            <div className="text-xs opacity-60">{posted}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function HotelCards() {
  const hotels = [
    ["The Marker", "$289", "4.5", "Mission Bay", "Free cancellation"],
    ["Hotel Zephyr", "$214", "4.2", "Fisherman's Wharf", "Breakfast included"],
  ] as const;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {hotels.map(([name, price, rating, area, perk]) => (
        <article className="card card-border bg-base-100" key={name}>
          <div className="card-body gap-1 p-4">
            <p className="text-2xl font-bold">
              {price}
              <span className="text-sm font-normal text-base-content/50"> / night</span>
            </p>
            <h3 className="font-semibold">{name}</h3>
            <p className="text-sm text-base-content/70">{area}</p>
            <div className="mt-1 flex items-center gap-2">
              <Stars value={Number(rating)} name={`hotel-${name}`} />
              <span className="text-sm">{rating}</span>
            </div>
            <span className="badge badge-ghost badge-sm mt-2">{perk}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function HotelList() {
  const rows = [
    ["The Marker", "Mission Bay", "$289", "4.5", "0.8 mi"],
    ["Hotel Zephyr", "Fisherman's Wharf", "$214", "4.2", "2.4 mi"],
    ["Hotel G", "Union Square", "$176", "4.0", "1.2 mi"],
  ] as const;
  return (
    <ul className="list">
      {rows.map(([name, area, price, rating, distance]) => (
        <li className="list-row" key={name}>
          <div className="list-col-grow">
            <div className="font-semibold">{name}</div>
            <div className="text-xs opacity-60">
              {area} · {distance} · {rating}
            </div>
          </div>
          <div className="text-lg font-bold">{price}</div>
        </li>
      ))}
    </ul>
  );
}

function FlightTimeline() {
  const legs = [
    ["6:10 AM", "Depart SFO", "United 512 · Terminal 3"],
    ["5h 30m", "Nonstop", "$248 · Main Cabin"],
    ["2:40 PM", "Arrive JFK", "Terminal 7"],
  ] as const;
  return (
    <ul className="timeline timeline-vertical timeline-compact">
      {legs.map(([when, title, line], index) => (
        <li key={title}>
          {index > 0 ? <hr /> : null}
          <div className="timeline-start text-xs">{when}</div>
          <div className="timeline-middle">
            <span className={`status ${index === 1 ? "status-warning" : "status-primary"}`} />
          </div>
          <div className="timeline-end timeline-box">
            <div className="font-semibold">{title}</div>
            <div className="text-sm">{line}</div>
          </div>
          {index < legs.length - 1 ? <hr /> : null}
        </li>
      ))}
    </ul>
  );
}

function FlightTable() {
  const rows = [
    ["United", "6:10 AM", "2:40 PM", "Nonstop", "$248"],
    ["JetBlue", "8:45 AM", "5:20 PM", "Nonstop", "$231"],
    ["Delta", "11:15 AM", "9:05 PM", "1 stop", "$198"],
  ] as const;
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
          {rows.map(([airline, depart, arrive, stops, fare]) => (
            <tr key={airline}>
              <td className="font-semibold">{airline}</td>
              <td>{depart}</td>
              <td>{arrive}</td>
              <td>
                <span className={`badge badge-sm ${stops === "Nonstop" ? "badge-success badge-soft" : "badge-ghost"}`}>
                  {stops}
                </span>
              </td>
              <td className="font-semibold">{fare}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Gallery() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10">
      <header className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Widget lab</p>
          <h1 className="mt-1 text-3xl font-bold">Two layouts for each result</h1>
          <p className="mt-2 max-w-3xl text-base-content/70">
            Static samples. Each pair is a different DaisyUI layout for the same kind of search. Pick the one to keep.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Use cases">
          {CASES.map(([id, label]) => (
            <a className="btn btn-sm btn-outline" href={`#${id}`} key={id}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <Case
        id="restaurants"
        title="Restaurants"
        blurb="Somewhere to eat tonight. One view sells the place. The other is for scanning what is open."
        left={{ name: "Place cards", note: "Rating, price, and hours on each venue.", body: <RestaurantCards /> }}
        right={{ name: "Open list", note: "Status dot, distance, and score in a row.", body: <RestaurantList /> }}
      />
      <Case
        id="stocks"
        title="Stock prices"
        blurb="A quote someone checks twice. Big numbers, then a watchlist."
        left={{ name: "Quote board", note: "One stat per ticker, colored by the day's move.", body: <StockStats /> }}
        right={{ name: "Watchlist", note: "Price, change badge, and where the day sits in its range.", body: <StockTable /> }}
      />
      <Case
        id="movies"
        title="Movie reviews"
        blurb="A score first, or the sentences people actually wrote."
        left={{ name: "Score cards", note: "Critic score beside the title and a one-line consensus.", body: <MovieScores /> }}
        right={{ name: "Critic thread", note: "Each review is a chat bubble with the writer's name.", body: <MovieChat /> }}
      />
      <Case
        id="people"
        title="Person search"
        blurb="Who this person is, in a profile or in a directory."
        left={{ name: "Profiles", note: "Initials, role, and a one-line bio.", body: <PersonCards /> }}
        right={{ name: "Directory", note: "Name, role, and what they are known for.", body: <PersonTable /> }}
      />
      <Case
        id="locations"
        title="Locations"
        blurb="Places on a map, either as pins or as a route."
        left={{ name: "Pin cards", note: "Distance sits on the corner of each place.", body: <LocationCards /> }}
        right={{ name: "Route", note: "Stops in order, with distance on the timeline.", body: <LocationTimeline /> }}
      />
      <Case
        id="reviews"
        title="Place reviews"
        blurb="One place, many opinions. A score breakdown, or the reviews themselves."
        left={{ name: "Score breakdown", note: "Overall rating and how the stars are spread.", body: <ReviewSummary /> }}
        right={{ name: "Review thread", note: "Each review opens on its own.", body: <ReviewThread /> }}
      />
      <Case
        id="shopping"
        title="Shopping"
        blurb="A product to buy. Price is the loudest thing, or the rows line up for comparison."
        left={{ name: "Price tiles", note: "Name, store, rating, and a large price.", body: <ShoppingTiles /> }}
        right={{ name: "Compare", note: "Product, price, store, rating, and a short note.", body: <ShoppingTable /> }}
      />
      <Case
        id="news"
        title="News"
        blurb="A front page, or a wire of headlines in time order."
        left={{ name: "Front page", note: "One lead story, then the rest as a menu.", body: <NewsFront /> }}
        right={{ name: "Wire", note: "Source, age, headline, and a single sentence.", body: <NewsWire /> }}
      />
      <Case
        id="jobs"
        title="Jobs"
        blurb="A role someone might apply to."
        left={{ name: "Postings", note: "Title, company, place, and tags such as remote.", body: <JobCards /> }}
        right={{ name: "Board", note: "Company mark, title, and location on one row.", body: <JobRows /> }}
      />
      <Case
        id="hotels"
        title="Hotels"
        blurb="A room for the night. Price per night leads."
        left={{ name: "Stay cards", note: "Nightly rate, area, rating, and one perk.", body: <HotelCards /> }}
        right={{ name: "Rate list", note: "Scan names against the price on the right.", body: <HotelList /> }}
      />
      <Case
        id="flights"
        title="Flights"
        blurb="One itinerary told in order, or several fares in a table."
        left={{ name: "Itinerary", note: "Depart, the flight itself, then arrival.", body: <FlightTimeline /> }}
        right={{ name: "Fares", note: "Airline, times, stops, and price.", body: <FlightTable /> }}
      />
    </main>
  );
}
