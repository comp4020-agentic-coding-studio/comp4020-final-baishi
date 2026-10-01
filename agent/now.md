# now

## comp4020-final-baishi — deepening run, 2026-10-01, 135h to crit-8 cutoff

Fifth run on this deliverable. Worked the fourth run's own flagged
candidates: re-ran `pnpm audit`/`outdated` (clean, both outdated entries —
`@types/node`, `typescript` — still major-only, correctly left alone), and
extended the clause-by-clause re-derivation technique to the Dockerfile for
the first time (it had only ever been pointed at app code/README/CLAUDE.md
before).

It paid off: the Dockerfile's own comment, and `PROCESS.md`'s stack
section repeating it, claimed `python3`/`make`/`g++` were installed in both
build and runtime stages as "the fallback for when no prebuilt binary
matches this exact node/arch (prebuild-install tries that first)" for
`better-sqlite3`. Checked against the actual installed package rather than
trusting the comment: `better-sqlite3@13.0.3` has no `install`/
`postinstall` script at all — it bundles a prebuilt N-API binary for every
platform/arch pair directly inside the package (`prebuilds/linux-x64.node`
and seven siblings), selected at require-time by `process.platform`/
`process.arch` alone, with no node-version/ABI matching involved at all
(N-API is ABI-stable). The fallback this comment describes can never
trigger on the plain `linux-x64` glibc image the Dockerfile builds on —
the apt install was dead weight in both stages, against this project's own
"small on purpose" ethos.

Removed it from both stages, rebuilt `--no-cache`, and verified against
the exact CI command (`docker build` + `docker run -d --init --tmpfs
/data`): `pnpm check` green (6/6), a real `curl` POST to `/api/strokes`
round-tripped a mark correctly. Fixed the Dockerfile comment and
`PROCESS.md`'s stack section, added a fifth `PROCESS.md` moment, committed
and pushed
([`961bafc`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/961bafc)).
Redeployed (`flyctl deploy --remote-only --ha=false -a
comp4020-final-baishi`, new image 149MB) and reverified live: `/` and
`/readme/` both 200, a real mark write still round-trips on the persistent
Fly volume. No app-behaviour change — this was purely a build-image fix.
See the new dedicated `MEMORY.md` entry for the generalisable lesson
(check a native dependency's own `package.json`/prebuilds before trusting
a Dockerfile's stated reason for a toolchain install).

## Single most important next action

Not the last run (135h remaining at this run's start — still plenty of
runway). No new self-administered angle is currently flagged. Two
candidates for a future run: (1) the clause-by-clause technique has now
covered `README.md`, `CLAUDE.md`, and the Dockerfile, but never
`.github/workflows/checks.yml` itself — its own comments make claims
(e.g. "the same image Fly deploys, with a throwaway /data in place of the
volume") worth checking line-by-line the same way; (2) re-run `pnpm
audit`/`outdated` again after a few more days have passed. Only write
`reflections/crit-8.md` and do the doctrine's finishing steps on whichever
run the next prompt calls "last" for this cutoff.
