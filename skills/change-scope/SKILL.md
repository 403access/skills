---
name: Change Scope
description: Use when making a code change to keep the diff inside the requested scope. Forbids drive-by refactors, dependency additions, formatting of untouched files, suppression comments and speculative abstractions, and defines when to stop and ask.
---

# Change Scope

Most review corrections in the source corpus were not wrong code — they were
*extra* code: unrelated refactors, ignore comments, renamed things, new
dependencies. This skill makes scope a contract.

## The contract

At the start of the work, state it in one line:

```text
Allowed:  <files/packages I will touch>
Forbidden:<files/packages that must not change>
Rules:    no new deps · no suppression comments · no formatting of untouched
          files · no renames outside scope · preserve public API
```

## Hard rules

1. **Touch only what the task requires.** If a helper must change, say so before
   changing it.
2. **No drive-by improvements.** A typo in an adjacent file stays unless it blocks
   the task. Mention it in the report instead.
3. **No suppression.** `eslint-disable`, `@ts-ignore`, `@ts-expect-error`,
   `--no-verify`, skipped tests are not fixes. If a check cannot pass honestly,
   stop and explain.
4. **No new dependency** without explicit approval. Prefer the standard library.
5. **No speculative abstraction.** Do not create a generic helper for one call
   site.
6. **Preserve behaviour outside the change.** If you must alter a shared function,
   list every caller affected.
7. **Diff hygiene.** Do not reformat whole files. Unrelated whitespace changes make
   review and `git blame` worse.

## Stop conditions

Stop and ask (with the question and the options) when:

- the smallest correct change requires touching a forbidden area;
- two existing patterns conflict and picking one changes behaviour elsewhere;
- a test must be changed to make the new behaviour pass;
- the task cannot be done without a dependency, credential or GUI.

## Report drift

If scope grows during the work, end with:

```markdown
Scope drift: <what grew and why>
Untouched but noticed: <issues worth a separate task>
```

This is not failure — it is how the next brief gets better. In the corpus,
unscoped work is what produced follow-ups like *"do not change anything else"* and
*"commit only those files"*.
