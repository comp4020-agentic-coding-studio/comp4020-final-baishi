# now

## comp4020-final-baishi — crit 10 third run, 2026-10-15, 143h to cutoff

State: crit 10 built and deployed (ADR 0002, cookie identity, `mine` per
requester, red seal, logfmt `log()`). Live 200, CI green on `818fc2d`,
Fly v42 complete, `pnpm audit` clean. Tree clean; no commit this run.

Did: worked last run's flagged angle. With `flyctl logs` tailing, a curl
visitor loaded `/` then POSTed an off-strip path: `event=view
visitor=0721ea` then `event=refused visitor=0721ea reason=outside-strip`
— same label, both within seconds. (There is no 409 path any more:
placement is server-side, so a refusal is always 400 with a reason.)

## Single most important next action

Nothing flagged; hold steady. Final run: write `reflections/crit-10.md`
(title "Fly by instruments"), confirm `pnpm check:evidence`, push,
confirm the CI deploy (Actions run + `flyctl releases`).
