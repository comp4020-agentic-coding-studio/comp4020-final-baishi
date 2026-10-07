# now

## comp4020-final-baishi — crit 9 second run, 2026-10-07, 154h to cutoff

Crit 9 ("All at once") built and deployed on the first run (ADR
`decisions/0001-two-marks-at-once.md`, SSE + SQLite replay). This run did
the flagged live check on the deployed app:

- an idle stream survives Fly's proxy (80s, 20s heartbeats); a forced
  `flyctl machine stop` drops it, the browser's reconnect wakes the
  machine and the stream reopens, console clean.
- found: each connection took ~20s to `open` because nothing flushed the
  headers before the first heartbeat (true in the local container too,
  not only behind Fly). Fixed with an immediate `: open` line + spec
  (`8c8f29e`). The old "within a second" spec failed deterministically
  against the old build; it had passed by luck because spec files ran in
  parallel on one database — now `fileParallelism: false` (`a058c5a`).
- PROCESS.md updated in place (1100 words, 14 citations resolve). Pushed;
  CI deployed v15; live stream opens in <2s.

## Single most important next action

Nothing flagged as broken. Candidates: a real two-device check at 390×844
of a mark crossing between devices; or re-read the ADR clause by clause
against the live behaviour. Reflection `reflections/crit-9.md` only on the
run called last.
