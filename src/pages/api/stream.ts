import type { APIRoute } from "astro";
import { getStrokesAfter, toPublic, type Stroke } from "../../lib/db";
import { subscribe } from "../../lib/live";
import { log } from "../../lib/visitor";

// Fly's proxy closes a connection that's been silent for a minute; a comment
// line well inside that keeps an idle page's stream open.
const HEARTBEAT_MS = 20_000;

// Every mark saved after the one the page last saw, then every mark saved
// from now on, as server-sent events. The page names its last mark in
// ?after=; on a reconnect the browser sends Last-Event-ID instead, so a
// dropped connection replays what it missed from SQLite. Each stream says
// `mine` only of the marks its own visitor drew.
export const GET: APIRoute = ({ request, url, locals }) => {
  const { visitor } = locals;
  const after = Number(request.headers.get("last-event-id") ?? url.searchParams.get("after") ?? 0);
  const encoder = new TextEncoder();
  let closed = false;
  let cleanup = (): void => {};

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (stroke: Stroke): void => {
        if (closed) return;
        const data = JSON.stringify(toPublic(stroke, visitor.hash));
        controller.enqueue(encoder.encode(`id: ${stroke.id}\ndata: ${data}\n\n`));
      };
      // A first line straight away: Fly's proxy holds the response headers
      // until the body's first byte, so without it the page's EventSource
      // sits at "connecting" until the first heartbeat.
      controller.enqueue(encoder.encode(": open\n\n"));
      // Replay and subscribe in the same synchronous block: a write can't
      // land between them, so nothing falls in a gap.
      const from = Number.isFinite(after) ? after : 0;
      const missed = getStrokesAfter(from);
      for (const stroke of missed) send(stroke);
      log("stream-open", { visitor: visitor.label, after: from, replayed: missed.length });
      const unsubscribe = subscribe(send);
      const heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": ping\n\n"));
      }, HEARTBEAT_MS);
      const opened = Date.now();
      cleanup = () => {
        if (closed) return;
        closed = true;
        log("stream-close", { visitor: visitor.label, seconds: Math.round((Date.now() - opened) / 1000) });
        clearInterval(heartbeat);
        unsubscribe();
      };
      request.signal.addEventListener("abort", () => cleanup());
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(body, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
    },
  });
};
