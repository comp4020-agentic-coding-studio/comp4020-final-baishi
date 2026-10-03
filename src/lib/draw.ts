// Captures one brush mark from real pointer input (mouse, pen or touch) and
// hands it to the server as a single SVG path plus a width. No undo, no
// redo: see CLAUDE.md on why a mark, once lifted, is final.

import { SOFT_SPREAD } from "./layout";

interface Point {
  x: number;
  y: number;
  t: number;
}

const MIN_MOVE = 2; // px between recorded points, so a slow drag isn't thousands of points
const BASE_WIDTH = 14;
const MIN_WIDTH = 3;

function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number): Point {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  const local = ctm ? pt.matrixTransform(ctm.inverse()) : pt;
  return { x: local.x, y: local.y, t: performance.now() };
}

// Pointer capture keeps a drag reporting after it leaves the zone, so every
// point is pinned back inside it — inset by the widest ink this client can
// lay down — rather than letting the mark run over earlier ones. The server
// holds the same line (src/pages/api/strokes.ts).
function clampToZone(zoneHit: SVGRectElement, p: Point): Point {
  const reach = (BASE_WIDTH * SOFT_SPREAD) / 2;
  const x = parseFloat(zoneHit.getAttribute("x") ?? "0");
  const y = parseFloat(zoneHit.getAttribute("y") ?? "0");
  const width = parseFloat(zoneHit.getAttribute("width") ?? "0");
  const height = parseFloat(zoneHit.getAttribute("height") ?? "0");
  return {
    x: Math.min(Math.max(p.x, x + reach), x + width - reach),
    y: Math.min(Math.max(p.y, y + reach), y + height - reach),
    t: p.t,
  };
}

// Turns the recorded polyline into a smooth curve: a quadratic segment per
// point, aimed at the midpoint to the next one, is the standard trick for
// smoothing freehand input without needing a spline library.
function smoothPath(points: Point[]): string {
  if (points.length === 0) return "";
  // A bare "M" has no paintable geometry — a zero-length "L" to the same
  // point is what actually gets a round-linecap dot on screen.
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y} ${mx} ${my}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

// A brush dragged quickly lays down a thinner line than one held still —
// the one bit of real ink physics this borrows.
function strokeWidth(points: Point[]): number {
  if (points.length < 2) return BASE_WIDTH; // a tap is a dot, at full width
  let dist = 0;
  let time = 0;
  for (let i = 1; i < points.length; i++) {
    dist += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    time += Math.max(1, points[i].t - points[i - 1].t);
  }
  const speed = dist / time; // px/ms
  const width = BASE_WIDTH / (1 + speed * 6);
  return Math.max(MIN_WIDTH, Math.min(BASE_WIDTH, width));
}

// A keyboard has no drag to read a position or speed from, so its mark is a
// single dot at the zone's own centre — the same shape a stationary tap
// already produces, not a new kind of mark.
function zoneCenter(zoneHit: SVGRectElement): Point {
  const x = parseFloat(zoneHit.getAttribute("x") ?? "0");
  const y = parseFloat(zoneHit.getAttribute("y") ?? "0");
  const width = parseFloat(zoneHit.getAttribute("width") ?? "0");
  const height = parseFloat(zoneHit.getAttribute("height") ?? "0");
  return { x: x + width / 2, y: y + height / 2, t: performance.now() };
}

export function initDrawing(root: ParentNode): void {
  const svg = root.querySelector<SVGSVGElement>("#scroll");
  const zoneHit = root.querySelector<SVGRectElement>("#zone-hit");
  const preview = root.querySelector<SVGPathElement>("#preview");
  const prompt = root.querySelector<SVGTextElement>("#zone-prompt");
  const status = root.querySelector<HTMLElement>("#status");
  if (!svg || !zoneHit || !preview || !status) return;

  let points: Point[] = [];
  // Which pointer owns the current drag, not just whether one is happening —
  // a stray second contact (a palm, a bracing finger) during a one-finger
  // drag must never move the stroke or end it early.
  let drawingPointerId: number | null = null;
  let done = false;

  const submitMark = async (): Promise<void> => {
    const d = smoothPath(points);
    const width = strokeWidth(points);
    status.textContent = "saving your mark…";

    try {
      const res = await fetch("/api/strokes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ d, width }),
      });
      if (res.status === 409) {
        // This strip went stale: another visitor saved into it first, so
        // every retry here would be refused too. Leave the zone closed.
        status.textContent =
          "someone else drew in this strip first. Reload for the next blank one.";
        return;
      }
      if (!res.ok) throw new Error(`server said ${res.status}`);
      location.reload();
    } catch (err) {
      status.textContent = `couldn't save your mark (${(err as Error).message}). Reload to try again.`;
      done = false;
    }
  };

  zoneHit.addEventListener("pointerdown", (event) => {
    if (done) return;
    done = true; // one mark per visit to this page; see CLAUDE.md
    drawingPointerId = event.pointerId;
    zoneHit.setPointerCapture(event.pointerId);
    prompt?.setAttribute("opacity", "0");
    points = [clampToZone(zoneHit, svgPoint(svg, event.clientX, event.clientY))];
    event.preventDefault();
  });

  zoneHit.addEventListener("pointermove", (event) => {
    if (event.pointerId !== drawingPointerId) return;
    const p = clampToZone(zoneHit, svgPoint(svg, event.clientX, event.clientY));
    const last = points[points.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < MIN_MOVE) return;
    points.push(p);
    preview.setAttribute("d", smoothPath(points));
    preview.setAttribute("stroke-width", String(strokeWidth(points)));
  });

  const finish = async (event: PointerEvent): Promise<void> => {
    if (event.pointerId !== drawingPointerId) return;
    drawingPointerId = null;
    zoneHit.releasePointerCapture(event.pointerId);
    await submitMark();
  };

  zoneHit.addEventListener("pointerup", finish);
  zoneHit.addEventListener("pointercancel", finish);

  zoneHit.addEventListener("keydown", (event) => {
    if (done || drawingPointerId !== null) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault(); // Space must not scroll the page instead
    done = true;
    prompt?.setAttribute("opacity", "0");
    points = [zoneCenter(zoneHit)];
    preview.setAttribute("d", smoothPath(points));
    preview.setAttribute("stroke-width", String(strokeWidth(points)));
    void submitMark();
  });
}
