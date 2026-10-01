# now

## comp4020-final-baishi — deepening run, 2026-10-01, 129h to crit-8 cutoff

Sixth run on this deliverable. Pointed the clause-by-clause technique at
`.github/workflows/checks.yml` for the first time (the fifth run's own
flagged candidate) — every comment checked out clean against the files it
describes (the `if` visibility gate, the Dockerfile/Fly parity claim, the
one-machine-one-volume shape in `fly.toml`, the trufflehog course-key
detector's own stated reasoning against `.github/trufflehog.yml`). `pnpm
audit`/`outdated` also re-run, unchanged (both outdated entries still
major-only).

That left nothing flagged, so the run read `src/lib/draw.ts` fresh instead
of repeating an exhausted sensor battery, and found a real bug: `drawing`
was a bare boolean, not keyed to which pointer actually started the drag —
the same shape as several pointer/key-identity bugs already logged in
`MEMORY.md` for other crits (crit-4's `pointerPads` cardinality, crit-5's
`dragging`→`draggingPointerId`). A stray second contact during a one-finger
drag (a palm, a bracing finger — a real touchscreen scenario, not a
contrived one) would get its movement silently appended into the real
stroke, and its own `pointerup` would call `releasePointerCapture` with a
pointer ID the zone never captured — throwing `NotFoundError` inside an
`async` function before its first `await`, which surfaces as an unhandled
rejection, not a caught error. That left `drawing` already `false`, so the
real pointer's own legitimate `pointerup` right after was a silent no-op:
no fetch, no status update, no visible error — and since `done` was already
set at the original `pointerdown`, the drawing zone was now permanently
inert for the rest of that page load. **A visitor's one mark, silently
lost, with the zone looking the same as it did before they started.**

Confirmed live with two independent synthetic `PointerEvent` sequences
(distinct `pointerId`s) against a running container, both before and after
the fix — see the new dedicated `MEMORY.md` entry for the full mechanism
and the jsdom gap (`createSVGPoint`/`getScreenCTM`/`setPointerCapture` are
all unimplemented, confirmed directly) that makes this untestable at the
`spec/` layer. Fixed by tracking `drawingPointerId` instead of a boolean
([`75bc2b5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/75bc2b5)),
written up in `PROCESS.md` as a sixth moment
([`03cedee`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/03cedee)).
`pnpm check` green (6/6) against the exact CI container before and after.
Redeployed (`flyctl deploy --remote-only --ha=false`) and reverified live:
the same two-pointer repro against `https://comp4020-final-baishi.fly.dev/`
left the real mark unaffected and the count incremented correctly, no
console errors.

## Single most important next action

Not the last run (129h remaining at this run's start — still plenty of
runway). No new self-administered angle is currently flagged — the
clause-by-clause technique has now covered `README.md`, `CLAUDE.md`, the
Dockerfile, and `checks.yml`; `pnpm audit`/`outdated` is clean. A future
run could try the CSS-property-literacy lens (tap-highlight-color,
touch-action scope, forced-colors border-loss, touch-callout/user-select —
none yet checked on this repo's `global.css`) or a fresh read of
`src/pages/api/strokes.ts`/`layout.ts` for a similar identity/cardinality
gap to the one just found in `draw.ts`. Only write
`reflections/crit-8.md` and do the doctrine's finishing steps on whichever
run the next prompt calls "last" for this cutoff.
