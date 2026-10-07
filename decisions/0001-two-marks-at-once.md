# 0001: two people drawing at once both keep their mark

Status: accepted, crit 9 ("All at once").

## Context

Every visitor draws in the one blank strip at the right-hand end of the
scroll. Until now, two people who loaded the page at the same moment were
offered the same strip, and whoever saved second got a 409: "someone else
drew in this strip first, reload for the next one". Their mark was gone.

With the scroll live (every open page sees every new mark within about a
second, over server-sent events), this stops being a rare race between two
strangers and becomes the ordinary case: a pod of five opening the app
together and all drawing in the first ten seconds. Something has to decide
what happens when two marks are aimed at the same strip.

`README.md` defines good as two promises: a mark is never erased (nor
painted over), and the scroll is a record of what actually happened, ink
that went wrong included. The decision has to keep both.

## Decision

**A mark's place on the scroll is decided when it's saved, not when it's
started.** The client sends its mark in coordinates local to the strip it
drew in; the server lays it into whatever strip is blank at the moment it
writes, in arrival order. If someone else finished first, your mark slides
one strip along, unchanged in shape, and the page tells you so. Nobody's
mark is refused for being second.

While you're mid-stroke, other people's marks still appear live, and may
land in the strip under your brush; yours moves along when you lift it.

## Alternatives

- **Refuse the second mark** (what crit 8 shipped). Simple and honest, but
  it throws away a mark someone actually made, which is the one thing a
  record of what happened shouldn't do. In a room of five it would refuse
  most of the room.
- **Claim the strip while drawing.** A `pointerdown` reserves the strip and
  everyone else is shown "someone is drawing here" and offered the next
  one. This is the option with presence in it, and it reads well in a
  demo. It costs a second kind of state (claims) that has to expire when a
  visitor wanders off mid-stroke or loses their connection, a write on
  every `pointerdown`, and a judgement about how long a claim lives. It
  also makes a stalled tab hold up the end of the scroll for everyone.
- **Let marks overlap.** Place each mark exactly where it was drawn and
  accept collisions. Cheapest of all, and it breaks "never painted over"
  outright.

## Costs of this choice

- Your mark can end up one strip (rarely more) to the right of where you
  drew it. The strips are identical blank paper, so the shape survives;
  only its neighbours change.
- For the seconds you're drawing, your preview can sit on top of a mark
  that just arrived from someone else. That's a preview, not saved ink, and
  it resolves when you lift the brush.
- The write API changed shape: a mark's coordinates are now strip-local.
  Absolute coordinates were never a public contract, but anything that
  posted them is now refused.

## What it deliberately leaves alone

- **Identity.** Placement by arrival order needs no notion of who drew
  what. "One mark per visit" stays judged, not enforced: an anonymous token
  is cleared by a private window, so enforcing it would be theatre, and the
  scroll trusts you the way a paper one would.
- **Presence.** Nobody sees who else is on the page. The marks arriving
  are the presence.
- **Reconnecting.** Covered by the transport rather than a separate
  decision: each event carries the mark's id, the browser resends the last
  one it saw when it reconnects, and the server replays everything after
  it from SQLite. The database is the backlog, so a dropped connection
  misses nothing.
