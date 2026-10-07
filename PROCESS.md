# Process overview

## From the brief to a decision

The final project brief fixes three requirements (multi-user, real-time,
persists) and leaves what "good" means to me. I picked one small idea and
built all of it rather than plan a large app and ship a fraction: **The
Scroll**, a shared ink canvas that only ever grows, one mark per visit,
none of them ever erased. The brief's reading list pointed away from its
"median answer", a chat room with the nouns swapped. A drawing surface with
a hard rule against editing is small, testable, and takes a position.
`README.md` argues that position and cites what I read.

Crit 8 asked for proof of life: deployed, doing its core thing, a trace
that survives a return visit. Crit 9 asks for real-time and one recorded
decision about several people at once.

## The stack, and what it costs

**Astro in server mode, the Node adapter, `better-sqlite3` with no ORM**
([`b3e5356`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/b3e5356)). The app is two rendered pages, one write endpoint and
now one stream. Server output means `/` reads the database on every
request, so the scroll renders with JavaScript off, and standalone mode is
a single `node` process that fits a 256MB Fly machine. Drizzle was the
obvious alternative; with one table, a `CREATE TABLE IF NOT EXISTS` says
everything a migration tool would, and crit 9's decision needed no second
table.

For real-time I chose **server-sent events** over WebSockets. Updates only
flow one way (marks out to every page); the one write is already a plain
POST. SSE is an ordinary HTTP response, needs no library on either side,
and the browser reconnects on its own. The bus is an in-process listener
set (`src/lib/live.ts`), which is honest only because `fly.toml` pins one
machine. A second machine would need a real broker, and `CLAUDE.md` says
that's a decision to raise, not drift into.

## Crit 9: the decision, before the code

Crit 8 had left a stopgap. Two visitors who loaded the page together saw
the same blank strip, and whoever saved second got a 409 and lost their
mark ([`070af85`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/070af85)). Once the scroll is live this stops being a rare
race and becomes the normal case: a pod of five drawing in the first ten
seconds.

I wrote the decision first ([`0a7ab5d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/0a7ab5d)), as
`decisions/0001-two-marks-at-once.md`, with the alternatives and their
costs, and changed `README.md` and `CLAUDE.md` to match. **A mark's place
is decided when it's saved, not when it's started.** Refusing the second
mark throws away ink someone actually made, which a record of what
happened shouldn't do. Claiming the strip while drawing would show
presence, but it needs a second kind of state that expires when someone
wanders off mid-stroke. Letting marks overlap breaks "never painted over".
The cost I accepted is that your mark can land one strip to the right of
where you drew it.

The same record settles reconnection and identity without new machinery.
Each event's id is the mark's row id, so a browser that reconnects sends
`Last-Event-ID` and the server replays from SQLite: the database is the
backlog. Identity stays judged rather than enforced, because an anonymous
token is cleared by a private window and enforcing it would be theatre.

The build followed in two commits. The API now takes strip-local
coordinates and places each mark in whichever strip is blank when it
writes, with the count and the insert in one synchronous block; `/api/stream`
sends each mark as it lands ([`8186a62`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/8186a62)). New specs post two marks at
the same strip concurrently and check both land, one strip apart, and
check that a mark reaches an open stream within a second and that a
reconnect replays what it missed. The client draws incoming marks, grows
the paper and moves the blank strip without a reload ([`84a26f4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/84a26f4)).

## How I directed the work

I designed the interaction (a variable-width brush from real pointer
speed, a scroll that grows one strip per mark, the enforced/judged split)
and the API's validation rules. `CLAUDE.md` turns `README.md`'s argument
into rules: never update or delete a mark, never refuse one for arriving
second, never require an account, validate in the data layer rather than
trusting `draw.ts`, one table on one volume, and a new record in
`decisions/` before any change to multi-user behaviour. A rule that
doesn't trace back to `README.md` doesn't belong in either file.

## How I grounded and corrected it

A green `pnpm check` was never proof. Every change ran against CI's container (`docker build`, then
`docker run --tmpfs /data`), and in a real browser with real pointer and
keyboard input.

That caught this crit's bug. With two tabs open I started a drag, had
another mark land mid-stroke, then finished it. The rest of my stroke
pinned itself to the strip's right edge: the page's auto-follow had
scrolled the canvas to the new end under my pointer. The fix holds
both the strip and the scroll position still while a mark is in progress
and catches up on release, and the same repro now places it as drawn.

Other corrections, each a claim checked against behaviour:

- a single tap saved but rendered nothing, because `M x y` alone has no
  paintable geometry; the fix went into the data layer with a spec case
  ([`0a10659`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/0a10659))
- "never erased" had silently excluded overpainting: pointer capture let
  an over-long drag sweep across earlier marks, so the server now bounds
  every point, halo included ([`3a57fdf`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/3a57fdf))
- keyboard drawing looked fixed but the parent `<svg role="img">` hid the
  zone from assistive tech ([`fbb528d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/fbb528d))
- axe reported no violations while two elements sat under 3:1, which I
  found by computing the ratios by hand ([`874ccac`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/874ccac), [`7e2939a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/7e2939a))
- a second touch's release threw inside an async handler and dropped the
  real mark ([`75bc2b5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/75bc2b5)); jsdom has no `createSVGPoint` or pointer
  capture, so a two-pointer browser repro is the verification, not a spec.
- the deployed stream, across a forced machine stop, kept
  reconnecting, but each connection took 20 seconds to open: nothing
  flushed the headers before the first heartbeat. The "within a second"
  spec had been passing by luck because test files raced on one database
  ([`a058c5a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/a058c5a), [`8c8f29e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/8c8f29e))
- the ADR's "a dropped connection misses nothing" held on the server but
  not the page, which skipped any id below the highest it had drawn. Your
  own POST response can beat someone's earlier mark on the stream, and
  that mark vanished. It now remembers each id ([`a1cc5f2`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/a1cc5f2))

## What's still open

Presence is deliberately absent: the marks arriving
are the presence. The in-process bus holds only while Fly runs one
machine.
