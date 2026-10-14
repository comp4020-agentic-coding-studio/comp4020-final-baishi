// Shared between the server (rendering the scroll so far) and the client
// (finding the blank strip where the next mark goes) so the two can never
// disagree about where the drawing zone sits.
export const HEIGHT = 480;
export const BASE_WIDTH = 1200;
export const SEGMENT = 280;

// The canvas is always one blank segment wider than it needs to be: that
// spare segment is where the current visitor draws.
export function totalWidth(strokeCount: number): number {
  return BASE_WIDTH + (strokeCount + 1) * SEGMENT;
}

export function zoneStart(strokeCount: number): number {
  return BASE_WIDTH + strokeCount * SEGMENT;
}

// Every mark is drawn twice: a soft halo this many times wider than its core
// stroke, then the stroke itself (see index.astro).
export const SOFT_SPREAD = 1.8;

// The box a mark's path coordinates must stay inside, in coordinates local
// to its own strip, so its ink, halo included, never reaches past the strip
// into anyone else's mark. The server adds zoneStart() when it places it.
export function localBounds(width: number): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const reach = (width * SOFT_SPREAD) / 2;
  return { minX: reach, maxX: SEGMENT - reach, minY: reach, maxY: HEIGHT - reach };
}

// The strip a saved mark sits in, read off its path's first x: marks are
// stored already placed, so where it starts says which strip it's in.
export function stripX(d: string): number {
  const x = Number(d.trim().split(/\s+/)[1]);
  return BASE_WIDTH + Math.floor((x - BASE_WIDTH) / SEGMENT) * SEGMENT;
}

// Your own marks carry a small seal in their strip's lower-right corner,
// the way a painter signs a scroll (decisions/0002-a-person-is-a-browser.md).
export const SEAL_SIZE = 14;
export function sealAt(d: string): { x: number; y: number } {
  return { x: stripX(d) + SEGMENT - SEAL_SIZE - 10, y: HEIGHT - SEAL_SIZE - 10 };
}
