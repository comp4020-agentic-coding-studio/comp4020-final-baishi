// The one path shape draw.ts emits: a moveto, then any run of L and Q
// segments. Parsed strictly, so the server can bound it and move it.

export interface Segment {
  command: "M" | "L" | "Q";
  points: { x: number; y: number }[];
}

const ARITY: Record<string, number> = { M: 2, L: 2, Q: 4 };

export function parsePath(d: string): Segment[] | null {
  const tokens = d.trim().split(/\s+/);
  const segments: Segment[] = [];
  for (let i = 0; i < tokens.length; ) {
    const command = tokens[i];
    const n = ARITY[command];
    if (n === undefined || (command === "M") !== (i === 0)) return null;
    const args = tokens.slice(i + 1, i + 1 + n).map(Number);
    if (args.length !== n || !args.every(Number.isFinite)) return null;
    const points = [];
    for (let j = 0; j < n; j += 2) points.push({ x: args[j], y: args[j + 1] });
    segments.push({ command: command as Segment["command"], points });
    i += 1 + n;
  }
  return segments;
}

// Every point a path names, control points included. A quadratic curve
// never leaves the hull of its control points, so bounding these bounds the
// ink.
export function pathPoints(segments: Segment[]): { x: number; y: number }[] {
  return segments.flatMap((s) => s.points);
}

export function shiftPath(segments: Segment[], dx: number): string {
  return segments
    .map((s) => [s.command, ...s.points.flatMap((p) => [p.x + dx, p.y])].join(" "))
    .join(" ");
}
