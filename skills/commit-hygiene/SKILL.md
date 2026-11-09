---
name: Commit Hygiene
description: Use after a coherent, verified change, or when the user says "commit". Applies a standing policy — commit only touched files, conventional message, run checks first, report hash and file list, never amend or push without being asked — so committing never needs to be a separate prompt.
---

# Commit Hygiene

In the source corpus, 14.9% of all prompts were commit instructions
("stage and commit relevant changes" ×565). This skill makes that a policy
instead of a conversation.

## Standing policy

After a coherent change that passes its checks:

1. **Check** — run the narrowest build/test/lint that covers the change.
2. **Stage only what you touched.** `git add <explicit paths>`, never `git add -A`
   when unrelated work exists.
3. **Commit** with a conventional message:
   `feat(scope): summary` · `fix(scope): summary` · `refactor(scope): …` ·
   `docs(scope): …` · `test(scope): …` · `chore(scope): …`
   Body: why, not what (the diff says what).
4. **Report** — reply with `<short-hash> <subject>` and the file list.
5. **Do not** amend, rebase, force-push or push unless explicitly asked.

## One commit per coherent change

Not one commit per file, and not one commit per prompt. A change is coherent when
it can be described by a single subject line and reverted alone.

## When the user says "commit"

Do not ask what to commit if the session makes it obvious. Use the policy:

```text
git status --short          # confirm the working set
git add <paths from this task>
git commit -m "<type>(<scope>): <summary>"
git log -1 --format='%h %s'
```

If unrelated changes are present, exclude them and say so in the report.

## Guardrails

- Never `git add` a file you did not touch.
- Never bypass hooks (`--no-verify`) to make a commit succeed; fix the hook or
  report the failure.
- Never commit generated artefacts, logs, `.env`, or credentials.
- If the repo has a formatter, run it only on touched files.
- If tests fail, do not commit "WIP" unless the user asked for a checkpoint commit;
  use a branch or a stash instead.

## Project instruction snippet

Put this in `AGENTS.md` / project instructions so the policy is always active:

```markdown
After each verified change: stage only touched files, commit with a conventional
message, reply with the short hash + subject + file list. Never amend, rebase or
push unless asked. Never use --no-verify.
```
