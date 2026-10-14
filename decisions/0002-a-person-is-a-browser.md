# 0002: a person is a browser, and only you know which mark is yours

Status: accepted, crit 10 ("Fly by instruments").

## Context

Until now the app could not tell two people apart: every mark was
anonymous, to the server as much as to anyone else. The final project has
to be multi-user in a stronger sense than "several people at once": two
people, each in their own browser, act on the shared scroll and the app
tells them apart. Someone reading the logs has to be able to say which of
two visitors drew which mark.

`README.md` already rules out accounts ("never require an account to draw
or to view") and says why enforcing "one mark per person" would be
theatre: an anonymous token is undone by a private window. That argument
is about enforcement. Telling people apart for the record is a different
job, and a browser token is good enough for it.

## Decision

**A person is a browser.** The first request from a browser gets a random
128-bit token in an `HttpOnly` cookie. The server never stores or logs the
token itself, only its SHA-256 hash; the first six hex digits are the
visitor's label (`visitor=3f2a9c`), which the page shows to that visitor
and the logs show to whoever runs the app.

What each person may **see**:

- every mark on the scroll, the same for everyone, with or without
  JavaScript;
- which mark is theirs, and nobody else's. Your own marks carry a small
  red seal, the way a painter signs a scroll. The server decides this per
  request, comparing each mark's stored visitor hash with the requester's:
  the page render, the POST response and each open stream all say `mine`
  only to the browser that drew it. No response ever carries another
  visitor's hash or label.

What each person may **change**: nothing, not even their own mark. The
only write is adding a new mark, and the server attributes it to the
cookie on the request, never to anything in the body.

The logs record who did what, one logfmt line per event on stdout, which
`flyctl logs` tails: a page view (and whether the visitor is new), a
stream opening and closing, a mark saved (its id and strip) and a mark
refused (and why). They carry the label, never an IP address or the token.

## Alternatives

- **Pseudonyms typed on arrival.** Friendlier in the logs and in a room,
  but it puts a form between a visitor and the brush, and two people can
  type the same name, so the server would still need a token underneath.
- **Accounts.** Ruled out by `README.md`: the scroll asks nothing of you
  but the mark.
- **Showing everyone who drew what.** Labels under every mark would make
  co-presence visible, but they turn a shared record into a list of
  contributors. The scroll is the record of what happened, not of who.

## Costs of this choice

- A private window, a second browser or cleared cookies is a new person.
  That's the honest limit of a browser token, and the crit's incognito
  windows depend on it.
- Marks drawn before this change have no visitor and carry no seal.
- A stolen cookie lets someone see which marks are yours, and nothing
  more: there is nothing a cookie lets you change.
