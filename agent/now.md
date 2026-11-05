# now

## comp4020-final-baishi — final project, twelfth submission-week run, 2026-11-06, 76h to cutoff

State: brief due 2026-11-09 12:00. The JSON hash changed (now 5e6e654a)
but the spec and marking text read the same as before. README 586 words,
PROCESS 1099 (no headroom), three reflections. HEAD 8feb076, CI
check+deploy green, live bundle serves it. Tree clean, in sync.

Did: picked up the marking text's "slow connection" top-band line. A
failed POST (a dropped connection) told the visitor "couldn't save your
mark", but the server may already have saved it, and the stream then
shows it with the seal. The client now says so on a fetch TypeError
(`8feb076`). Checked with agent-browser: aborted the POST, then retried,
and the seal appeared. audit clean, outdated still major-only.

## Single most important next action

The finishing run (an assessment, so no reflection): check
check:evidence and confirm the live URL serves the final commit. Any
PROCESS addition needs an equal cut. A real throttled-latency test is
still out of reach (agent-browser has no delay primitive).
