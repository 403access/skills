# 01 — Methodology

## 1. Where the corpus comes from

OpenCode stores sessions, messages and parts in a SQLite database at
`~/.local/share/opencode/opencode.db`. The V2 tables are authoritative: every
legacy session (`session`, 477 rows) also appears in `session_v2` (761 rows), and
the V2 store contains strictly more messages (74,533 assistant messages vs 31,953
in the legacy mirror).

| Table | Rows | Used for |
| --- | --- | --- |
| `session_v2` | 761 | session metadata, model, tokens, cost, parent (subagent) link |
| `session_message` | 82,283 | user / assistant / system / compaction / idle events |
| `part` + `message` | 152,132 + 34,759 | legacy mirror, used only for cross-checking |
| `project` / `project_directory` | 53 / 7 | project roots and worktrees |

Extraction is read-only (`scripts/extract.mjs`, `node:sqlite`, ~7 s) and writes
three files under `data/`:

- `sessions.json` — one record per session with counters, tokens and per-prompt shapes
- `prompts.jsonl` — every user prompt (raw; gitignored)
- `tool-calls.jsonl` — one record per tool call (name, status, error message, input)

## 2. Why subagent sessions are separated

274 of the 761 sessions are children (`parent_id != null`), spawned by the
`task` tool. Their single "user" message is written by the agent, not by me.
Counting them as human prompts would inflate the corpus by 274 and contaminate
every stylistic statistic. **All prompt-level numbers in this study use the 487
root sessions / 3,784 human prompts.** Session-level totals include subagents and
are labelled as such.

## 3. Heuristic signals

The analyzer tags every prompt with boolean signals. These are regex heuristics,
not semantic judgements — they are deliberately conservative and documented so
the numbers can be audited or recomputed.

| Signal | Rule | Why it matters |
| --- | --- | --- |
| `terse` | trimmed length < 60 chars | micro-instruction |
| `payload` | > 2,000 chars, or starts with a JSON object, or contains an HTTP request dump | context dumping |
| `paths` | a filename with a known extension, or a slash-path | scope anchoring |
| `identifier` | backticked symbol | symbol-level anchoring |
| `acceptance` | should / must / make sure / ensure / expect / verify / so that / I want X to | falsifiable success |
| `constraint` | don't / only / without / avoid / keep / instead of / nothing else / exactly | guardrail |
| `structure` | numbered list, lettered list, or bullet list | decomposed request |
| `bareContinuation` | exactly yes / ok / continue / do it / next / looks good … | state carried by the chat |
| `correction` | starts with no / but / why / still / again / wrong / actually / instead, or contains "not working", "you made it worse", "still broken" | rework signal |
| `contextlessPronoun` | starts with it / this / that / they and mentions no file | dangling reference |
| `vagueScope` | everything / stuff / things / whatever / better / nicer / properly / etc. | unmeasurable scope |
| `commitRitual` | starts with stage and commit / git commit / commit … | bookkeeping turn |
| `restartRitual` | starts with restart / reload / rebuild | capability mismatch or ops turn |
| `metaProcess` | did you / have you / you forgot / you missed | process supervision |

Task labels are multi-label keyword rules (`scripts/taxonomy.mjs`) with a
priority order for the primary label: vcs → bug → refactor → test → ui → data →
ops → docs → research → feature → other. A prompt that says "fix the lint errors
and commit" is counted in both `bug` and `vcs`; its primary label is `vcs`.

## 4. Measured outcomes (proxies)

There is no ground-truth "task succeeded" label in the database. Instead the
study uses four observable proxies:

1. **Turns to finish** — number of human prompts in a session.
2. **Rework** — ≥ 2 correction-flagged prompts in one session.
3. **Context loss** — the session contains a `compaction` event.
4. **Intervention** — a prompt that asks for verification ("did you test…"),
   pushes back ("what are you doing"), or reports a regression.

All four are correlated with prompt quality, not caused by it. A session can be
long because the task is genuinely large. This is why §*Findings* reports both
directions and states the confounders.

## 5. Known limitations

- **Single user.** n = 1 person, 29 projects. It describes my habits, not
  developers in general.
- **Heuristic labels.** Regex cannot tell "make sure it works" (acceptance) from
  "make sure you don't break X" (constraint). Misclassification is roughly
  one-directional: recall is lower than precision, so absolute rates are floors.
- **Survivorship.** Abandoned sessions that never got a prompt or were deleted
  are absent; 31 sessions with auto-generated titles ("New session — …") and no
  follow-up are the visible tail.
- **Model drift.** The corpus spans several models (DeepSeek V4 Pro/Flash,
  GPT-5.6 Luna, local Qwen/Gemma, `big-pickle`). Behaviour changes with the model;
  per-model splits are in the dashboard but not interpreted causally.
- **Compaction counts** include subagent sessions; the root-only rate is 11.5%.
- **Timestamps** are local time; the weekly series uses UTC week numbers.

## 6. Reproducibility

```sh
node scripts/extract.mjs    # deterministic read of the local DB
node scripts/analyze.mjs    # deterministic given data/
```

`analysis/report.json` is committed so the site and dashboard can be rebuilt from
the repo without the database. It contains aggregates only. The sanitizer
(`publicText`, `publicPath` in `scripts/taxonomy.mjs`) runs before anything is
written to `analysis/`.
