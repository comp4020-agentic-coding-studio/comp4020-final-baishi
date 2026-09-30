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

## A deepening pass, before the first draft cooled

A second run picked up where the first left off, rather than starting a
new sensor battery from scratch: the first run's own hand-off named one
open gap on purpose — the drawing zone was pointer-only, with no keyboard
path to draw at all — and that's the first thing this run checked.

It was worse than "missing a `tabindex`": the zone-hit rect sat inside an
`<svg role="img">`, and `role="img"` suppresses any focusable descendant
from the accessibility tree regardless of what attributes it carries — so
adding a bare `tabindex` would have looked fixed in a code read and stayed
broken for anyone using a screen reader. Fixed properly in
[`fbb528d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/fbb528d):
the svg's role comes off (it now holds genuine interactive content, not a
static image), the zone becomes a real `role="button"` control, and
Enter/Space run the exact same submit path pointer input does — a single
dot at the zone's centre, the same shape a stationary tap already
produces. Verified live, not just read: a real `agent-browser` Tab walk
reached the zone in the right order (link, then zone, then end of
document) with a visible focus outline, and a real keydown persisted a
mark that was still there on the next request.

A live axe-core sweep (not run since the first commit) turned up a real,
if narrow, finding of its own: two elements failed AA contrast at
2.8–2.9:1 against a 4.5:1 floor, and axe hadn't caught either — the
tagline link's color was dimmed by its parent's `opacity`, which axe can't
resolve, and the drawing zone's "draw here" prompt is SVG text, which axe
reports as merely "incomplete" rather than measuring. Both only surfaced
by computing the actual composited WCAG contrast ratio by hand and
checking it against what axe called clean. Fixed in
[`874ccac`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/874ccac):
neither element needed a different visual design, just a color that
doesn't rely on `opacity` compositing to look muted, since a solid alpha
`color` value on a text node doesn't drag the rest of the box's children
down with it the way `opacity` does.

## A third pass: dependencies and edge behaviour, nothing broken

A third run worked the second run's own hand-off list rather than
re-running the checks already exhausted. `pnpm audit` was clean; `pnpm
outdated` had three genuinely in-range patches (`jsdom`, `vitest`,
`@types/node`, none crossing the `^` pin in `package.json`), applied and
re-verified against the exact CI container
([`ea9fa14`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/ea9fa14)).

Two checks came back "confirmed correct," not "found and fixed" — both
still worth recording, since a clean result is only evidence once it's
been actually tried. A 200%-zoom reflow check at both marking viewports
found no page-level horizontal overflow; the drawing zone's own
segment can partially exceed the scrollable canvas strip's width at
that zoom on the mobile viewport, but that's consistent with the
scroll's own design (a wide artefact meant to be panned, not a page
meant to reflow to a fixed width) rather than a defect — the zone-hit
control itself stays full-width and keyboard/pointer-reachable
regardless. A real multi-mark test (two further genuine pointer drags
against the live container, not synthetic events) confirmed the
drawing zone shifts by exactly one segment per mark, the total width
grows to match, and the "N marks so far, since &lt;date&gt;" line keeps
citing the *first* mark's date as more accumulate, not the latest one.

## What's still a first draft

`README.md` says plainly that not enforcing "one mark per visitor" is a
judged decision, not an oversight — multi-user identity is crit 9's job,
and I'd rather name that gap than quietly build ahead of the crit that's
supposed to decide it. The same goes for real-time: this crit's "trace
persists" bar is one visitor's own return trip, not several people watching
the same scroll update live. Both are in `README.md`'s own "what's here
now" section, and both are the honest scope of a first working slice, not
things left out by accident.
