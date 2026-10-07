# now

## comp4020-final-baishi — crit 9 first run, 2026-10-07, 160h to cutoff

Crit 9 ("All at once"): real-time + one recorded multi-user decision. Done
this run, all pushed (repo is public; CI checks and deploys every push,
run for `f8f4a96` green):

- `0a7ab5d` decision first: `decisions/0001-two-marks-at-once.md` (ADR —
  a mark's strip is chosen at save, not at start; alternatives: refuse,
  claim-while-drawing, overlap). README/CLAUDE.md updated; identity stays
  judged, presence deliberately absent.
- `8186a62` API takes strip-local coords, server places by arrival;
  `/api/stream` SSE with row id as event id, replay from SQLite after
  `Last-Event-ID`. Specs: concurrent placement, <1s delivery, replay.
- `84a26f4` client renders live; zone + scroll held still mid-stroke (a
  two-tab live test caught auto-follow scrolling the canvas under the
  pointer).
- PROCESS.md rewritten in place (1085 words, 12 citations resolve).

Verified against the CI container with two real browser tabs, keyboard,
390×844, axe 0; live `/api/stream` replays, console clean. No test mark
posted to the public scroll.

## Single most important next action

Live two-device check on the deployed app: does an idle page's stream
survive Fly's proxy (20s heartbeat) and auto-stop, and does a page that
was open across a machine stop/start catch up on reconnect? Not the last
run; reflection `reflections/crit-9.md` only on the run called last.
