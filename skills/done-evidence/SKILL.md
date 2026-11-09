---
name: Done Evidence
description: Use before claiming a coding task is complete. Defines done as verified evidence (build, typecheck, lint, tests, runtime check) instead of "should work", forbids suppression comments, and produces a short evidence report that names anything left unverified.
---

# Done Evidence

"Done" means *verified*, not *implemented*. This skill replaces "make sure
everything works" with a fixed evidence protocol.

## Definition of done

A task is done only when all four are true:

1. **It runs.** Build/typecheck pass for the touched package.
2. **It is checked.** The relevant test suite passes, or a manual check is
   documented with its output.
3. **It is honest.** No `@ts-ignore`, `eslint-disable`, `any` cast, deleted test or
   skipped assertion was used to get there.
4. **It is reported.** The reply states what was run, what passed, and what was not
   verified.

## Workflow

1. Detect the project's commands (`build`, `typecheck`, `lint`, `test`) from
   `package.json`, `Makefile`, CI config or docs. Prefer the narrowest command that
   covers the change, then widen if cheap.
2. Run them **after** the change, not before.
3. If a check fails, fix the cause. Do not disable the check.
4. Write the evidence block.
5. If something cannot be verified (no test exists, needs a device, network-only
   behaviour), say so explicitly and say what would verify it.

## Evidence block

```markdown
Changed:      <files>
Verified:     `bun run build` ✅  `bun test src/x.test.ts` ✅ (12 passed)
Runtime:      <manual check + observed output>
Not verified: <what, and why>
Suppressions: none
```

## Failure rules

- A test failure caused by the change is a **blocker**, not a note.
- A pre-existing failure is reported as pre-existing; do not "fix" it by editing
  the test.
- If verification requires credentials, hardware or a GUI you do not have, stop and
  print the exact command for the human. Do not simulate success.
- Never claim "fixed" from reading code. The corpus contains the counter-example:
  a lint task "solved" with `// eslint-disable-next-line`, which the user had to
  reject explicitly.

## Why this exists

In the source corpus only 19.5% of prompts contained acceptance language, and
verification arrived as a separate follow-up in 45 prompts. Sessions with explicit
acceptance had half the rework rate (4.7% vs 7.8%) — the check changes the result,
not the speed.
