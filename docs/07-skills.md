# 07 — The resulting skills

Seven skills, each derived from a finding in [`05-findings.md`](05-findings.md) and
implemented as an OpenCode `SKILL.md` package. They are not prompt tips; they are
instructions the agent loads at the moment it needs them.

## The set

| Skill | Trigger | Problem it removes | Finding |
| --- | --- | --- | --- |
| [`prompt-brief`](../skills/prompt-brief/SKILL.md) | vague or multi-file request | loops caused by missing scope/acceptance | F2, F4 |
| [`done-evidence`](../skills/done-evidence/SKILL.md) | before claiming completion | unverified "done", suppression-comment fixes | F6 |
| [`change-scope`](../skills/change-scope/SKILL.md) | during a change | drive-by refactors, scope growth, review corrections | F4, F6 |
| [`context-packet`](../skills/context-packet/SKILL.md) | logs / schemas / HTML needed | 1.19 MB dumps, hidden instructions, compaction | F5 |
| [`ui-change-loop`](../skills/ui-change-loop/SKILL.md) | visual change | "looks wrong" iterations, missing viewport baseline | F4, F8 |
| [`commit-hygiene`](../skills/commit-hygiene/SKILL.md) | after a verified change | 565 bookkeeping prompts | F1 |
| [`session-checkpoint`](../skills/session-checkpoint/SKILL.md) | long session / milestone | compaction and stale anchors | F3 |

## Design principles

1. **Trigger-oriented descriptions.** The frontmatter `description` says *when* to
   use the skill, because that is all the model sees before loading it.
2. **One job per skill.** `prompt-brief` does not contain commit rules; that is
   `commit-hygiene`. Small skills compose.
3. **Evidence inside the skill.** Each one contains one or two lines from the
   corpus explaining *why* the rule exists. Rules with a reason survive; rules
   without one get ignored.
4. **Templates over prose.** Every skill has a copy-paste block (brief, evidence
   report, checkpoint, viewport matrix).
5. **No absolutes.** `prompt-brief` explicitly says terse prompts are fine for
   small tasks. The corpus showed terseness is not the enemy — ambiguity is.
6. **No hidden automation.** None of the skills pushes, deletes, deploys or amends
   without an explicit request.

## Install

Repo-local (recommended for this project):

```sh
./scripts/install-skills.sh --project     # → ./.opencode/skills
```

Global, for every project:

```sh
./scripts/install-skills.sh               # → ~/.config/opencode/skills
```

Or point OpenCode at the directory without copying:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "skills": ["./skills"]
}
```

Verify:

```sh
opencode --version
# in a session: /skills   (or ask the agent to list available skills)
```

## Pairing with project instructions

The skills cover behaviour; the project still needs its facts. Add a minimal
`AGENTS.md` to each repo:

```markdown
# Project facts
- Stack / package manager / test command:
- Build command:
- Things that must never change:
- Where logs and generated files go:
- How to restart the app (or: cannot be restarted by the agent, print the command)

# Working rules
- Load prompt-brief for multi-file work.
- Load done-evidence before saying "done".
- Load commit-hygiene after each verified change.
```

This is intentionally short. In the corpus, the projects with the most prompts
were not missing intelligence — they were missing a place to write down facts that
the chat had to repeat.

## How to extend

1. Add a new finding to `docs/05-findings.md` with a number and evidence.
2. Add a recommendation to `docs/06-recommendations.md`.
3. Create `skills/<id>/SKILL.md` with frontmatter, a workflow, a template and the
   evidence line.
4. Re-run `node scripts/analyze.mjs` after new sessions and see whether the
   problem shrank.
