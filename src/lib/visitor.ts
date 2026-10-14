// Who a request comes from (decisions/0002-a-person-is-a-browser.md). A
// person is a browser: a random token in an HttpOnly cookie. The server
// keeps and logs only the token's hash, and shows its first six hex digits
// as the visitor's label.
import { createHash, randomBytes } from "node:crypto";

export const COOKIE = "scroll_visitor";
const TOKEN = /^[0-9a-f]{32}$/;

export interface Visitor {
  hash: string;
  label: string;
  isNew: boolean;
}

export function newToken(): string {
  return randomBytes(16).toString("hex");
}

export function isToken(value: string | undefined): value is string {
  return value !== undefined && TOKEN.test(value);
}

export function visitorFrom(token: string, isNew: boolean): Visitor {
  const hash = createHash("sha256").update(token).digest("hex");
  return { hash, label: hash.slice(0, 6), isNew };
}

// One logfmt line per event on stdout, which `flyctl logs` tails. Values
// with spaces are quoted; nothing logged here identifies a person beyond
// their visitor label.
export function log(event: string, fields: Record<string, string | number | boolean>): void {
  const parts = [`event=${event}`];
  for (const [key, value] of Object.entries(fields)) {
    const text = String(value);
    parts.push(`${key}=${/[\s"=]/.test(text) ? JSON.stringify(text) : text}`);
  }
  console.log(parts.join(" "));
}
