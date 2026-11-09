---
name: Prompt Brief
description: Use when a coding request is vague, spans multiple files, or has more than one observable outcome. Turns a one-line ask into a six-field brief (goal, scope, constraints, acceptance, verification, out of scope) before any edit, and asks only blocking questions.
---

# Prompt Brief

A brief is the smallest artifact that survives a conversation. Write it before the
first edit, echo it back in one short block, then work.

## When to use it

- The request touches **more than one file**, or
- It has **more than one observable outcome**, or
- It is **irreversible** (delete, migrate, deploy, rename a public API), or
- You catch yourself guessing what "it" refers to.

For a single, obvious, reversible change, a terse instruction is fine. The corpus
shows terse prompts work well for small tasks; they fail when scope grows.

## Workflow

1. **Classify** the request: `one-change` or `brief-required` (rules above).
2. **Draft the brief** using the template. Fill only fields you can ground in the
   repo or the user's message.
3. **Ask at most two questions**, and only ones that block *all* progress. Never
   ask for information you can read from the code.
4. **Echo the brief** in 5–8 lines and state the first action.
5. **Execute.** If reality contradicts the brief, stop and update it instead of
   silently expanding scope.
6. **Close** with the evidence named in *Verification*.

## Template

```markdown
Goal:        <observable end state, one or two sentences>
Scope:       <files / packages to change; what must not be touched>
Constraints: <hard rules: never delete, no new deps, keep API, no suppressions>
Acceptance:  <falsifiable checks — each one can pass or fail>
Verify:      <commands, screenshots, tests, and what to paste as evidence>
Out of scope:<known adjacent work that must not be done now>
```

## Rules that come from evidence

- **Constraints first.** Sessions whose first prompt contains a constraint average
  4.7 prompts vs 9.0. Put "never delete", "no new dependencies", "do not touch X"
  in the brief, not in a later correction.
- **Structure reduces loops.** Lettered/numbered acceptance lists correlate with
  4.3 prompts vs 8.6 and 2.1% vs 7.7% rework.
- **Paths beat descriptions.** Name the file; do not describe where you think it
  is. A path is cheap and unambiguous.
- **Acceptance is not optional.** "Make sure everything works" is not a check. Use
  a command, a value, a screenshot, a test name.
- **Do not inflate.** Length is not quality. A six-line brief beats a 2,000-word
  brief; the corpus contains 1.19 MB prompts that still went wrong.

## Anti-patterns (observed in the source corpus)

| Instead of | Write |
| --- | --- |
| "make it work properly" | "the button must be disabled while a request is in flight (assert `disabled` in test `checkout.spec.ts`)" |
| "fix the errors" | "`bun run build` must exit 0; the 6 errors are in `build.log`" |
| "it is important that we never delete files" (after the change) | put it in *Constraints before the first edit* |
| "improve the UI" | viewport, baseline, and the one visual property that must change |
| "do the same as before" | name the file/symbol that defines "same" |

## Boundary contract

State what you cannot do. If a step needs a human (GUI click, credentials, a
physical device), print the exact command, say what result to expect, and stop.
Do not invent a workaround for an interface you do not have.

## References

- `references/prompt-lint.md` — ten questions to run before sending a brief.
- `references/brief-examples.md` — weak → brief rewrites from real sessions.
