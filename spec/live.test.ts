import { expect, inject, it } from "vitest";
import { HEIGHT, SEGMENT } from "../src/lib/layout";

// Crit 9's bar: a mark saved by one visitor shows up on every other open
// page within about a second, with no reload. Checked over the same stream
// the page listens to.
const baseUrl = inject("baseUrl");

interface Event {
  id: number;
  stroke: { id: number; d: string };
}

// Reads server-sent events off a stream until one satisfies `want`, or
// fails after `ms`.
async function waitForEvent(
  headers: Record<string, string>,
  query: string,
  want: (e: Event) => boolean,
  ms: number,
  onOpen: () => Promise<void> = async () => {},
): Promise<Event> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), ms);
  try {
    const res = await fetch(new URL(`/api/stream${query}`, baseUrl), {
      headers,
      signal: abort.signal,
    });
    expect(res.headers.get("content-type")).toMatch(/text\/event-stream/);
    const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
    await onOpen();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) throw new Error("stream ended");
      buffer += value;
      let end: number;
      while ((end = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const id = block.match(/^id: (\d+)$/m);
        const data = block.match(/^data: (.*)$/m);
        if (!id || !data) continue;
        const event = { id: Number(id[1]), stroke: JSON.parse(data[1]) };
        if (want(event)) return event;
      }
    }
  } finally {
    clearTimeout(timer);
    abort.abort();
  }
}

function post(): Promise<{ id: number }> {
  const x = SEGMENT / 2;
  const y = HEIGHT / 2;
  return fetch(new URL("/api/strokes", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ d: `M ${x} ${y} L ${x + 5} ${y + 5}`, width: 6 }),
  }).then((r) => r.json());
}

it("a mark saved elsewhere reaches an open stream within a second", async () => {
  let saved: { id: number } | undefined;
  const started = Date.now();
  const event = await waitForEvent(
    {},
    "?after=999999999",
    (e) => e.id === saved?.id,
    5000,
    async () => {
      saved = await post();
    },
  );
  expect(event.stroke.id).toBe(saved!.id);
  expect(Date.now() - started).toBeLessThan(1000);
});

it("a reconnecting stream replays the marks it missed, from Last-Event-ID", async () => {
  // Two marks land while this page is "offline".
  const missed = await post();
  const next = await post();
  const first = await waitForEvent({ "last-event-id": String(missed.id - 1) }, "", () => true, 3000);
  expect(first.id).toBe(missed.id);
  const second = await waitForEvent({ "last-event-id": String(missed.id) }, "", () => true, 3000);
  expect(second.id).toBe(next.id);
});

it("an idle stream sends its first bytes at once, not at the first heartbeat", async () => {
  // A proxy in front (Fly's) holds the headers until the body's first byte,
  // so a silent stream looks unconnected to the page for 20 seconds.
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 1000);
  try {
    const res = await fetch(new URL("/api/stream?after=999999999", baseUrl), { signal: abort.signal });
    const { value } = await res.body!.getReader().read();
    expect(value?.length).toBeGreaterThan(0);
  } finally {
    clearTimeout(timer);
    abort.abort();
  }
});
