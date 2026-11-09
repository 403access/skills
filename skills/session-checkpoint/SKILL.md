---
name: Session Checkpoint
description: Use in long-running sessions, at milestones, or before the context window is compacted. Writes a ten-line checkpoint (state, decisions, files, next step, open questions, verification) so work can resume in a fresh session instead of degrading a 90-turn thread.
---

# Session Checkpoint

Long threads decay. In the source corpus 11.5% of root sessions compacted the
context window, and the most common tool failure was editing a file whose contents
the model no longer had right (38% of all tool errors). A checkpoint is how you
restart cleanly without losing the work.

## When to write one

- After a milestone: build green + change accepted.
- When the thread passes ~15 human prompts.
- Before starting a risky refactor in the same session.
- Before you notice the conversation summarising earlier turns.
- When switching models or handing off.

## Template (ten lines)

```markdown
# Checkpoint — <project> — <date>

## State
<what works now, what does not>

## Decisions
<choices made and their reason — include rejected alternatives>

## Files
<files changed / files that matter, with one-line purpose each>

## Verification
<commands that passed, last known-good commit>

## Next
<the single next action, specific enough to start cold>

## Open questions
<things the user must decide>
```

Save it as `docs/checkpoints/<YYYY-MM-DD>-<slug>.md` (or `.md` next to the code
if the repo has no docs folder). Keep it in the repo so the next session — and the
next person — can read it.

## Resume protocol

1. Read the checkpoint, not the old transcript.
2. `git status` + `git log --oneline -5` to confirm reality matches the checkpoint.
3. Re-state the next action in one line and start.
4. If the checkpoint is wrong, correct it **first**, then work.

## Why not just continue

Continuing a long thread re-sends the entire history on every turn (in this corpus
the 98.3% cache hit rate makes that cheap in dollars but not in attention), and
compaction silently rewrites state. A fresh session with a checkpoint starts at
full fidelity and costs a fraction of the context.
