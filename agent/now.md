# now

## comp4020-final-baishi — deepening run, 2026-09-30, 159h to crit-8 cutoff

Second run on this deliverable. Worked the first run's own flagged next
action rather than starting a fresh sensor battery: the drawing zone
(`#zone-hit`) had no keyboard path at all — no `tabindex`, no `role`, no
keydown handler — and it was worse than a missing attribute, since the
`<svg role="img">` it sat inside suppresses any focusable descendant from
the accessibility tree regardless of what's added to it. Fixed properly
in [`fbb528d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/fbb528d):
dropped the svg's `role="img"` (it now holds real interactive content,
not a static image), made the zone a genuine `role="button"` focusable
control with a visible `:focus-visible` outline, and gave Enter/Space the
same submit path pointer input uses — a single dot at the zone's centre,
the same shape a stationary tap already produces (`draw.ts`'s
`submitMark` is now shared between both input paths).

A live axe-core sweep (not run since the very first commit) then found a
real, narrow gap of its own: two elements failed AA contrast (2.8–2.9:1
against the required 4.5:1) that axe itself only reported as
"incomplete," not a violation — the tagline link's color was dimmed by
its *parent's* `opacity` (which composites the whole subtree, so a
darker child color alone can't undo it — axe can't resolve this either),
and the drawing zone's "draw here" SVG text is a category axe's contrast
checker structurally can't evaluate at all. Found by hand-computing the
actual composited WCAG contrast ratio, not by trusting axe's clean-ish
read. Fixed in [`874ccac`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/874ccac):
a dedicated `--link` custom property at full opacity for the light-mode
link (dark mode's existing `--accent` already cleared 8.3:1, untouched),
and dropped the zone-prompt's own `opacity`. Both README.md and CLAUDE.md
updated to stop claiming drawing "needs a pointer" now that it doesn't.

Verified at every stage: `pnpm check` green (6/6) before each commit;
axe-core 0 violations after the contrast fix (the one remaining
"incomplete" node is the same SVG-text limitation, now confirmed by hand
to actually pass); a real `agent-browser` Tab walk on a rebuilt
container reached the zone in the right order with a visible focus ring,
and a real `Enter`/`Space` press persisted a mark across a fresh request.
Re-verified against the exact CI container (`docker build` +
`docker run --tmpfs /data` matching `.github/workflows/checks.yml`
verbatim) before trusting it, same as the first run. Redeployed via
`flyctl deploy --remote-only --ha=false -a comp4020-final-baishi`, and
confirmed live: a real Tab+Enter on `https://comp4020-final-baishi.fly.dev/`
reached the zone and left a mark that a fresh `curl` request still shows.
`PROCESS.md` extended with a new section citing both commits;
`pnpm check:evidence` clean except the still-correctly-deferred
`reflections/crit-8.md`. All 4 commits pushed to `origin/main`
(`ba4666b`). Repo still private — correct, harness-owned.

## Single most important next action

Not the last run for crit 8 (159h remaining at this run's start — plenty
of runway left in the 168h window). No new self-administered angle is
currently flagged: the keyboard gap named by the first run is closed, and
a first-ever live a11y sweep found and fixed what it could find. A future
run could try: `pnpm audit`/`outdated` (not yet run on this repo at all),
a 200%-zoom reflow check on the scroll's `#canvas-wrap` (untried), or a
real multi-mark pointer-drag test to confirm the zone correctly shifts
and the "since &lt;date&gt;" line stays accurate as more marks accumulate.
Only write `reflections/crit-8.md` and do the doctrine's finishing steps
on whichever run the next prompt calls "last" for this cutoff.
