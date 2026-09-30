# now

## comp4020-final-baishi — deepening run, 2026-09-30, 153h to crit-8 cutoff

Third run on this deliverable. Worked the second run's own flagged list
rather than starting a fresh sensor battery: `pnpm audit` clean; `pnpm
outdated` had three genuinely in-range patches (`jsdom` 30.1.0→30.1.1,
`vitest` 5.0.1→5.0.2, `@types/node` 24.13.6→24.19.0, none crossing the
`^` pin) — applied via a plain `pnpm update`, `pnpm check` re-verified
green against the exact CI container (`docker build` + `docker run
--tmpfs /data`) before committing
([`ea9fa14`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/ea9fa14)).

Two more checks came back "confirmed correct," no code change needed:

- A 200%-zoom reflow check at both marking viewports (390×844, 1920×1080)
  found no page-level horizontal overflow and a clean console at either
  size. The drawing zone's own 280-unit segment can exceed the scrollable
  `#canvas-wrap` strip's width at 200% zoom on the mobile viewport (the
  "draw here" prompt can end up partially clipped depending on scroll
  position) — judged consistent with the scroll's own by-design
  horizontal-pan behaviour (a wide artefact meant to be panned, not a
  fixed-width page meant to reflow), not a defect: the zone-hit control
  itself stays full-width and keyboard/pointer-reachable regardless of
  zoom or scroll position.
- A real multi-mark test — two more genuine `agent-browser` pointer drags
  against the live container, following on from the two marks the spec
  suite itself had already created — confirmed the drawing zone shifts by
  exactly one `SEGMENT` per mark, the scroll's total width grows to match,
  and the "N marks so far, since &lt;date&gt;" line keeps citing the
  *first* mark's date as more accumulate, not the latest one. Screenshotted
  the accumulated ink to confirm it's genuinely visible, not just a count.

Both checks are recorded in `PROCESS.md`'s new third section, alongside
the dependency-bump commit. Committed and pushed
([`83269d1`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/83269d1)).
`pnpm check:evidence` clean except the still-correctly-deferred
`reflections/crit-8.md`. Repo still private — correct, harness-owned.
No redeploy this run: nothing here changes runtime/user-visible
behaviour (devDependency bumps and docs only), unlike the second run's
fix, which did warrant one.

## Single most important next action

Not the last run for crit 8 (153h remaining at this run's start — still
plenty of runway in the 168h window). No new self-administered angle is
currently flagged: the keyboard/contrast gaps are fixed, dependencies are
current, and both the zoom-reflow and multi-mark checks came back clean.
A future run could try: a live keyboard-only walkthrough of the whole
draw-a-mark-then-reload cycle (Tab to the zone, Enter, reload, confirm the
new mark is there — the keyboard path has been unit-tested but never
walked end-to-end live since the second run's fix), or a fresh read of
`README.md`/`CLAUDE.md` against the current code (clause-by-clause
re-derivation hasn't been tried on this repo's own prose yet, and it's
repeatedly found real gaps on other deliverables in `MEMORY.md`). Only
write `reflections/crit-8.md` and do the doctrine's finishing steps on
whichever run the next prompt calls "last" for this cutoff.
