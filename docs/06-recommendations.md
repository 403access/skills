# 06 — Recommendations

Each recommendation below is tied to a finding, an intervention, and an expected
effect. The interventions are implemented as skills in [`../skills`](../skills)
so they act **inside the agent**, not as advice the human has to remember.

## R1 — Automate bookkeeping out of the conversation

**Finding:** F1 (14.9% of prompts, 54% of sessions).

**Do:** Adopt a standing commit policy in the project's `AGENTS.md`/instructions:
commit after each coherent change, conventional message, only touched files, never
`--no-verify`, print the hash and file list. Provide a restart script for GUI apps
so "restart the app" becomes one command.

**Skill:** [`commit-hygiene`](../skills/commit-hygiene/SKILL.md).

**Expected effect:** removes up to **565 prompts** (15%) and one turn per change in
the four bookkeeping-heavy projects. This is the highest-confidence saving in the
study.

---

## R2 — Write the brief before the first edit

**Finding:** F4 (structure halves loop length; constraints halve rework).

**Do:** For any request that touches more than one file or has more than one
observable outcome, write a 6-field brief *before* asking:

1. Goal (observable end state)
2. Scope (files/packages, and what must not change)
3. Constraints (hard rules: never delete, no new deps, keep API)
4. Acceptance (falsifiable checks)
5. Verification (commands / screenshots / tests to run)
6. Out of scope

This is ~60 seconds and replaces the median 3-prompt session with one.

**Skill:** [`prompt-brief`](../skills/prompt-brief/SKILL.md).

**Expected effect:** sessions whose first prompt has structure average 4.3 prompts
vs 8.6; constraints 4.7 vs 9.0. Applying briefs to even a third of the
non-structured sessions saves an estimated **400–800 prompts**.

---

## R3 — Move verification inside the task

**Finding:** F6 (80.5% of prompts have no acceptance; verification arrives as a
correction).

**Do:** End every brief with a definition of done that names the command and the
evidence: "run `bun run build` and `bun test`; paste the last 20 lines; attach a
screenshot at 1440×900 and 390×844; do not use suppression comments". Make "no
eslint-disable / @ts-ignore / `any`" an explicit constraint.

**Skill:** [`done-evidence`](../skills/done-evidence/SKILL.md).

**Expected effect:** acceptance language halves rework (7.8% → 4.7%), i.e. roughly
**80 fewer correction prompts** and 40 fewer rework sessions.

---

## R4 — Replace raw dumps with artifact pointers

**Finding:** F5 (204 dump prompts; 12 above 100 kB; 1.19 MB maximum).

**Do:** Write the error log, API schema, HTML page or JSON sample to a file in the
repo (or `/tmp`), then reference it: "the build output is in `build.log`; the API
schema is in `docs/api.json`; read them, quote the relevant lines, then plan". If
a dump is unavoidable, precede it with a one-line instruction and a question.

**Skill:** [`context-packet`](../skills/context-packet/SKILL.md).

**Expected effect:** keeps the transcript small and the instruction visible; the
corpus's own best example (`lint-errors.txt`) is already this pattern. Biggest
beneficiary: eu-news (46% of its sessions compact).

---

## R5 — Give UI changes an acceptance surface

**Finding:** F4 + F8 — visual bugs are the most repeated correction class in
eu-news ("hemicycle is not correctly drawn in full size mode") and wow-diary ("the
map is not upright").

**Do:** For visual work, specify the viewport matrix, the baseline, and the
observable difference. One visual concern per turn. Require before/after
screenshots as the deliverable.

**Skill:** [`ui-change-loop`](../skills/ui-change-loop/SKILL.md).

**Expected effect:** converts "looks wrong" loops into a single testable change.
eu-news and wow-diary together contain 427 prompts in sessions with visual
corrections.

---

## R6 — Treat long sessions as a risk, not a virtue

**Finding:** F3 (11.5% of root sessions compact; 38% of tool errors are edit-anchor
misses; wow-diary averages 24.9 prompts).

**Do:** At every milestone (green build + accepted change), write a 10-line
checkpoint: current state, decisions, files touched, next step, open questions.
Start a fresh session from the checkpoint instead of continuing a 90-turn thread.

**Skill:** [`session-checkpoint`](../skills/session-checkpoint/SKILL.md).

**Expected effect:** fewer compactions (56 root sessions affected) and fewer stale
anchors. Also makes the work resumable by another model.

---

## R7 — Make the capability contract explicit

**Finding:** F7 (57 restart prompts; 45 in ai-tools; 189 interrupted tool calls).

**Do:** State what the agent can and cannot do at the top of a project: it cannot
click a GUI, it can run commands, it must print an exact command and stop when a
step needs a human. Provide `scripts/restart-app.sh` so the ask becomes a tool
call.

**Implemented in:** [`prompt-brief`](../skills/prompt-brief/SKILL.md) (the
"boundary" field) and [`change-scope`](../skills/change-scope/SKILL.md).

**Expected effect:** removes ~57 ritual prompts and reduces the interrupt rate.

---

## R8 — Keep scope guardrails on by default

**Finding:** F4, F6 — the eslint-disable incident, "do not change anything else",
"nothing more".

**Do:** Default rule: no drive-by refactors, no dependency changes, no formatting
of untouched files, no suppression comments, no new abstractions without a
request. If a fix requires touching something outside scope, stop and ask.

**Skill:** [`change-scope`](../skills/change-scope/SKILL.md).

**Expected effect:** fewer review corrections and smaller diffs. In the corpus,
13.1% of prompts already contain a constraint — and those sessions are half as
long.

---

## R9 — Schedule irreversible work away from 01:40

**Finding:** F9 (44% of prompts at night; correction rate 2× evening).

**Do:** No delete/migrate/deploy/large-refactor sessions after 22:00 without a
written brief. Use the night hours for exploration and small fixes, which is what
they already are.

**Expected effect:** hard to quantify from this corpus; the correlation is
consistent and the cost of a bad migration is high.

---

## R10 — Instrument prompts, not just sessions

**Finding:** the whole study exists only because the raw data was still in the
local database.

**Do:** Add a prompt-quality field to the ai-tools dashboard: brief completeness,
ritual share, correction rate per session. Track it weekly. The analyzer in
`scripts/analyze.mjs` is a working starting point.

**Expected effect:** makes regressions visible. The corpus already shows long-term
drift (the commit-ritual share rises sharply after September).

---

## Priority and expected total effect

| # | Recommendation | Confidence | Effort | Est. prompts saved |
| --- | --- | --- | --- | --- |
| R1 | Commit/restart automation | High | 1 h | 400–565 |
| R2 | Brief before edit | Medium-high | habit | 400–800 |
| R3 | Verification inside task | Medium | habit | 60–90 |
| R4 | Artifact pointers | Medium | habit | prevents context loss |
| R5 | UI acceptance surface | Medium | habit | 100–200 |
| R6 | Session checkpoints | High | 30 min | prevents 56 compactions |
| R7 | Capability contract | High | 30 min | ~57 |
| R8 | Scope guardrails | Medium | habit | fewer rework loops |
| R9 | Scheduling | Low-medium | policy | risk reduction |
| R10 | Instrumentation | High | 2 h | feedback loop |

Conservative total: **~650 prompts (17%)**; optimistic: **~1,300 (34%)**. The
estimate is deliberately a range — the brief-related savings depend on how often
the task is genuinely brief-shaped, which this corpus cannot prove.

## What I deliberately do not recommend

- **Writing longer prompts by default.** Length alone does nothing; the corpus has
  1.19 MB prompts that still needed corrections. Structure, not volume.
- **Banning terse prompts.** Terse prompts correlate with *shorter* sessions
  because they are used for small tasks. The rule is "terse is fine for one
  observable change; use a brief when scope or risk grows".
- **Switching models.** Tool-error rate is 1.0%; the bottleneck is the request, not
  the model. Model choice should follow cost/latency, not this data.
- **Adding more agent autonomy without guardrails.** The 189 interrupted calls show
  that autonomy without a scope contract gets yanked. Guardrails first.
