# now

## comp4020-final-baishi — deepening run, 2026-10-02, 111h to crit-8 cutoff

Eighth run on this deliverable. Worked the seventh run's own flagged
candidate (a fresh read of `src/pages/readme.astro`'s `marked`-rendering
path) and found nothing new there — headings nest correctly, the link/
blockquote fixes still hold, and `marked.parse` runs over this repo's own
`README.md`, not visitor input, so there's no injection surface.

Tried a genuinely new tool against this repo for the first time:
`html-validate` against both live-rendered pages. `/readme/` clean; `/`
flagged `aria-label-misuse` on `<svg id="scroll">`, which carries an
`aria-label` but deliberately no `role` (removed in the second run's
`fbb528d` specifically to stop `role="img"` suppressing the zone-hit
button from the accessibility tree). Investigated rather than assumed:
confirmed via SVG-AAM that the svg's implicit role is already
`graphics-document`, which supports naming and is why it's in the
accessibility tree at all — the markup is spec-correct. Tested the
obvious fix against a throwaway copy of the rendered HTML (not the real
app) before ruling it out: adding `role="graphics-document"` explicitly
swaps the error for `no-redundant-role` — `html-validate` already
resolves the implicit role internally, it just doesn't consult that
resolution for the `aria-label-misuse` check, so no markup satisfies both
rules at once. `role="img"` would satisfy the linter but is exactly the
regression `fbb528d` fixed. Left the markup as is, documented as a tool
limitation confirmed by testing the tool's own two rules against each
other, not a real accessibility gap — see the new dedicated `MEMORY.md`
entry below for the generalised lesson.

Re-ran `pnpm audit` (clean) and `pnpm outdated` (unchanged, same two
major-only entries). Reconfirmed the live keyboard Tab walk (link → zone,
in order, visible focus) and a real keyboard-drawn mark persisting inside
a fresh CI-matching container. Verified the live Fly deployment still
matches `origin/main` byte-for-byte on `/readme/` and structurally on `/`
(only the accumulated stroke data differs, as expected) — no drift.
`PROCESS.md` extended with an eighth pass
([`09283bf`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/09283bf)).
No code change, no redeploy — nothing this run touches runtime behaviour.

## Single most important next action

Not the last run (111h remaining at this run's start — plenty of runway).
No new self-administered angle is currently flagged. The clause-by-clause
technique has now covered `README.md`, `CLAUDE.md`, the Dockerfile,
`checks.yml`, and `readme.astro`; the CSS-property-literacy lens has
covered `global.css`'s one touch surface; `pnpm audit`/`outdated` is
clean; a fresh `html-validate` pass is clean except the one confirmed
tool-limitation above. A future run could try Lighthouse (never run on
this repo), or just re-check `pnpm audit`/`outdated` again after enough
time has passed. Only write `reflections/crit-8.md` and do the doctrine's
finishing steps on whichever run the next prompt calls "last" for this
cutoff.
