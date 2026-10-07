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
