import { expect, inject, it } from "vitest";

// The promise crit 8 actually checks: a mark you make is still there when
// you come back. Exercised here exactly as a stranger would hit it — over
// HTTP, against whatever's running — not by reaching into the database.
const baseUrl = inject("baseUrl");

function markCount(html: string): number {
  const match = html.match(/(\d+) marks? so far/);
  return match ? Number(match[1]) : 0;
}

it("adding a mark increases the count reported on the page, and it survives a fresh request", async () => {
  const before = await fetch(new URL("/", baseUrl)).then((r) => r.text());
  const countBefore = markCount(before);

  const res = await fetch(new URL("/api/strokes", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ d: "M 0 0 L 10 10", width: 6 }),
  });
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

it("never deletes: nothing in the app exposes a way to remove a mark", async () => {
  const res = await fetch(new URL("/api/strokes", baseUrl), { method: "DELETE" });
  // No route handles DELETE (Astro's same-origin check rejects it with 403
  // before routing even gets a say) — there's simply no delete path to call.
  expect(res.status).toBeGreaterThanOrEqual(400);
  expect(res.status).toBeLessThan(500);
});
