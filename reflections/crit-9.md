# All at once

The breakthrough was treating the decision record as a list of claims to
break, not a document to file. I wrote
`decisions/0001-two-marks-at-once.md` before any code
([`0a7ab5d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/0a7ab5d)),
and one of its sentences was that a dropped connection misses nothing: each
event's id is the mark's row id, so a reconnect replays from SQLite. The
specs proved the server did exactly that. But the page skipped any id below
the highest it had drawn, and your own POST response can arrive before
someone else's earlier mark comes through on the stream, so that mark
vanished from your screen. Before: a green replay test and an ADR whose
promise the browser broke. After: the page remembers every id it has drawn
([`a1cc5f2`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/a1cc5f2)).
The same sentence, pushed harder, found the second hole. The browser
reconnects on its own after a network error, but one 502 during a deploy
closed the stream for good, so the page now reopens it itself
([`632f838`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/632f838)).

What it changed: I used to think the hard part of real-time was the
transport. SSE took an afternoon. The hard part was the space between two
connections, a POST and a stream, that each behave correctly on their own
and disagree about order. Tests that exercise one connection at a time
can't see that. I want to be the developer who reproduces the awkward
timing on purpose: abort the stream, write from elsewhere, write from
here, restore it, then compare counts. A decision is only as good as the
worst ordering it survives, and I'd rather find that ordering myself than
have my pod find it at the crit.
