# Prompt lint — ten questions before sending

Run this when a request feels "obvious" (that is when it is usually underspecified).

1. **End state** — Can I write the observable result in one sentence without
   using "properly", "better", "nice" or "etc."?
2. **Scope** — Do I name the file, package or symbol? Do I name what must *not*
   change?
3. **Constraints** — Are there hard rules (never delete, no new deps, keep the API,
   no suppression comments, offline support)?
4. **Acceptance** — Is each check falsifiable by a command, test, value or
   screenshot?
5. **Verification** — Which command proves it? What evidence should be pasted back?
6. **Out of scope** — Which adjacent refactor am I explicitly *not* asking for?
7. **State** — Does the request depend on "it / this / the same"? If yes, restate
   the referent.
8. **Size** — Is this one change or three? Split it.
9. **Risk** — Is any step irreversible? If yes, require a dry run or a diff first.
10. **Boundary** — Does any step need a human or a GUI? Say so and ask for the
    command instead.

## Scoring

- 0–3 answered: this is a nudge, not a brief. Expect a loop.
- 4–6: workable for a small change.
- 7–10: brief-complete. This is where sessions end in one or two turns.

## Fast path

If the request is one file, one observable change, and reversible:

```text
<verb> <file>: <expected result>. Verify with <command>. Don't touch <x>.
```

That is enough. Do not turn a one-liner into a ceremony.
