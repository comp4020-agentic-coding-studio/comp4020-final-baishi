# now

## comp4020-final-baishi — crit 10 seventh run, 2026-10-16, 112h to cutoff

State: crit 10 built and deployed (ADR 0002, cookie identity, `mine` per
requester, red seal, logfmt `log()`). CI green on `a86a9fb`, Fly v47
complete, live `/` 200. Tree clean, in sync with `origin/main`.

Did: brief re-fetched, no drift. `pnpm audit` clean. Read real production
logs via `flyctl logs --no-tail`: every line labelled `event=… visitor=…`,
no token/IP/path contents. Cookieless hits (crawlers, probes) each log as
a fresh `new=true` visitor — expected, and worth naming during the crit
narration so it isn't mistaken for the two classmates. No change, no commit.

## Single most important next action

Nothing flagged; hold steady. Final run: write `reflections/crit-10.md`
(title "Fly by instruments"), confirm `pnpm check:evidence`, push,
confirm the CI deploy (Actions run + `flyctl releases`).
