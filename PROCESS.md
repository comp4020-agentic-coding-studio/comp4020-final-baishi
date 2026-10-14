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

Crit 8 asked for proof of life, crit 9 for real-time and one recorded
decision about several people at once, and crit 10 for telling people
apart, with the rules checked on the server and the logs saying who did
what.

## The stack, and what it costs

**Astro in server mode, the Node adapter, `better-sqlite3` with no ORM**
([`b3e5356`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/b3e5356)). The app is two rendered pages, one write endpoint and
now one stream. Server output means `/` reads the database on every
request, so the scroll renders with JavaScript off, and standalone mode is
a single `node` process that fits a 256MB Fly machine. Drizzle was the
obvious alternative, but one table needs no migration tool.

For real-time I chose **server-sent events** over WebSockets. Updates only
flow one way (marks out to every page); the one write is already a plain
POST. SSE is an ordinary HTTP response and needs no library on either side. The bus is an in-process listener
set (`src/lib/live.ts`), which is honest only because `fly.toml` pins one
machine. A second machine would need a real broker, and `CLAUDE.md` says
that's a decision to raise, not drift into.

## Crit 9: the decision, before the code

Crit 8 left a stopgap: two visitors who loaded the page together saw the
same blank strip, and whoever saved second got a 409 and lost their mark
([`070af85`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/070af85)). With the scroll live, that's a pod
of five in its first ten seconds. I wrote the decision first
([`0a7ab5d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/0a7ab5d)), as
`decisions/0001-two-marks-at-once.md`: **a mark's place is decided when
it's saved, not when it's started.** Refusing the second mark throws away
ink; claiming the strip while drawing needs state that expires; letting
marks overlap breaks "never painted over". The cost is that your mark can
land one strip along. Each stream event's id is the mark's row id, so a
reconnect replays from SQLite: the database is the backlog. The build
placed marks by arrival ([`8186a62`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/8186a62)) and drew
incoming marks without a reload ([`84a26f4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/84a26f4)).

## Crit 10: who is a person

Until this crit the app couldn't tell two visitors apart, and I'd argued
that was a virtue: an anonymous token is cleared by a private window, so
enforcing "one mark per person" is theatre. Re-reading that argument
against the crit's bar showed it was about *enforcement*. Telling people
apart for the record is a different job, and a browser token is honest
enough for it, since the crit's incognito windows are exactly the case it
treats as two people.

Again the decision came first ([`7b8c401`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/7b8c401)), as
`decisions/0002-a-person-is-a-browser.md`. A person is a browser: an
`HttpOnly` cookie holding a random token, of which the server keeps only a
hash. What each may see: every mark, plus which ones are their own, shown
as a small red seal, the painter's signature on a scroll, that nobody else
sees. What each may change: nothing, their own marks included. I rejected
typed pseudonyms (a form between the visitor and the brush) and names
under every mark (it turns the record of what happened into a list of
contributors).

The build ([`56c1c32`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/56c1c32)) puts the check where the
data is. Middleware attaches a visitor to every request; the write path
takes the owner from the cookie and ignores the body; `toPublic` turns the
stored hash into `mine` for whoever is asking, on the page, the POST
response and each stream. One logfmt line per view, stream open and close,
mark and refusal gives `flyctl logs` the narration the crit needs. The new
spec drives two cookie jars and checks each sees its own seal and not the
other's, and that a forged cookie becomes a new visitor rather than anyone
in particular. `CLAUDE.md` gained the rules: no identity from the body,
no hash in a response, and a log line for every new kind of action.

## How I directed the work

I designed the interaction (a brush whose width follows pointer speed, a
scroll that grows one strip per mark, the enforced/judged split) and the
validation rules. `CLAUDE.md` turns `README.md`'s argument into rules, and
a rule that doesn't trace back to `README.md` doesn't belong in either.

## How I grounded and corrected it

A green `pnpm check` was never proof. Every change ran against CI's
container and in a real browser with real pointer and keyboard input. For
crit 10 that meant two isolated browser sessions: a mark drawn with Enter
in one appeared live in the other, sealed only in the first, and the log
named the right visitor. I also started the build against a database in
the pre-crit-10 shape, as the live volume is, to check the migration keeps
every old mark.

Corrections, each a claim checked against behaviour, the fix landing in
the data layer or `spec/` where it could:

- a tap saved but rendered nothing, since `M x y` alone has no paintable
  geometry ([`0a10659`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/0a10659))
- "never erased" had silently excluded overpainting: pointer capture let a
  long drag sweep across earlier marks, so the server now bounds every
  point, halo included ([`3a57fdf`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/3a57fdf))
- axe reported no violations while two elements sat under 3:1, found by
  computing the ratios by hand ([`874ccac`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/874ccac))
- the deployed stream took 20 seconds to open, and the "within a second"
  spec had passed by luck because test files raced on one database
  ([`a058c5a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/a058c5a), [`8c8f29e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/8c8f29e))
- the ADR's "a dropped connection misses nothing" held on the server but
  not the page, which skipped any id below the highest it had drawn
  ([`a1cc5f2`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/a1cc5f2))
- one 502 while a deploy swaps the machine closed the page's stream for
  good; it now reopens with backoff ([`632f838`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/632f838))

## What's still open

Presence is deliberately absent: arriving marks are the presence. The
in-process bus holds only while Fly runs one machine. The logs go to
stdout and Fly keeps them only briefly; if the app needs a longer memory
than that, the database already is one.
