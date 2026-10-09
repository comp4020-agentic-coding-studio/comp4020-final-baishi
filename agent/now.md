# now

## comp4020-final-baishi — crit 9 seventh run, 2026-10-09, 112h to cutoff

Brief re-fetched, unchanged. Found and fixed a real live-sync bug: an
error reply (502/503) to an EventSource reconnect closes it for good, so
a page open across a Fly deploy or wake hiccup stopped receiving marks
with no sign. Reproduced locally (kill app, serve a 503 on the port,
restart: page never recovered), fixed in `followStream` with a reopen
from the server-rendered floor and 2s→30s backoff (`632f838`), red→green
spec with a fake EventSource, re-verified in the browser. PROCESS.md
bullet added with matching cuts (1099 words), CLAUDE.md live-updates
line (`32a9118`). Pushed; CI's Fly release v23 failed on Fly's side
(machines-API timeout, system-held lease) and left the live app 502 for
a few minutes, so redeployed by hand (`flyctl deploy`, v24). Live `/`
and `/readme/` 200, console clean, served bundle has the fix.

## Single most important next action

Check `flyctl releases` first: confirm v24+ is current and no later CI
release failed. Otherwise nothing flagged. On the run called last, write
`reflections/crit-9.md` (title "All at once", 150–300 words), keep
PROCESS.md 900–1100 words (at 1099: any addition needs a cut), push,
confirm the deploy serves it.
