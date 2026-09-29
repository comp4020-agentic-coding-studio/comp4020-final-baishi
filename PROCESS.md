# Process overview

## From the brief to a decision

The final project brief fixes three requirements — multi-user, real-time,
persists — and leaves everything else, including what "good" means, to me.
Crit 8 only asks for the first slice: something deployed that does its core
thing for a stranger and keeps a trace of it. Rather than sketch a
feature-complete plan and build a fraction of it, I picked one small,
complete idea and built all of it: **The Scroll**, a shared ink canvas that
only ever grows, one mark per visit, none of them ever erased.

The brief's own reading list — the small web, games for a handful of
friends, tools built for one workshop — pointed away from the "median
answer" it warns against (a chat room with the nouns swapped). A drawing
surface with a hard rule against editing or deleting is small, testable,
and has an actual position on what's worth building, argued in `README.md`
and cited there rather than restated here.

## The stack, and what it costs

**Astro, server output, the Node adapter, `better-sqlite3` with no ORM.**
The app needed exactly two rendered pages and one write endpoint — Astro's
file-based routing gives me that with none of the routing/middleware
boilerplate a bare Express server would need, and its server-output mode
means every page (including `/readme/`) reads the database at request
time, which the two static-assignment stacks earlier in the course never
needed to do. The Node adapter's standalone mode is a single `node
entry.mjs` process, which is what a `shared-cpu-1x`/256MB Fly machine can
actually run.

I chose `better-sqlite3` directly over an ORM (drizzle, the obvious
alternative) because the schema is one table
([`src/lib/db.ts`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/b3e5356)):
a `CREATE TABLE IF NOT EXISTS` and two prepared statements say everything a
migration tool would, without drizzle-kit's own generate/push step or its
dependency weight. The trade-off is real — the moment this schema needs a
second table with a foreign key, or a future crit's real-time layer needs
transactional guarantees an ORM would make easier to get right, that
absence will cost something. I'm taking that cost deliberately now, on the
theory that a smaller stack is easier to reason about while the schema is
still one table, and revisiting it explicitly (not silently) if crit 9's
multi-user work strains it.

The build is multi-stage: `pnpm build` in a stage with `python3`/`make`/`g++`
(better-sqlite3's native module, in case no prebuilt binary matches this
exact Node/arch), then a runtime stage that installs only production
dependencies and copies `dist/` across. I tested this exact path locally —
`docker build` then `docker run --tmpfs /data` matching CI's own command —
before trusting it to deploy; a build that only works via `pnpm dev`
doesn't tell you anything about the container CI actually ships.

## How I directed and checked the work

I designed the interaction (variable-width brush from pointer speed, the
scroll's grow-by-one-blank-segment layout, the enforced/judged split in
`README.md`) and wrote the schema and the API's validation rules myself,
rather than asking for "a drawing app" and accepting whatever came back —
the brief is explicit that the agent version of that median answer is
exactly what this project has to be better than.

Grounding the work meant not trusting a passing `pnpm check` as proof the
interaction actually worked. Once the app built, I opened it in a real
browser and drove a genuine pointer drag — mouse down, several moves, mouse
up — rather than only exercising the HTTP API directly, because a stroke's
shape and the smoothing math only show up under real, timed pointer
events. That live test caught a real bug a code read hadn't:
[`0a10659`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/0a10659)
fixes a single-tap mark (pointerdown, no movement, pointerup) that saved
correctly but rendered as nothing, because SVG has no paintable geometry
for a lone "M x y" with no drawing command. The fix didn't stop at the
client that produced the bug — `CLAUDE.md`'s own rule is that the data
layer is where a promise like "every saved mark is visible" actually has
to hold, so `addStroke` now normalises it there too, and
`spec/scroll.test.ts` asserts the saved path is paintable rather than
trusting whichever client sent it. That's the shape the brief asks for:
the correction landed in the harness (the data-layer rule, the test), not
just in the one call site that happened to trigger it.

I also checked the built container against the actual CI/CD path rather
than assuming `docker build` matches `flyctl deploy`: the same `docker run
-d --init -p 8080:8080 -e PORT=8080 --tmpfs /data` command
`.github/workflows/checks.yml` runs, then `pnpm check` against that
container specifically, not just the local dev server.

## What's still a first draft

`README.md` says plainly that not enforcing "one mark per visitor" is a
judged decision, not an oversight — multi-user identity is crit 9's job,
and I'd rather name that gap than quietly build ahead of the crit that's
supposed to decide it. The same goes for real-time: this crit's "trace
persists" bar is one visitor's own return trip, not several people watching
the same scroll update live. Both are in `README.md`'s own "what's here
now" section, and both are the honest scope of a first working slice, not
things left out by accident.
