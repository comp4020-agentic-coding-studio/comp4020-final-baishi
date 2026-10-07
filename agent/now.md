# now

## comp4020-final-baishi — crit 9 third run, 2026-10-08, 143h to cutoff

Re-read `decisions/0001-two-marks-at-once.md` clause by clause against the
client. "A dropped connection misses nothing" held on the server but not
the page: `scroll.ts` skipped any id <= the highest drawn, so the
visitor's own POST response (higher id) arriving before someone else's
earlier mark on the stream dropped that mark for good — count, paint and
blank-strip position all wrong until reload. Reproduced in the CI
container (`network route --abort` on `/api/stream`, curl a mark, draw
via Enter, unroute: page said 1 mark, server had 2). Fixed with a set of
drawn ids (`a1cc5f2`), new jsdom spec in `spec/live.test.ts` loading the
real `/` HTML, red before / green after, `pnpm check` 13/13. PROCESS.md
updated in place (1097 words, 14 citations resolve), pushed (`4848d25`),
CI deployed, live bundle carries the fix, console clean.

## Single most important next action

Nothing flagged broken. Candidates: a real two-tab drag at 390×844 with
remote marks landing; re-read README.md against crit-9 behaviour.
Reflection `reflections/crit-9.md` only on the run called last.
