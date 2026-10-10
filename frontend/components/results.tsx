"use client";

/* Thumbnails come from whichever host SerpApi returns. */
/* eslint-disable @next/next/no-img-element */

import { useState, type CSSProperties, type ReactNode } from "react";
import type { Item } from "@/lib/items";

type ViewProps = { items: Item[] };

function short(text: string, max = 32): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function lead(item: Item): string {
  return item.facts[0]?.value ?? "";
}

function ratingOf(item: Item): number | undefined {
  const raw = item.facts.find((fact) => fact.label === "Rating")?.value;
  if (!raw) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(5, value));
}

function percentOf(item: Item): number {
  const rating = ratingOf(item);
  if (rating === undefined) return 0;
  return Math.round((rating / 5) * 100);
}

function integerOf(item: Item): number | undefined {
  for (const fact of item.facts) {
    const value = Number(fact.value.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(value) && value >= 0 && value < 1000) return Math.round(value);
  }
  return undefined;
}

function Thumb({ item, className }: { item: Item; className?: string }) {
  if (!item.image) return null;
  return <img src={item.image} alt="" className={className ?? "h-16 w-16 rounded-box object-cover"} />;
}

function ItemTitle({ item }: { item: Item }) {
  if (!item.url) return <span className="font-semibold">{item.title}</span>;
  return (
    <a className="link link-hover font-semibold" href={item.url} target="_blank" rel="noreferrer">
      {item.title}
    </a>
  );
}

function Snippet({ item }: { item: Item }) {
  if (!item.snippet) return null;
  return <p className="text-sm leading-6">{item.snippet}</p>;
}

function Facts({ item }: { item: Item }) {
  if (!item.facts.length) return null;
  return (
    <p className="text-sm text-base-content/70">
      {item.facts.map((fact) => `${fact.label}: ${fact.value}`).join(" · ")}
    </p>
  );
}

function Detail({ item }: { item: Item }) {
  return (
    <article className="rounded-box border border-base-300 bg-base-100 p-4">
      <div className="flex gap-4">
        <Thumb item={item} className="h-20 w-20 rounded-box object-cover" />
        <div className="min-w-0">
          <h3 className="text-lg">
            <ItemTitle item={item} />
          </h3>
          <Snippet item={item} />
          <Facts item={item} />
        </div>
      </div>
    </article>
  );
}

function ItemList({ items }: ViewProps) {
  return (
    <ul className="list rounded-box border border-base-300 bg-base-100">
      {items.map((item, index) => (
        <li className="list-row" key={index}>
          <Thumb item={item} />
          <div className="list-col-grow min-w-0">
            <ItemTitle item={item} />
            <Facts item={item} />
          </div>
          {item.snippet ? <p className="list-col-wrap text-sm text-base-content/70">{item.snippet}</p> : null}
        </li>
      ))}
    </ul>
  );
}

function Cards({ items }: ViewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item, index) => (
        <article className="card card-border bg-base-100" key={index}>
          {item.image ? (
            <figure className="bg-base-200">
              <img src={item.image} alt="" className="h-40 w-full object-contain" />
            </figure>
          ) : null}
          <div className="card-body">
            <h3 className="card-title text-base">
              <ItemTitle item={item} />
            </h3>
            <Snippet item={item} />
            <Facts item={item} />
            {item.url ? (
              <div className="card-actions justify-end">
                <a className="btn btn-primary btn-sm" href={item.url} target="_blank" rel="noreferrer">
                  Open
                </a>
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function TableView({ items }: ViewProps) {
  return (
    <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Result</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td className="max-w-xs !whitespace-normal">
                <ItemTitle item={item} />
                <Snippet item={item} />
              </td>
              <td className="max-w-sm !whitespace-normal">
                <Facts item={item} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TimelineView({ items }: ViewProps) {
  return (
    <ul className="timeline timeline-vertical">
      {items.map((item, index) => (
        <li key={index}>
          {index > 0 ? <hr /> : null}
          <div className="timeline-start text-sm">{lead(item)}</div>
          <div className="timeline-middle">
            <span className="status status-primary" />
          </div>
          <div className="timeline-end timeline-box">
            <ItemTitle item={item} />
            <Snippet item={item} />
            <Facts item={item} />
          </div>
          {index < items.length - 1 ? <hr /> : null}
        </li>
      ))}
    </ul>
  );
}

function ChatView({ items }: ViewProps) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div className={`chat ${index % 2 === 0 ? "chat-start" : "chat-end"}`} key={index}>
          <div className="chat-header text-sm">{lead(item) || "Result"}</div>
          <div className="chat-bubble">
            <div className="font-semibold">{item.title}</div>
            {item.snippet ? <div className="mt-1 text-sm">{item.snippet}</div> : null}
          </div>
          {item.url ? (
            <div className="chat-footer">
              <a className="link text-xs" href={item.url} target="_blank" rel="noreferrer">
                Open
              </a>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CollapseView({ items, single }: ViewProps & { single?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div className="collapse collapse-arrow border border-base-300 bg-base-100" key={index}>
          <input
            type={single ? "radio" : "checkbox"}
            name={single ? "result-accordion" : undefined}
            defaultChecked={index === 0}
          />
          <div className="collapse-title font-semibold">{item.title}</div>
          <div className="collapse-content">
            <Snippet item={item} />
            <Facts item={item} />
            {item.url ? (
              <a className="link link-hover text-sm" href={item.url} target="_blank" rel="noreferrer">
                Open
              </a>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function CarouselView({ items }: ViewProps) {
  return (
    <div className="carousel carousel-center w-full gap-4 rounded-box bg-base-200 p-4">
      {items.map((item, index) => (
        <div className="carousel-item w-72" key={index}>
          <article className="card card-border w-full bg-base-100">
            {item.image ? (
              <figure>
                <img src={item.image} alt="" className="h-36 w-full object-cover" />
              </figure>
            ) : null}
            <div className="card-body">
              <h3 className="card-title text-base">{item.title}</h3>
              <Snippet item={item} />
              <Facts item={item} />
            </div>
          </article>
        </div>
      ))}
    </div>
  );
}

function MenuView({ items }: ViewProps) {
  return (
    <ul className="menu w-full rounded-box bg-base-100 border border-base-300">
      {items.map((item, index) => (
        <li key={index}>
          {item.url ? (
            <a href={item.url} target="_blank" rel="noreferrer">
              <span>
                <span className="font-semibold">{item.title}</span>
                {item.snippet ? <span className="block text-xs opacity-70">{item.snippet}</span> : null}
              </span>
            </a>
          ) : (
            <span>
              <span className="font-semibold">{item.title}</span>
              {item.snippet ? <span className="block text-xs opacity-70">{item.snippet}</span> : null}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function StatView({ items }: ViewProps) {
  return (
    <div className="stats stats-vertical w-full bg-base-100 shadow">
      {items.map((item, index) => (
        <div className="stat" key={index}>
          <div className="stat-title !whitespace-normal">{item.title}</div>
          <div className="stat-value text-2xl">{lead(item) || "—"}</div>
          {item.snippet ? <div className="stat-desc !whitespace-normal">{item.snippet}</div> : null}
        </div>
      ))}
    </div>
  );
}

function AlertView({ items }: ViewProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div role="status" className="alert alert-soft items-start" key={index}>
          <div>
            <ItemTitle item={item} />
            <Snippet item={item} />
            <Facts item={item} />
          </div>
        </div>
      ))}
    </div>
  );
}

function HeroView({ items }: ViewProps) {
  const [first, ...rest] = items;
  return (
    <div className="flex flex-col gap-4">
      <div className="hero rounded-box bg-base-100">
        <div className="hero-content flex-col sm:flex-row">
          <Thumb item={first} className="h-40 w-40 rounded-box object-cover" />
          <div>
            <h3 className="text-2xl font-bold">{first.title}</h3>
            <Snippet item={first} />
            <Facts item={first} />
            {first.url ? (
              <a className="btn btn-primary mt-3" href={first.url} target="_blank" rel="noreferrer">
                Open
              </a>
            ) : null}
          </div>
        </div>
      </div>
      {rest.length ? <ItemList items={rest} /> : null}
    </div>
  );
}

function StackView({ items }: ViewProps) {
  return (
    <div className="stack w-full">
      {items.map((item, index) => (
        <article className="card card-border w-full bg-base-100" key={index}>
          <div className="card-body">
            <h3 className="card-title text-base">{item.title}</h3>
            <Snippet item={item} />
          </div>
        </article>
      ))}
    </div>
  );
}

function StepsView({ items }: ViewProps) {
  return (
    <ul className="steps steps-vertical">
      {items.map((item, index) => (
        <li className="step step-primary text-left" key={index}>
          <span>
            <span className="font-semibold">{item.title}</span>
            {item.snippet ? <span className="block text-xs font-normal opacity-70">{item.snippet}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TabsView({ items }: ViewProps) {
  const [current, setCurrent] = useState(0);
  return (
    <div>
      <div role="tablist" className="tabs tabs-box">
        {items.map((item, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            className={`tab ${index === current ? "tab-active" : ""}`}
            aria-selected={index === current}
            onClick={() => setCurrent(index)}
          >
            {short(item.title, 18)}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <Detail item={items[current] ?? items[0]} />
      </div>
    </div>
  );
}

function BadgeView({ items }: ViewProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div className="flex flex-wrap items-start gap-2" key={index}>
          <span className="badge badge-primary badge-lg">{lead(item) || "result"}</span>
          <div className="min-w-0">
            <ItemTitle item={item} />
            <Snippet item={item} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ToastView({ items }: ViewProps) {
  return (
    <div
      className="toast toast-center"
      style={{ position: "relative", inset: "auto", transform: "none", width: "100%", maxWidth: "none" }}
    >
      {items.map((item, index) => (
        <div role="status" className="alert alert-soft w-full" key={index}>
          <div>
            <ItemTitle item={item} />
            <Snippet item={item} />
          </div>
        </div>
      ))}
    </div>
  );
}

function LinkView({ items }: ViewProps) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li key={index}>
          <ItemTitle item={item} />
          <Snippet item={item} />
          <Facts item={item} />
        </li>
      ))}
    </ul>
  );
}

function BreadcrumbsView({ items }: ViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs text-sm">
        <ul>
          {items.map((item, index) => (
            <li key={index}>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer">
                  {short(item.title, 24)}
                </a>
              ) : (
                <span>{short(item.title, 24)}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <ItemList items={items} />
    </div>
  );
}

function DividerView({ items }: ViewProps) {
  return (
    <div>
      {items.map((item, index) => (
        <div key={index}>
          {index > 0 ? <div className="divider" /> : null}
          <ItemTitle item={item} />
          <Snippet item={item} />
          <Facts item={item} />
        </div>
      ))}
    </div>
  );
}

function Controls({ items, control }: ViewProps & { control: "checkbox" | "radio" | "toggle" }) {
  const className = control === "toggle" ? "toggle mt-1" : control;
  return (
    <fieldset className="fieldset rounded-box border border-base-300 bg-base-100 p-4">
      {items.map((item, index) => (
        <label className="flex items-start gap-3 py-2 text-base" key={index}>
          <input className={className} type={control === "radio" ? "radio" : "checkbox"} name="picked-results" />
          <span className="min-w-0">
            <span className="font-semibold">{item.title}</span>
            <Snippet item={item} />
            <Facts item={item} />
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function ButtonView({ items }: ViewProps) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => {
        const className = "btn btn-outline h-auto justify-start py-3";
        const body = (
          <span className="flex flex-col items-start whitespace-normal text-left">
            <span>{item.title}</span>
            {item.snippet ? <span className="text-xs font-normal opacity-70">{item.snippet}</span> : null}
          </span>
        );
        return item.url ? (
          <a className={className} href={item.url} target="_blank" rel="noreferrer" key={index}>
            {body}
          </a>
        ) : (
          <button className={className} type="button" key={index}>
            {body}
          </button>
        );
      })}
    </div>
  );
}

function JoinView({ items }: ViewProps) {
  return (
    <div className="join join-vertical w-full">
      {items.map((item, index) => (
        <button className="btn join-item h-auto justify-start py-3" type="button" key={index}>
          {item.title}
        </button>
      ))}
    </div>
  );
}

function SelectView({ items }: ViewProps) {
  const [current, setCurrent] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      <select
        className="select w-full"
        value={current}
        aria-label="Results"
        onChange={(event) => setCurrent(Number(event.target.value))}
      >
        {items.map((item, index) => (
          <option value={index} key={index}>
            {item.title}
          </option>
        ))}
      </select>
      <Detail item={items[current] ?? items[0]} />
    </div>
  );
}

function FilterView({ items }: ViewProps) {
  const [current, setCurrent] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      <div className="filter">
        {items.map((item, index) => (
          <input
            key={index}
            className="btn"
            type="radio"
            name="result-filter"
            aria-label={short(item.title, 22)}
            checked={index === current}
            onChange={() => setCurrent(index)}
          />
        ))}
      </div>
      <Detail item={items[current] ?? items[0]} />
    </div>
  );
}

function PaginationView({ items }: ViewProps) {
  const [current, setCurrent] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      <div className="join">
        {items.map((item, index) => (
          <button
            key={index}
            type="button"
            className={`btn join-item ${index === current ? "btn-active" : ""}`}
            aria-label={item.title}
            onClick={() => setCurrent(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <Detail item={items[current] ?? items[0]} />
    </div>
  );
}

function DrawerView({ items }: ViewProps) {
  const [current, setCurrent] = useState(0);
  return (
    <div className="flex flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 sm:flex-row">
      <ul className="menu w-full bg-base-200 sm:w-56">
        {items.map((item, index) => (
          <li key={index}>
            <button type="button" className={index === current ? "menu-active" : ""} onClick={() => setCurrent(index)}>
              {short(item.title, 28)}
            </button>
          </li>
        ))}
      </ul>
      <div className="min-w-0 flex-1 p-4">
        <Detail item={items[current] ?? items[0]} />
      </div>
    </div>
  );
}

function NavbarView({ items }: ViewProps) {
  return (
    <div className="rounded-box border border-base-300 bg-base-100">
      <div className="navbar">
        <span className="text-lg font-semibold">Results</span>
      </div>
      <MenuView items={items} />
    </div>
  );
}

function FooterView({ items }: ViewProps) {
  return (
    <footer className="footer footer-vertical rounded-box bg-base-200 p-6">
      <nav>
        <h3 className="footer-title">Results</h3>
        {items.map((item, index) => (
          <span key={index}>
            <ItemTitle item={item} />
            {item.snippet ? <span className="block text-xs opacity-70">{item.snippet}</span> : null}
          </span>
        ))}
      </nav>
    </footer>
  );
}

function DropdownView({ items }: ViewProps) {
  return (
    <div className="dropdown dropdown-open w-full">
      <div tabIndex={0} role="button" className="btn">
        {items.length} results
      </div>
      <ul tabIndex={0} className="dropdown-content menu z-10 !static mt-2 w-full rounded-box bg-base-100 p-2 shadow">
        {items.map((item, index) => (
          <li key={index}>
            <span>
              <span className="font-semibold">{item.title}</span>
              {item.snippet ? <span className="block text-xs opacity-70">{item.snippet}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DockView({ items }: ViewProps) {
  const [current, setCurrent] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      <div className="dock" style={{ position: "relative", inset: "auto" }}>
        {items.map((item, index) => (
          <button type="button" key={index} className={index === current ? "dock-active" : ""} onClick={() => setCurrent(index)}>
            <span className="dock-label">{short(item.title, 14)}</span>
          </button>
        ))}
      </div>
      <Detail item={items[current] ?? items[0]} />
    </div>
  );
}

function HoverZones() {
  return (
    <>
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
    </>
  );
}

function Hover3dView({ items }: ViewProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {items.map((item, index) => {
        const card = (
          <article className="card card-border bg-base-100">
            <div className="card-body">
              <h3 className="card-title text-base">{item.title}</h3>
              <Snippet item={item} />
              <Facts item={item} />
            </div>
          </article>
        );
        return item.url ? (
          <a className="hover-3d" href={item.url} target="_blank" rel="noreferrer" key={index}>
            {card}
            <HoverZones />
          </a>
        ) : (
          <div className="hover-3d" key={index}>
            {card}
            <HoverZones />
          </div>
        );
      })}
    </div>
  );
}

function HoverGalleryView({ items }: ViewProps) {
  const images = items.filter((item) => item.image).slice(0, 10);
  if (images.length < 2) return <Cards items={items} />;
  return (
    <div className="flex flex-col gap-4">
      <figure className="hover-gallery h-64 w-full rounded-box">
        {images.map((item, index) => (
          <img src={item.image} alt={item.title} key={index} />
        ))}
      </figure>
      <ItemList items={items} />
    </div>
  );
}

function AuraView({ items }: ViewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item, index) => (
        <div className="aura aura-glow w-full" key={index}>
          <article className="card w-full bg-base-100">
            <div className="card-body">
              <h3 className="card-title text-base">{item.title}</h3>
              <Snippet item={item} />
              <Facts item={item} />
            </div>
          </article>
        </div>
      ))}
    </div>
  );
}

function AvatarView({ items }: ViewProps) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li className="flex items-center gap-3" key={index}>
          <div className="avatar">
            <div className="w-12 rounded-full bg-base-300">
              {item.image ? <img src={item.image} alt="" /> : <span className="text-lg">{item.title.slice(0, 1)}</span>}
            </div>
          </div>
          <div>
            <ItemTitle item={item} />
            <Facts item={item} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function IndicatorView({ items }: ViewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item, index) => (
        <div className="indicator w-full" key={index}>
          {lead(item) ? <span className="indicator-item badge badge-primary">{short(lead(item), 16)}</span> : null}
          <article className="card card-border w-full bg-base-100">
            <div className="card-body">
              <h3 className="card-title text-base">{item.title}</h3>
              <Snippet item={item} />
            </div>
          </article>
        </div>
      ))}
    </div>
  );
}

function KbdView({ items }: ViewProps) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li key={index}>
          <ItemTitle item={item} />
          <span className="mt-1 flex flex-wrap gap-1">
            {item.facts.map((fact) => (
              <kbd className="kbd" key={fact.label}>
                {short(fact.value, 18)}
              </kbd>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

function StatusView({ items }: ViewProps) {
  const colors = ["status-success", "status-info", "status-warning", "status-error"];
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li className="flex items-start gap-2" key={index}>
          <span className={`status mt-1 ${colors[index % colors.length]}`} />
          <div>
            <ItemTitle item={item} />
            <Snippet item={item} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function TooltipView({ items }: ViewProps) {
  return (
    <ul className="flex flex-col items-start gap-3">
      {items.map((item, index) => (
        <li key={index}>
          <div className="tooltip tooltip-right" data-tip={short(item.snippet || lead(item) || item.title, 80)}>
            <ItemTitle item={item} />
          </div>
          <Facts item={item} />
        </li>
      ))}
    </ul>
  );
}

function LoadingView({ items }: ViewProps) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li className="flex items-center gap-3" key={index}>
          <span className="loading loading-spinner loading-sm" />
          <ItemTitle item={item} />
        </li>
      ))}
    </ul>
  );
}

function SkeletonView({ items }: ViewProps) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li className="relative overflow-hidden rounded-box p-4" key={index}>
          <div className="skeleton absolute inset-0" />
          <div className="relative">
            <ItemTitle item={item} />
            <Snippet item={item} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function MaskView({ items }: ViewProps) {
  if (!items.some((item) => item.image)) return <ItemList items={items} />;
  return (
    <ul className="flex flex-col gap-4">
      {items.map((item, index) => (
        <li className="flex items-center gap-4" key={index}>
          {item.image ? (
            <img src={item.image} alt="" className="mask mask-squircle h-20 w-20 object-cover" />
          ) : null}
          <div>
            <ItemTitle item={item} />
            <Snippet item={item} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Mockup({ items, kind }: ViewProps & { kind: "browser" | "code" | "phone" | "window" }) {
  if (kind === "code") {
    return (
      <div className="mockup-code w-full">
        {items.map((item, index) => (
          <pre data-prefix={index + 1} key={index}>
            <code>
              {item.title}
              {item.snippet ? ` — ${item.snippet}` : ""}
            </code>
          </pre>
        ))}
      </div>
    );
  }
  const body = (
    <div className="bg-base-100 p-4 text-left">
      <ItemList items={items} />
    </div>
  );
  if (kind === "browser") {
    return (
      <div className="mockup-browser w-full border border-base-300">
        <div className="mockup-browser-toolbar">
          <div className="input">{items[0]?.url || items[0]?.title}</div>
        </div>
        {body}
      </div>
    );
  }
  if (kind === "phone") {
    return (
      <div className="mockup-phone">
        <div className="mockup-phone-camera" />
        <div className="mockup-phone-display overflow-y-auto">{body}</div>
      </div>
    );
  }
  return <div className="mockup-window w-full border border-base-300">{body}</div>;
}

function ModalView({ items }: ViewProps) {
  return (
    <div className="modal-box relative w-full max-w-none">
      <ItemList items={items} />
    </div>
  );
}

function DiffView({ items }: ViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item, index) => (
        <figure className="diff h-36 rounded-box" tabIndex={0} key={index}>
          <div className="diff-item-1" role="img" tabIndex={0}>
            <div className="grid h-full place-content-center bg-primary p-4 text-center font-semibold text-primary-content">
              {item.title}
            </div>
          </div>
          <div className="diff-item-2" role="img">
            <div className="grid h-full place-content-center bg-base-200 p-4 text-center text-sm">
              {item.snippet || lead(item) || item.title}
            </div>
          </div>
          <div className="diff-resizer" />
        </figure>
      ))}
    </div>
  );
}

function SwapView({ items }: ViewProps) {
  return (
    <div className="flex flex-col items-start gap-4">
      {items.map((item, index) => (
        <label className="swap text-left" key={index}>
          <input type="checkbox" />
          <div className="swap-off font-semibold">{item.title}</div>
          <div className="swap-on max-w-xl text-sm">{item.snippet || lead(item) || item.title}</div>
        </label>
      ))}
    </div>
  );
}

function TextRotateView({ items }: ViewProps) {
  const lines = items.slice(0, 6);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xl font-semibold">
        <span className="text-rotate">
          <span>
            {lines.map((item, index) => (
              <span key={index}>{short(item.title, 42)}</span>
            ))}
          </span>
        </span>
      </p>
      <ItemList items={items} />
    </div>
  );
}

function CountdownView({ items }: ViewProps) {
  return (
    <ul className="flex flex-col gap-4">
      {items.map((item, index) => {
        const value = integerOf(item);
        return (
          <li className="flex items-center gap-4" key={index}>
            {value !== undefined ? (
              <span className="countdown font-mono text-3xl">
                <span style={{ "--value": value } as CSSProperties} aria-label={String(value)}>
                  {value}
                </span>
              </span>
            ) : null}
            <div>
              <ItemTitle item={item} />
              <Snippet item={item} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function RatingView({ items }: ViewProps) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => {
        const rating = Math.round(ratingOf(item) ?? 0);
        return (
          <li className="flex flex-wrap items-center gap-3" key={index}>
            <div className="rating rating-sm">
              {[1, 2, 3, 4, 5].map((star) => (
                <input
                  key={star}
                  type="radio"
                  name={`rating-${index}`}
                  className="mask mask-star-2 bg-orange-400"
                  aria-label={`${star} star`}
                  defaultChecked={star === rating && rating > 0}
                />
              ))}
            </div>
            <ItemTitle item={item} />
          </li>
        );
      })}
    </ul>
  );
}

function MeterView({ items, kind }: ViewProps & { kind: "progress" | "radial" | "range" }) {
  return (
    <ul className="flex flex-col gap-4">
      {items.map((item, index) => {
        const percent = percentOf(item);
        let meter: ReactNode = null;
        if (kind === "progress") {
          meter = <progress className="progress progress-primary w-56" value={percent} max={100} />;
        } else if (kind === "radial") {
          meter = (
            <div
              className="radial-progress text-sm"
              style={{ "--value": percent, "--size": "3.5rem" } as CSSProperties}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {percent}
            </div>
          );
        } else {
          meter = (
            <input
              type="range"
              min={0}
              max={100}
              value={percent}
              className="range range-primary w-56"
              aria-label={item.title}
              onChange={() => undefined}
            />
          );
        }
        return (
          <li className="flex flex-wrap items-center gap-3" key={index}>
            {meter}
            <ItemTitle item={item} />
          </li>
        );
      })}
    </ul>
  );
}

function InputView({ items, multiline }: ViewProps & { multiline?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <label className="flex flex-col gap-1" key={index}>
          <span className="font-medium">{item.title}</span>
          {multiline ? (
            <textarea className="textarea w-full" readOnly value={item.snippet || lead(item)} rows={3} />
          ) : (
            <input className="input w-full" readOnly value={item.snippet || lead(item)} />
          )}
        </label>
      ))}
    </div>
  );
}

function FieldsetView({ items }: ViewProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <fieldset className="fieldset rounded-box border border-base-300 bg-base-100 p-4" key={index}>
          <legend className="fieldset-legend">{item.title}</legend>
          <Snippet item={item} />
          <Facts item={item} />
        </fieldset>
      ))}
    </div>
  );
}

function LabelView({ items }: ViewProps) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, index) => (
        <li key={index}>
          <span className="label font-semibold">{item.title}</span>
          <Snippet item={item} />
        </li>
      ))}
    </ul>
  );
}

function FileInputView({ items }: ViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <input className="file-input w-full" type="file" disabled aria-label="File input" />
      <ItemList items={items} />
    </div>
  );
}

const VIEWS: Record<string, (props: ViewProps) => ReactNode> = {
  accordion: (props) => <CollapseView {...props} single />,
  alert: AlertView,
  aura: AuraView,
  avatar: AvatarView,
  badge: BadgeView,
  breadcrumbs: BreadcrumbsView,
  button: ButtonView,
  card: Cards,
  carousel: CarouselView,
  chat: ChatView,
  checkbox: (props) => <Controls {...props} control="checkbox" />,
  collapse: CollapseView,
  countdown: CountdownView,
  diff: DiffView,
  divider: DividerView,
  dock: DockView,
  drawer: DrawerView,
  dropdown: DropdownView,
  fieldset: FieldsetView,
  file_input: FileInputView,
  filter: FilterView,
  footer: FooterView,
  hero: HeroView,
  hover_3d: Hover3dView,
  hover_gallery: HoverGalleryView,
  indicator: IndicatorView,
  input: InputView,
  join: JoinView,
  kbd: KbdView,
  label: LabelView,
  link: LinkView,
  list: ItemList,
  loading: LoadingView,
  mask: MaskView,
  megamenu: MenuView,
  menu: MenuView,
  mockup_browser: (props) => <Mockup {...props} kind="browser" />,
  mockup_code: (props) => <Mockup {...props} kind="code" />,
  mockup_phone: (props) => <Mockup {...props} kind="phone" />,
  mockup_window: (props) => <Mockup {...props} kind="window" />,
  modal: ModalView,
  navbar: NavbarView,
  pagination: PaginationView,
  progress: (props) => <MeterView {...props} kind="progress" />,
  radial_progress: (props) => <MeterView {...props} kind="radial" />,
  radio: (props) => <Controls {...props} control="radio" />,
  range: (props) => <MeterView {...props} kind="range" />,
  rating: RatingView,
  select: SelectView,
  skeleton: SkeletonView,
  stack: StackView,
  stat: StatView,
  status: StatusView,
  steps: StepsView,
  swap: SwapView,
  tab: TabsView,
  table: TableView,
  text_rotate: TextRotateView,
  textarea: (props) => <InputView {...props} multiline />,
  timeline: TimelineView,
  toast: ToastView,
  toggle: (props) => <Controls {...props} control="toggle" />,
  tooltip: TooltipView,
};

export function ResultView({ component, items }: { component: string; items: Item[] }) {
  if (!items.length) {
    return (
      <div role="status" className="alert alert-soft">
        <span>SerpApi returned no results.</span>
      </div>
    );
  }
  const View = VIEWS[component] ?? ItemList;
  return <View items={items} />;
}
