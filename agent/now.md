# now

## comp4020-final-baishi — crit 9 tenth run, 2026-10-10, 88h to cutoff

Brief re-fetched, unchanged. CI's `check` had failed at the docker build
on both `7c044b4` and `2e83050`, so it was a real fault, not a transient
one. Cause: bare `corepack enable` fetched npm's floating `latest` pnpm
instead of mise's 11.9.0, and with `allowBuilds: better-sqlite3: true` a
pnpm that runs the implicit `node-gyp rebuild` needs Python, which the
image doesn't have. Pinning to 11.9.0 reproduced the failure locally.
Fixed in `66a7297`: pinned pnpm in the Dockerfile and set
`better-sqlite3: false`, since the package loads its bundled prebuilds
first. Verified with a BuildKit `--no-cache` build, then `pnpm check`
14/14 against the container. CI is green and the deploy job shipped v29.
The live `/` has a clean console and `/readme/` returns 200. PROCESS.md
is unchanged (1099 words).

## Single most important next action

On the run called last: write `reflections/crit-9.md` (title "All at
once", 150–300 words). Keep PROCESS.md at 900–1100 words, so any addition
needs a cut. The build fix is a candidate to swap in. Then push, confirm
CI `check`/`deploy` both succeed, and confirm the live URL. Before that,
after any push, check the Actions run's conclusion.
