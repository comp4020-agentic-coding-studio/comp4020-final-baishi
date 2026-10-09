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
  included, stays inside its own strip (`localBounds` in
  `src/lib/layout.ts`).
- **Never refuse a mark for arriving second.** The server places each mark
  in the blank strip at the moment it writes it, from strip-local
  coordinates (`decisions/0001-two-marks-at-once.md`). Placement and insert
  stay in one synchronous block, with no `await` between them.
- **Never require an account to draw or to view.** "One mark per visit"
  is judged, not enforced; see `README.md` before adding any identity.
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
  no-delete, placement, live delivery).

## Live updates

- Every saved mark reaches every open page through `/api/stream`
  (server-sent events, an in-process bus in `src/lib/live.ts`). The event
  id is the mark's row id, and reconnects replay from SQLite after
  `Last-Event-ID`: the database is the backlog, so don't add one. An
  error reply to a reconnect closes the EventSource for good, so the page
  opens a fresh one itself (`followStream` in `src/lib/scroll.ts`).
- The client renders marks by id and ignores ids it has already drawn; the
  stream and the POST response can both deliver the same mark.

## Decisions

A change to how the app behaves with several people at once gets a new
record in `decisions/` first, with the alternatives and their costs, and a
line in `README.md`.
