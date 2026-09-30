# now

## comp4020-final-baishi — deepening run, 2026-10-01, 142h to crit-8 cutoff

Fourth run on this deliverable. Worked the third run's own flagged list —
the clause-by-clause re-derivation of `README.md`/`CLAUDE.md` against the
current code had never been tried on this repo — and it found a real,
currently-live bug on the first pass: the second run's own contrast fix
([`874ccac`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/874ccac))
introduced `--link` specifically because `--accent` alone is 4.30:1 against
the page background (under the 4.5:1 AA floor), and used it on `.tagline a`
in `global.css` — but never checked `readme.astro`'s own scoped `<style>`
block, which still used `--accent` directly for every hyperlink rendered
from `README.md`. That meant every link on `/readme/` — the three sources
cited under "What good means here," the crit-9 link — was under the AA
floor, on the one page this crit calls the "real material." Fixed the same
file's dormant `blockquote { opacity: 0.85 }` too (the exact anti-pattern
`874ccac` rewrote `.tagline` to avoid; harmless today only because
`README.md` has no blockquote yet). Both fixed in
[`7e2939a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/7e2939a),
confirmed live (computed link color now reads `rgb(117, 76, 44)`, axe-core
0 violations on both pages).

Also worked the other flagged candidate: a full keyboard-only
draw-then-reload walkthrough, distinct from the second run's
keydown-persists check. Against the exact CI container (`docker build` +
`docker run --tmpfs /data`), a real `agent-browser` Tab walk reached the
"What this is, and why" link, then the drawing zone (`role="button"`) in
the right order; a real `Enter` press left a mark; and a completely fresh
navigation (not the client's own `location.reload()`) showed the mark still
there. `pnpm check` green (6/6) throughout. `PROCESS.md` extended with both
findings, pushed
([`b8acc7d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/b8acc7d)),
redeployed and reverified the fix live on
`https://comp4020-final-baishi.fly.dev/readme/` (console clean).

A general lesson worth carrying forward, recorded in `MEMORY.md`: a
contrast/palette fix that introduces a *new* corrected value only lands in
the file the bug report named — always grep for every *other* file using
the same design token/color pairing, not just confirm the reported instance
is fixed. This is the inverse of the already-known "grep for the old value
after a swap" lesson.

## Single most important next action

Not the last run for crit 8 (142h remaining at this run's start — still
plenty of runway). No new self-administered angle is currently flagged: the
keyboard, contrast and dependency threads are all closed out, and this
run's own clause-by-clause pass covered `README.md` and `CLAUDE.md` fully
against `index.astro`, `readme.astro`, `draw.ts`, `db.ts`, `strokes.ts`, and
`spec/`. Two candidates for a future run: (1) re-run `pnpm audit`/`outdated`
(last checked at the third run, three runs ago now); (2) the
clause-by-clause technique hasn't yet been pointed at the Dockerfile or
`.github/workflows/checks.yml` — both make real claims (multi-stage build
needs native-module toolchain, the `--tmpfs /data` container matches what
`fly.toml`'s volume gives in production) that haven't been checked the same
way the app code has. Only write `reflections/crit-8.md` and do the
doctrine's finishing steps on whichever run the next prompt calls "last"
for this cutoff.
