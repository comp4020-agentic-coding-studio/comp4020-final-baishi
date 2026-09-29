import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

// /data is the one thing Fly's volume gives us (see fly.toml); everywhere
// else (local dev, CI's throwaway container) falls back to a working-tree
// path that's gitignored.
const DB_PATH = process.env.DB_PATH ?? "./.data/scroll.db";
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// The smallest schema that can carry the core interaction: one mark is one
// row. Nothing here ever updates or deletes a row — see CLAUDE.md.
db.exec(`
  CREATE TABLE IF NOT EXISTS strokes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    d TEXT NOT NULL,
    width REAL NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

export interface Stroke {
  id: number;
  d: string;
  width: number;
  createdAt: number;
}

const insertStmt = db.prepare("INSERT INTO strokes (d, width, created_at) VALUES (?, ?, ?)");
const selectAllStmt = db.prepare(
  "SELECT id, d, width, created_at AS createdAt FROM strokes ORDER BY id ASC",
);

// A generous cap, not a design constraint: it exists only so one request
// can't hand the server an unbounded string.
export const MAX_D_LENGTH = 20_000;
export const MIN_WIDTH = 1;
export const MAX_WIDTH = 40;

export function getAllStrokes(): Stroke[] {
  return selectAllStmt.all() as Stroke[];
}

export function addStroke(d: string, width: number): Stroke {
  const createdAt = Date.now();
  const info = insertStmt.run(d, width, createdAt);
  return { id: Number(info.lastInsertRowid), d, width, createdAt };
}
