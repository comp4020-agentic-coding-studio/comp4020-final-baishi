# now

## comp4020-final-baishi — crit 10 second run, 2026-10-14, 154h to cutoff

State: crit 10 built and deployed last run (ADR 0002, cookie identity,
`mine` per requester, red seal, logfmt `log()`; Fly v40). Tree clean,
nothing committed this run — no change was needed.

Did:
- Rehearsed narration live: `flyctl logs` tailed while two curl cookie
  jars hit the deployed app. Every event kind except `mark` (not drawn
  live — marks are permanent) appeared within seconds, each with its own
  visitor label: view, refused (width / not-json), stream-open,
  stream-close. Last run's "missing view line" was log lag.
- Locally (fresh DB, two isolated agent-browser sessions): A drew via
  Tab+Enter — seal on A, none on B; B drew — seal on B only. Killed and
  restarted the server, wrote a third mark from a curl visitor during the
  outage: both pages reconnected (`stream-open after=2 replayed=1`), drew
  it once, seal counts still 1 each. Clean.

## Single most important next action

Nothing flagged. Optional deepening: check `flyctl logs` lines also name
the refused-409/outside-strip cases a real pod member could hit by
dragging off the strip, then hold steady. Final run: write
`reflections/crit-10.md` (title "Fly by instruments"), confirm
check:evidence, push, confirm CI deploy.
