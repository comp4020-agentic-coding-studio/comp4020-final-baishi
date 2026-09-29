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
