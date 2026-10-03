# The Scroll

A shared ink drawing that only ever grows. Visit, and there's a blank strip
waiting at the right-hand edge of whatever everyone before you has drawn.
Leave one mark there — a line, a dot, whatever the brush does under your
hand — and it's part of the scroll from then on. Nobody can undo it,
including you.

## What good means here

Good, for this app, means **small on purpose**. Not small because it isn't
finished yet, but small as the actual design: one shared surface, one mark
per visit, nothing that scales past what a single SQLite file and a single
small machine can hold. Three things I read while deciding what that should
look like:

- Robin Sloan's
  [_An app can be a home-cooked meal_](https://www.robinsloan.com/notes/home-cooked-app/)
  argues that software built for a small, specific, known use doesn't need
  the affordances — accounts, growth, retention — that software built to
  scale needs. The Scroll has no login and no notion of "your" marks once
  they're made, because nothing here is trying to bring you back for a
  streak.
- Ben Hoyt's [_The small web is beautiful_](https://benhoyt.com/writings/the-small-web-is-beautiful/)
  argues for fewer moving parts as a virtue in itself, not just a
  constraint: one table, one process, one file on one volume. There's no
  queue, no cache, no second service.
- Hundred Rabbits'
  [description of their own practice](https://sourcehut.org/blog/2021-12-08-100-rabbits-interview/) —
  "if we can use less technology to solve any one task, we will" — is the
  standard I held the drawing itself to: one SVG path per mark, one write,
  no client-side framework.

What's **enforced**: a mark, once saved, is never edited or deleted (there
is no code path that can — see `CLAUDE.md`), and nor can a later one paint
over it, since every mark has to stay inside its own strip, soft edge and
all; every write is validated server-side regardless of what the client
sends (`spec/scroll.test.ts`); the page that shows the scroll works without
JavaScript, since drawing is the only part that genuinely needs a script;
and drawing itself doesn't require a pointer — the zone is a real focusable
control, and Enter or Space leaves a dot at its centre, the same shape a
stationary tap already produces.

What's **judged, not enforced**: nothing stops a visitor from reloading and
drawing a second mark, or a tenth. Enforcing "one mark per person" needs a
real notion of a person, which is next crit's job (multi-user identity, [All
at once](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/09-all-at-once/)).
Two visitors who load the page at the same moment are offered the same blank
strip; whoever saves second is told to reload and draw in the next one,
rather than drawing on top of the first. Refusing is the honest stopgap
until then. For now the scroll trusts you the way a paper one would: nothing
stops you picking up the brush twice, and not doing so is part of what the
piece asks of you.

What I deliberately **didn't build**: accounts, undo, a gallery of past
scrolls, likes, moderation tooling. Ink-wash painting tolerates the mark
that goes wrong, and a scroll that lets you take back a bad stroke stops
being a record of what actually happened.

## What's here now

The core interaction only: one growing SVG scroll, one `strokes` table, one
write path. It's one visitor's experience end to end — draw, reload, find
your mark still there — not yet the live one several people in the room at
once will get. That's next crit's work.
