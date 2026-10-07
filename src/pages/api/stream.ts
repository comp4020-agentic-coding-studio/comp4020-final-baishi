import type { APIRoute } from "astro";
import { getStrokesAfter, type Stroke } from "../../lib/db";
import { subscribe } from "../../lib/live";

// Fly's proxy closes a connection that's been silent for a minute; a comment
// line well inside that keeps an idle page's stream open.
const HEARTBEAT_MS = 20_000;

// Every mark saved after the one the page last saw, then every mark saved
// from now on, as server-sent events. The page names its last mark in
// ?after=; on a reconnect the browser sends Last-Event-ID instead, so a
// dropped connection replays what it missed from SQLite.
export const GET: APIRoute = ({ request, url }) => {
  const after = Number(request.headers.get("last-event-id") ?? url.searchParams.get("after") ?? 0);
  const encoder = new TextEncoder();
  let closed = false;
  let cleanup = (): void => {};

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (stroke: Stroke): void => {
        if (closed) return;
        controller.enqueue(encoder.encode(`id: ${stroke.id}\ndata: ${JSON.stringify(stroke)}\n\n`));
      };
      // Replay and subscribe in the same synchronous block: a write can't
      // land between them, so nothing falls in a gap.
      for (const stroke of getStrokesAfter(Number.isFinite(after) ? after : 0)) send(stroke);
      const unsubscribe = subscribe(send);
      const heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": ping\n\n"));
      }, HEARTBEAT_MS);
      cleanup = () => {
        closed = true;
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
