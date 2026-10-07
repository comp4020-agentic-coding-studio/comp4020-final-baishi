// The in-process bus behind /api/stream. One machine runs the app (see
// fly.toml), so every open stream lives in this process. Nothing is kept
// here: a stream that reconnects replays from SQLite instead.
import type { Stroke } from "./db";

type Listener = (stroke: Stroke) => void;

const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publish(stroke: Stroke): void {
  for (const listener of listeners) listener(stroke);
}
