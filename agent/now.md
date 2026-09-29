# now

## comp4020-final-baishi — first build run, 2026-09-30, 166h to crit-8 cutoff

New deliverable: the final project, starting from crit 8 ("It's alive!").
This run picked the concept, built a working proof-of-life slice, and
deployed it. No prior work existed — repo arrived as the bare template
(placeholder busybox app, empty `CLAUDE.md`/`README.md`/`PROCESS.md`).

**The app: "The Scroll".** A shared ink canvas that only ever grows: one
blank strip at the right-hand edge of an SVG scroll, draw one mark there
(mouse/pen/touch, via Pointer Events — a variable-width brush from real
speed, quadratic-smoothed), and it's permanent — no edit, no delete, no
accounts. Persistence is a single `strokes` table in `better-sqlite3` (no
ORM — see `PROCESS.md`'s stack case), one file on the Fly volume at
`/data/scroll.db`. Stack: Astro (server output, Node adapter standalone),
chosen for file-based routing across two pages + one API route with no
extra framework weight.

Five commits, all pushed to `origin/main` (`d654ec9`): the app scaffold,
`spec/scroll.test.ts` (persistence over a fresh HTTP request, validation,
no-delete), `README.md` + `CLAUDE.md` (the "good" argument — small on
purpose, cites Robin Sloan's home-cooked-app essay, Ben Hoyt's small-web
essay, Hundred Rabbits' own account of their practice — and the harness
rules it implies), a real bug fix, and `PROCESS.md` (955 words, within the
final brief's eventual 900–1100 band already).

**Real bug found by live-browser testing, not code review:** a genuine
`agent-browser` mouse-drag test worked immediately, but a tap-only stroke
(pointerdown, no movement, pointerup) saved correctly yet rendered
nothing — SVG has no paintable geometry for a bare `M x y` with no drawing
command; needs a zero-length `L` to the same point before a round linecap
actually shows a dot. Fixed at the data layer (`addStroke` in
`src/lib/db.ts` normalises it, not just the client), with a spec assertion
added. See `MEMORY.md`'s new SVG entry.

`pnpm check` green (6/6 tests) locally, against a real `docker build` +
`docker run --tmpfs /data` matching CI's own command exactly, and against
the deployed app. Deployed via `flyctl deploy --remote-only --ha=false -a
comp4020-final-baishi` — live, verified with real `agent-browser` pointer
drags at both marking viewports: a mark drawn, page reloaded, mark still
there (the crit's actual "trace persists" bar), console clean (aside from
the known cross-session console-leak artifact, confirmed via
`window.location.href` each time). Repo is still private — correct, the
harness flips it public at cutoff, not this agent.

Deliberately deferred, and named as such in `README.md`/`CLAUDE.md`: no
enforced "one mark per visitor" (judged, not enforced, on purpose — real
identity is crit 9's job), no real-time layer yet (crit 9), no
server-side logging (crit 10). `reflections/crit-8.md` not yet written —
correctly deferred to whichever run the next prompt calls "last" for this
crit's 168-hour window.

## Single most important next action

Not the last run for crit 8. A future run in this window should: do a
deepening pass (accessibility sweep, a live keyboard-only pass at the
drawing zone — currently pointer-only, no keyboard way to draw at all,
which is a real gap worth deciding on purpose rather than leaving
implicit), and only write `reflections/crit-8.md` + do the doctrine's
finishing steps on whichever run the prompt calls last for this cutoff.
