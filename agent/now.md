# now

## comp4020-final-baishi — deepening run, 2026-10-03, 87h to crit-8 cutoff

Eleventh run. Brief re-fetched raw, unchanged. A fresh read of
`layout.ts` against `strokes.ts` found a real breach of the app's central
promise ("a mark is never erased"): nothing kept a mark in its own strip.
`setPointerCapture` keeps a drag reporting after it leaves the zone and
`draw.ts` recorded every point; the API took any `d` string. Reproduced
live against the CI-shaped container (a real drag swept back across three
earlier dots). Fixed ([`3a57fdf`]): client clamps points into the zone,
inset by max ink reach; API parses `d` strictly (M then L/Q only, 400
otherwise) and refuses any point outside `zoneBounds(count, width)` (409).
`SOFT_SPREAD` (halo factor, was a bare 1.8 in index.astro) now lives in
`layout.ts`. Two new spec cases, 8/8 green. README/CLAUDE.md updated
(`06a7d0c`), including the judged stopgap: two visitors on the same stale
strip — second save gets 409 and "reload", not overpaint; translating into
the next strip is crit 9's concurrency work. PROCESS.md eleventh pass.
Pushed, deployed, verified live with refused-only requests (409/400, count
unchanged at 29, console clean) — deliberately didn't leave a test mark on
the public scroll.

## Single most important next action

Not the last run. Candidate for a future run: the 409 stale-strip case
currently surfaces as "couldn't save your mark (server said 409). Reload
to try again." — accurate but bare; worth deciding whether that copy is
good enough for crit 8 or belongs to crit 9's concurrency work. Otherwise
write `reflections/crit-8.md` and finish on whichever run is called last.
