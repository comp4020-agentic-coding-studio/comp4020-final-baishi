import { expect, inject, it } from "vitest";
import { HEIGHT, SEGMENT } from "../src/lib/layout";

// Crit 10's bar: two people, each in their own browser, and the app tells
// them apart (decisions/0002-a-person-is-a-browser.md). Each "browser" here
// is just a cookie jar of one: whatever cookie the app set, sent back.
const baseUrl = inject("baseUrl");

interface Browser {
  cookie: string;
  get(path: string): Promise<Response>;
  post(body: unknown): Promise<Response>;
}

async function openBrowser(): Promise<Browser> {
  const first = await fetch(new URL("/", baseUrl));
  const setCookie = first.headers.get("set-cookie") ?? "";
  expect(setCookie).toMatch(/HttpOnly/i);
  const cookie = setCookie.split(";")[0];
  return {
    cookie,
    get: (path) => fetch(new URL(path, baseUrl), { headers: { cookie } }),
    post: (body) =>
      fetch(new URL("/api/strokes", baseUrl), {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify(body),
      }),
  };
}

const label = (html: string): string | undefined =>
  html.match(/visitor <code>([0-9a-f]{6})<\/code>/)?.[1];
const seals = (html: string): number => (html.match(/class="seal"/g) ?? []).length;

const { x, y } = { x: SEGMENT / 2, y: HEIGHT / 2 };
const mark = { d: `M ${x} ${y} L ${x + 10} ${y + 10}`, width: 6 };

it("tells two browsers apart, and knows each one again when it comes back", async () => {
  const [a, b] = await Promise.all([openBrowser(), openBrowser()]);
  const [a1, a2, b1] = await Promise.all(
    [a.get("/"), a.get("/"), b.get("/")].map((r) => r.then((res) => res.text())),
  );
  expect(label(a1)).toBeDefined();
  expect(label(a2)).toBe(label(a1));
  expect(label(b1)).not.toBe(label(a1));
});

it("a mark is yours only on your own page: nobody else's page or stream marks it as theirs", async () => {
  const [a, b] = await Promise.all([openBrowser(), openBrowser()]);
  const res = await a.post(mark);
  expect(res.status).toBe(201);
  const saved = await res.json();
  expect(saved.mine).toBe(true);

  const [aPage, bPage] = await Promise.all([a.get("/"), b.get("/")].map((r) => r.then((p) => p.text())));
  expect(seals(aPage)).toBe(1);
  expect(seals(bPage)).toBe(0);

  // B's stream replays A's mark, and says it isn't B's.
  const stream = await b.get(`/api/stream?after=${saved.id - 1}`);
  const reader = stream.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (!buffer.includes(`id: ${saved.id}\n`)) buffer += (await reader.read()).value ?? "";
  await reader.cancel();
  const event = buffer.slice(buffer.indexOf(`id: ${saved.id}\n`)).split("\n")[1];
  expect(JSON.parse(event.replace(/^data: /, ""))).toMatchObject({ id: saved.id, mine: false });
});

it("never hands a browser anyone's visitor hash, and ignores any visitor named in the body", async () => {
  const a = await openBrowser();
  const res = await a.post({ ...mark, visitor: "someone-else" });
  expect(res.status).toBe(201);
  const saved = await res.json();
  expect(Object.keys(saved).sort()).toEqual(["createdAt", "d", "id", "mine", "placedAt", "width"]);
  expect(saved.mine).toBe(true);
});

it("treats a forged or malformed cookie as a new visitor, not as anyone in particular", async () => {
  const res = await fetch(new URL("/", baseUrl), { headers: { cookie: "scroll_visitor=admin" } });
  expect(res.headers.get("set-cookie")).toMatch(/scroll_visitor=[0-9a-f]{32}/);
  expect(seals(await res.text())).toBe(0);
});
