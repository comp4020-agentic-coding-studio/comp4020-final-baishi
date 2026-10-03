# Your harness

The rules below are derived from `README.md`'s argument, not separate from
it: if a rule here doesn't trace back to a sentence there, it doesn't belong
in either.

## What the app must never do

- **Never delete or edit a saved mark.** `src/lib/db.ts` has no update or
  delete statement, and none should be added — not even for moderation. If
  a mark ever needs removing, that's a decision to argue for in
  `README.md` first, with a real mechanism (who can, and why), not a quiet
  admin route. Overpainting is erasing too: a new mark's path, halo
  included, stays inside its own zone (`zoneBounds` in `src/lib/layout.ts`).
- **Never require an account to draw or to view.** Identity, when it
  arrives (crit 9), should be the minimum that makes "multi-user" true —
  an anonymous per-visit token at most — never a login.
- **Never trust the client for anything `spec/` can check.** Path length,
  stroke width, request shape: validate in the data layer
  (`src/pages/api/strokes.ts`), the same place the promise is tested, not
  just in `draw.ts`.

## What every page holds to

- The page that shows the scroll (`/`) must render the existing marks and
  answer 200 with JavaScript disabled. Only the act of drawing needs a
  script — and within that, a pointer is never the only way in: the
  drawing zone is a real focusable control, not just a hit-tested shape,
  so Enter/Space works wherever a pointer does.
- `/readme/` always serves the current `README.md` in full, headings
  intact — `spec/invariants.test.ts` checks this; don't special-case it
  away.

## What a change must not break

- One SQLite table, one file, one volume. If a change needs a second
  service (a queue, a cache, a second database), that's a bigger decision
  than this file should wave through — raise it in `PROCESS.md` first,
  with the trade-off named.
- `pnpm check` and `pnpm check:evidence` pass before every commit. A red
  run never gets committed over.
- Every commit that changes behaviour has a test in `spec/` that would have
  failed without it, where the behaviour is the kind a test can hold —
  see `spec/scroll.test.ts` for the shape (persistence, validation,
  no-delete) established this crit.

## Left open on purpose

Real-time sync, multi-user identity and rate-limiting "one mark per
visitor" are not bugs to fix — they're next crits' scope, named as such in
`README.md`. Don't build ahead of the crit that's supposed to decide them;
a premature real-time layer built without the decision `README.md`
promises to record is exactly the kind of process the brief marks down.
