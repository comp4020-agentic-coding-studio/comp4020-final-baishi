// The live scroll in the browser: draws marks the server streams in, grows
// the paper, and moves the blank strip to the new end. Marks are keyed by
// row id, so one that arrives twice (the stream and the POST response both
// deliver your own) is only drawn once. Ids can arrive out of order — your
// own POST response can beat someone else's earlier mark on the stream — so
// the page remembers each id it drew, not just the highest.

import { HEIGHT, SEGMENT, SOFT_SPREAD, totalWidth, zoneStart } from "./layout";

export interface StrokeData {
  id: number;
  d: string;
  width: number;
}

const SVG_NS = "http://www.w3.org/2000/svg";

export interface LiveScroll {
  add(stroke: StrokeData): void;
  // While a mark is being drawn the strip stays under the brush; it catches
  // up with the end of the scroll once the hold is released.
  holdZone(held: boolean): void;
  lastId(): number;
  setNote(note: string): void;
}

export function createLiveScroll(root: Document): LiveScroll | null {
  const svg = root.querySelector<SVGSVGElement>("#scroll");
  const wrap = root.querySelector<HTMLElement>("#canvas-wrap");
  const paper = root.querySelector<SVGRectElement>("#paper");
  const outline = root.querySelector<SVGRectElement>("#zone-outline");
  const prompt = root.querySelector<SVGTextElement>("#zone-prompt");
  const zoneHit = root.querySelector<SVGRectElement>("#zone-hit");
  const status = root.querySelector<HTMLElement>("#status");
  if (!svg || !wrap || !paper || !outline || !prompt || !zoneHit || !status) return null;

  let count = Number(svg.dataset.count ?? 0);
  // Everything up to the server-rendered last id is already on the page.
  const rendered = Number(svg.dataset.lastId ?? 0);
  const drawn = new Set<number>();
  let since = status.dataset.since ?? "";
  let held = false;
  let note = "";

  const renderStatus = (): void => {
    const marks = `${count} mark${count === 1 ? "" : "s"} so far, since ${since}.`;
    status.textContent = note ? `${note} ${marks}` : marks;
  };

  const moveZone = (): void => {
    const x = zoneStart(count);
    outline.setAttribute("x", String(x + 4));
    prompt.setAttribute("x", String(x + SEGMENT / 2));
    zoneHit.setAttribute("x", String(x));
  };

  const add = (stroke: StrokeData): void => {
    if (stroke.id <= rendered || drawn.has(stroke.id)) return;
    drawn.add(stroke.id);
    count += 1;
    if (!since) {
      since = new Date().toLocaleDateString("en-AU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    // Follow the end of the scroll only if the visitor was already there,
    // not if they'd scrolled back to look at older marks, and never under a
    // brush that's mid-stroke: the canvas would slide away from the pointer.
    const follow = !held && wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 8;

    const width = totalWidth(count);
    svg.setAttribute("width", String(width));
    svg.setAttribute("viewBox", `0 0 ${width} ${HEIGHT}`);
    paper.setAttribute("width", String(width));
    svg.setAttribute(
      "aria-label",
      `A shared ink scroll of ${count} mark${count === 1 ? "" : "s"} left so far, with a blank space at the end for yours`,
    );

    for (const [cls, w] of [
      ["ink-soft", stroke.width * SOFT_SPREAD],
      ["ink", stroke.width],
    ] as const) {
      const path = root.createElementNS(SVG_NS, "path");
      path.setAttribute("d", stroke.d);
      path.setAttribute("class", cls);
      path.setAttribute("stroke-width", String(w));
      svg.insertBefore(path, outline);
    }

    if (!held) moveZone();
    renderStatus();
    if (follow) wrap.scrollLeft = wrap.scrollWidth;
  };

  return {
    add,
    holdZone(h) {
      held = h;
      if (held) return;
      // The visitor was drawing at the end, so take them to the new end.
      moveZone();
      wrap.scrollLeft = wrap.scrollWidth;
    },
    lastId: () => rendered,
    setNote(n) {
      note = n;
      renderStatus();
    },
  };
}

// Subscribes to every mark saved after the last one this page drew. The
// browser reconnects by itself and resends the last event id, and the
// server replays from there, so a dropped connection misses nothing.
export function followStream(scroll: LiveScroll): EventSource {
  const source = new EventSource(`/api/stream?after=${scroll.lastId()}`);
  source.addEventListener("message", (event) => {
    scroll.add(JSON.parse((event as MessageEvent<string>).data) as StrokeData);
  });
  return source;
}
