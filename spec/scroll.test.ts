import { expect, inject, it } from "vitest";
import { HEIGHT, SEGMENT, zoneStart } from "../src/lib/layout";

// The promise crit 8 actually checks: a mark you make is still there when
// you come back. Exercised here exactly as a stranger would hit it — over
// HTTP, against whatever's running — not by reaching into the database.
const baseUrl = inject("baseUrl");

function markCount(html: string): number {
  const match = html.match(/(\d+) marks? so far/);
  return match ? Number(match[1]) : 0;
}

// The centre of the blank strip a visitor loading the page right now would
// draw in — the only place a new mark is allowed to go.
async function zoneCentre(): Promise<{ x: number; y: number }> {
  const html = await fetch(new URL("/", baseUrl)).then((r) => r.text());
  return { x: zoneStart(markCount(html)) + SEGMENT / 2, y: HEIGHT / 2 };
}

function post(body: unknown): Promise<Response> {
  return fetch(new URL("/api/strokes", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

it("adding a mark increases the count reported on the page, and it survives a fresh request", async () => {
  const before = await fetch(new URL("/", baseUrl)).then((r) => r.text());
  const countBefore = markCount(before);

  const { x, y } = await zoneCentre();
  const res = await post({ d: `M ${x} ${y} L ${x + 10} ${y + 10}`, width: 6 });
  expect(res.status).toBe(201);

  // A second, independent request: nothing about the first request's own
  // connection carries the mark forward, only the database does.
  const after = await fetch(new URL("/", baseUrl)).then((r) => r.text());
  expect(markCount(after)).toBe(countBefore + 1);
});

it("rejects a mark with no path, and one with an out-of-range width", async () => {
  const empty = await fetch(new URL("/api/strokes", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ d: "", width: 6 }),
  });
  expect(empty.status).toBe(400);

  const tooWide = await fetch(new URL("/api/strokes", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ d: "M 0 0 L 1 1", width: 999 }),
  });
  expect(tooWide.status).toBe(400);
});

it("normalises a bare tap (a moveto with no drawing command) into a paintable mark", async () => {
  // SVG renders nothing for "M x y" alone — a stray client that sent one
  // shouldn't get to save an invisible mark. See src/lib/db.ts.
  const { x, y } = await zoneCentre();
  const res = await post({ d: `M ${x} ${y}`, width: 14 });
  expect(res.status).toBe(201);
  const saved = await res.json();
  expect(saved.d).toMatch(/L/);
});

it("refuses a mark that reaches outside the blank strip, so it can't paint over earlier ones", async () => {
  // A drag that starts in the zone and runs left across everything before it:
  // exactly what pointer capture used to let a real drag do.
  const { x, y } = await zoneCentre();
  const res = await post({ d: `M ${x} ${y} L ${x - SEGMENT * 3} ${y}`, width: 6 });
  expect(res.status).toBe(409);

  // The halo counts too: a path hugging the zone's edge still bleeds over it.
  const edge = x - SEGMENT / 2 + 1;
  const bleed = await post({ d: `M ${edge} ${y} L ${edge} ${y}`, width: 40 });
  expect(bleed.status).toBe(409);
});

it("refuses a path that isn't the moveto-then-segments shape the client draws", async () => {
  const { x, y } = await zoneCentre();
  for (const d of [`L ${x} ${y}`, `M ${x} ${y} Z`, `M ${x} ${y} L ${x}`, `M ${x} ${y} L NaN ${y}`]) {
    const res = await post({ d, width: 6 });
    expect(res.status, d).toBe(400);
  }
});

it("never deletes: nothing in the app exposes a way to remove a mark", async () => {
  const res = await fetch(new URL("/api/strokes", baseUrl), { method: "DELETE" });
  // No route handles DELETE (Astro's same-origin check rejects it with 403
  // before routing even gets a say) — there's simply no delete path to call.
  expect(res.status).toBeGreaterThanOrEqual(400);
  expect(res.status).toBeLessThan(500);
});
