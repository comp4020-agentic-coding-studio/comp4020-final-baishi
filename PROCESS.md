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

The build is multi-stage: `pnpm build`, then a runtime stage that installs
only production dependencies and copies `dist/` across. I tested this exact
path locally — `docker build` then `docker run --tmpfs /data` matching CI's
own command — before trusting it to deploy; a build that only works via
`pnpm dev` doesn't tell you anything about the container CI actually
ships.

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

## A fourth pass: checking the fix against the rest of the file, not just itself

A fourth run tried the third run's own flagged candidate — a clause-by-clause
re-read of `README.md`/`CLAUDE.md` against the current code — and it paid off
immediately, in a place none of the three prior passes had looked: the second
run's own contrast fix
([`874ccac`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/874ccac))
introduced a dedicated `--link` color specifically because `--accent` alone is
4.30:1 against the page background — under the 4.5:1 AA floor — and used it on
`.tagline a`. It never checked `readme.astro`'s own link style, which still
used `--accent` directly. Every hyperlink rendered from `README.md` on
`/readme/` — the three sources cited under "What good means here," the
crit-9 link — was under the AA floor the whole time, on the one page the crit
calls its "real material." Fixed in
[`7e2939a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/7e2939a),
along with the same file's `blockquote` rule, which still used `opacity`
rather than a direct color — the exact anti-pattern `874ccac` rewrote
`.tagline` to avoid, dormant only because `README.md` has no blockquote yet.
Confirmed live: the computed link color now reads `rgb(117, 76, 44)`
(`--link`), and a fresh axe-core sweep of both pages still shows zero
violations.

That run also ran the other flagged candidate — a full keyboard-only
draw-then-reload walkthrough, not the keydown-persists check the second run
already did — against the exact CI container (`docker build` +
`docker run --tmpfs /data`, matching `.github/workflows/checks.yml`): a real
`agent-browser` Tab walk reached the "What this is, and why" link, then the
drawing zone (`rect#zone-hit`, `role="button"`), a real `Enter` press left a
mark, and a completely fresh navigation (not just the client's own
`location.reload()`) showed the mark still there — the crit's actual "a
stranger... finds their trace still there when they come back" bar, walked
end to end via keyboard alone. `pnpm check` green (6/6) against that
container throughout. Redeployed and reverified the live contrast fix.

## A fifth pass: a Dockerfile comment making a claim that doesn't hold

A fifth run pointed the same clause-by-clause technique at a file the first
four had only ever run, never read critically: the Dockerfile's own
comment, and the stack section above describing it. Both claimed
`python3`/`make`/`g++` were there as "the fallback for when no prebuilt
binary matches this exact node/arch (prebuild-install tries that first)."
Checking it against the actual installed package rather than trusting the
comment: `better-sqlite3@13.0.3` has no `install`/`postinstall` script at
all — no `prebuild-install` step ever runs — because the package ships a
prebuilt N-API binary for every platform/arch pair directly inside itself
(`prebuilds/linux-x64.node` and seven siblings), selected at require-time
by `lib/binding.js` on `process.platform`/`process.arch` alone. N-API is
ABI-stable across Node versions, so there's no "exact node/arch" matching
to fail in the first place on the `linux-x64` glibc image this Dockerfile
already builds on. The fallback path the comment describes can't trigger
here; the apt install was dead weight the whole time, directly against
this crit's own standard ("if we can use less technology to solve any one
task, we will," cited in `README.md`).

Removed the `apt-get install` step from both stages, rebuilt with
`--no-cache` against the exact CI command (`docker build` +
`docker run -d --init -p 8080:8080 --tmpfs /data`), and reran `pnpm check`
against that container — all 6 tests still green, a real `curl` POST to
`/api/strokes` still wrote and rendered a mark. Fixed the Dockerfile
comment and this file's own stack section, which had repeated the same
unverified claim since the first run. No functional change to the app;
one fewer unverified assumption in a file that gets rebuilt on every push.

## A sixth pass: checking CI's own comments, then a real pointer bug

A sixth run pointed the clause-by-clause technique at a file it had never
reached: `.github/workflows/checks.yml`. Every comment there checked out
against the files it describes — the `if` gate's claim about the repo's
visibility, the Dockerfile/Fly parity the build-and-start step names, the
one-machine-one-volume shape `fly.toml` documents, and the course-key
detector's own stated reasoning against `.github/trufflehog.yml`. Nothing
to fix; `pnpm audit`/`outdated` also came back unchanged (both entries
still major-only).

Reading `src/lib/draw.ts` fresh afterwards, rather than re-running an
exhausted sensor battery, found a real bug: `drawing` was a plain boolean,
not tied to which pointer was actually drawing. A stray second contact
during a one-finger drag — a palm, a bracing finger, anything a touchscreen
reports as its own pointer — would get its movement silently appended into
the real stroke (`pointermove` only checked the boolean), and its own
`pointerup` would end the drag early by calling
`releasePointerCapture` with a pointer ID the zone never captured.
Confirmed live with two independent synthetic `PointerEvent` sequences
against a running container: the stray pointer's move visibly corrupted
the preview path, and its release threw `NotFoundError` inside `finish`'s
async body — an unhandled rejection, not a caught one, since the throw
happens before the function's first `await`. That left `drawing` already
false, so the real pointer's own, legitimate `pointerup` right after was a
silent no-op: no fetch, no status update, no error shown, and `done` was
already set at the original `pointerdown` — the zone was now permanently
inert for the rest of that page load. A visitor's one mark, gone with no
sign anything had gone wrong.

Fixed by tracking the owning pointer ID instead of a bare flag
([`75bc2b5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/75bc2b5)):
`pointermove` and `finish` now both check `event.pointerId` against the
one that started the drag, so a second pointer's events are inert from the
first one. No `spec/` test covers this one: jsdom, which every HTTP-level
test in `spec/` runs under, has no `createSVGPoint`, `getScreenCTM` or
`setPointerCapture` at all (confirmed directly, not assumed), so a
pointer-identity bug in `draw.ts` isn't "the kind a test can hold" the way
`CLAUDE.md` means it — the live, two-pointer `agent-browser` reproduction
above is the verification, re-run clean against the exact CI container
after the fix (`pnpm check` 6/6, no rejection, the real mark still saves
and the count still increments).

## What's still a first draft

`README.md` says plainly that not enforcing "one mark per visitor" is a
judged decision, not an oversight — multi-user identity is crit 9's job,
and I'd rather name that gap than quietly build ahead of the crit that's
supposed to decide it. The same goes for real-time: this crit's "trace
persists" bar is one visitor's own return trip, not several people watching
the same scroll update live. Both are in `README.md`'s own "what's here
now" section, and both are the honest scope of a first working slice, not
things left out by accident.
