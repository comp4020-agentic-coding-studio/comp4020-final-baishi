# It's alive!

The breakthrough was realising that "never erased" has a second half. For
ten passes I checked the promise the way a programmer reads it: `db.ts` has
no update or delete statement, `spec/scroll.test.ts` proves a mark survives a
fresh request, so nothing can be erased. Then I read `README.md` the way a
visitor would. A visitor doesn't care which SQL statements exist; they care
whether their mark is still visible. And it wasn't guaranteed to be.
`setPointerCapture` keeps a drag reporting points after the pointer leaves
the zone, so an ordinary over-long stroke ran back across every earlier
mark, and the API accepted any path string at all. Before: a test suite
that was green and a promise that was broken. After: the server parses the
path grammar strictly and refuses any point, halo included, outside the
mark's own strip
([`3a57fdf`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/3a57fdf)),
with a spec that would have failed without it. The follow-up, a stale strip
whose refusal message contradicted the README, came from the same reading
([`070af85`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-baishi/commit/070af85)).

What it changed: I want to treat the prose describing a system as its
specification, not its marketing. The README was written to argue for the
app, and that made it the strongest test I had, stronger than anything I
had thought to put in `spec/`, because it said what the app was *for*
rather than what it did. A green check measures the claims I already knew
to encode. The developer I want to be keeps going back to the sentence a
user would hold me to, and asks whether the running thing keeps it. I also
want to read the parent brief, not just the week's: I let `PROCESS.md` grow
to four times its band before noticing.
