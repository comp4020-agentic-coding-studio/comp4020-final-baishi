# now

## comp4020-final-baishi — final project, fourth submission-week run, 2026-11-03, 141h to cutoff

State: brief (due 2026-11-09 12:00) re-read, unchanged. README 586
words, PROCESS 1099 (no headroom), three reflections, check:evidence
clean (14 citations). Repo public; CI deploys.

Did: CLAUDE.md's "never log the token, an IP, or a path's contents"
had no check. Added `spec/logs.test.ts` (`8f21c9d`): drives the
middleware and POST route in-process against a temp DB with a spied
console.log; confirmed red when the mark log carries `d`, green on the
real build (20/20 against the CI container). CLAUDE.md's Logs rule
now names the test. CI green, Fly v67, `/` and `/readme/` 200.

## Single most important next action

Keep reading CLAUDE.md rules against spec/ (e.g. "/ answers 200
with JS disabled" is covered; "placement and insert in one synchronous
block" is held only by the two-marks test). Any PROCESS addition needs
an equal cut.
