import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { APIContext } from "astro";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { HEIGHT, SEGMENT } from "../src/lib/layout";
import { visitorFrom } from "../src/lib/visitor";

// CLAUDE.md: logs say who did what by visitor label, and never carry the
// token, an IP address, or a path's contents. The running app's stdout
// isn't reachable over HTTP, so this drives the middleware and the write
// route in-process, against a throwaway database, and reads every line
// they log.
const token = "0123456789abcdef0123456789abcdef";
const visitor = visitorFrom(token, false);
const ip = "203.0.113.77";
const lines: string[] = [];
const spy = vi.spyOn(console, "log");

beforeAll(() => {
  process.env.DB_PATH = join(mkdtempSync(join(tmpdir(), "scroll-logs-")), "scroll.db");
  spy.mockImplementation((...args: unknown[]) => void lines.push(args.join(" ")));
});
afterAll(() => spy.mockRestore());

function request(path: string, init: RequestInit = {}): Request {
  return new Request(new URL(path, "http://localhost"), {
    ...init,
    headers: {
      cookie: `scroll_visitor=${token}`,
      "x-forwarded-for": ip,
      "fly-client-ip": ip,
      ...init.headers,
    },
  });
}

it("logs a view, a mark and a refusal by visitor label, with no token, IP or path contents", async () => {
  const { onRequest } = await import("../src/middleware");
  const { POST } = await import("../src/pages/api/strokes");

  const view = request("/");
  const locals = {} as App.Locals;
  await onRequest(
    {
      request: view,
      url: new URL(view.url),
      locals,
      cookies: { get: () => ({ value: token }), set: () => {} },
    } as unknown as APIContext,
    async () => new Response("ok"),
  );
  expect(locals.visitor.label).toBe(visitor.label);

  const x = SEGMENT / 2;
  const y = HEIGHT / 2;
  const marks = [
    { d: `M ${x} ${y} L ${x + 7.25} ${y + 3.5}`, width: 4 },
    { d: `M ${x} ${y} L ${x + 9999.125} ${y}`, width: 4 },
  ];
  const statuses = [];
  for (const mark of marks) {
    const post = request("/api/strokes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(mark),
    });
    const res = await POST({ request: post, locals } as unknown as APIContext);
    statuses.push(res.status);
  }
  expect(statuses).toEqual([201, 400]);

  const events = lines.filter((l) => l.startsWith("event="));
  expect(events.map((l) => l.split(" ")[0])).toEqual(["event=view", "event=mark", "event=refused"]);
  for (const line of events) {
    expect(line).toContain(`visitor=${visitor.label}`);
    expect(line).not.toContain(token);
    expect(line).not.toContain(visitor.hash);
    expect(line).not.toContain(ip);
    for (const mark of marks) expect(line).not.toContain(mark.d);
    expect(line).not.toMatch(/7\.25|9999\.125/);
  }
});
