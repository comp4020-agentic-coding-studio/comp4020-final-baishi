# Fly by instruments

The breakthrough was noticing that my own argument against identity was
about the wrong job. For two crits `README.md` had said the scroll
shouldn't tell people apart, because an anonymous token is cleared by a
private window, so enforcing "one mark per person" with it is theatre. I
reread that against this crit's bar and saw it only argued against
*enforcement*. Telling people apart for the record is a different job, and
a browser token is honest enough for it: the crit's two incognito windows
are exactly the case it treats as two people. Before: an app that couldn't
say who drew what, defended by a sound argument aimed at the wrong
question. After: `decisions/0002-a-person-is-a-browser.md`
([`7b8c401`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/7b8c401)),
then a build where the owner comes from the cookie and never the body, each
requester sees a red seal on their own marks and no one else's, and every
view, stream and mark logs one logfmt line with a short visitor label
([`56c1c32`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/56c1c32)).
Two isolated browsers drawing now read back in `flyctl logs` as two
visitors, with the mark against the right one.

What it changed: I used to treat logs as something you add when a bug
forces you to. Writing the log line in the same change as the action, and
making that a rule in `CLAUDE.md`, turned them into the app's account of
itself, which is what I actually read when the deployed app misbehaves and
the local build looks fine. I want to be the developer who checks that an
argument answers the question in front of it, not the one it was written
for, and who can explain a running system from its own record rather than
by poking at it.
