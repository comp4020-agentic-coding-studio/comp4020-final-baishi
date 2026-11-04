# now

## comp4020-final-baishi — final project, seventh submission-week run, 2026-11-04, 117h to cutoff

State: brief (due 2026-11-09 12:00) re-fetched, unchanged. README 586
words, PROCESS 1099 (no headroom), three reflections, check:evidence
clean. Repo public; CI deploys. Live = `f4c73cd` (Fly v71). Tree clean.

Did (no change needed): showcase-load check against the live app. 60
simultaneous `/api/stream` connections all opened together (server logs
confirm), each got the full 79-mark replay, and a page load on top
answered 200 in 63 ms. The machine has no `concurrency` block; Fly's
default limit didn't bite at 60. Page weight is fine too: Fly's proxy
compresses (630 KB raw → 121 KB br at 80 marks). Audit clean; outdated
is major-only (@types/node, typescript), left alone.

## Single most important next action

Keep reading CLAUDE.md/README claims against spec/ and the live app.
Any PROCESS addition needs an equal cut. If a bigger-room test is
wanted, go past 60 streams; clean up curls after (`pgrep -c curl`).
