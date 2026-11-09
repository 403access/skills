# 05 — Findings

Ten findings, each with the evidence behind it and a confidence note. "High"
means the number is directly measured; "medium" means it relies on heuristic
labels; "low" means it is a single-factor correlation that could be confounded.

---

## F1 — One in six prompts is bookkeeping, not work

**Evidence.** 565 of 3,784 prompts (14.9%) are commit/restart instructions
(620 including restarts), and commit instructions alone appear in 254 of 487
root sessions (52%; 54% including restarts). In ai-tools the share reaches
33.7%; mailr 29.6%; campus-assistant 25.9%. One campus-assistant session exists
solely to produce a commit message.

**Interpretation.** A fully specified, never-changing policy ("commit after each
coherent change, conventional message, only touched files") is being re-issued
hundreds of times. This is the cheapest 15% of the corpus to delete.

**Confidence:** high (exact string match + manual review of samples).

---

## F2 — The conversation is the state store, and that is the real problem

**Evidence.** 47.5% of prompts are under 60 characters; 13.7% are bare
continuations or dangling pronouns; the median session has 3 prompts but the mean
is 7.8, and 17.9% of sessions exceed 10 prompts. wow-diary averages 24.9 prompts
per session; eu-news 12.9.

**Interpretation.** The user is not writing instructions; they are maintaining a
mental model *inside the chat*. Every short "yes", "still broken" or "it is
important that we never delete files" is a state transfer. When the state is
lost, the loop restarts.

**Confidence:** high for the distribution, medium for the causal reading.

---

## F3 — Context loss is a first-class failure mode

**Evidence.** 56 of 487 root sessions (11.5%) contain a compaction event; in
eu-news **30 of 65 sessions (46%)** compact, 83 events in total. The dominant
tool error is "edit anchor not found / ambiguous" (359 of 940 errors, 38%),
followed by user interrupts (20%) and no-op edits (11.5%).

**Interpretation.** Long sessions don't just get expensive; they get *wrong*.
The model's memory of the file drifts, then the edit fails. Compaction is the
visible symptom; anchor misses are the invisible one.

**Confidence:** high.

---

## F4 — Structure and constraints cut the loop in half; acceptance cuts rework

**Evidence.** First-prompt signal vs. outcome, root sessions:

| Signal | Mean prompts | Rework |
| --- | ---: | ---: |
| Structured list | 4.3 | 2.1% |
| No structure | 8.6 | 7.7% |
| Constraint present | 4.7 | 3.7% |
| No constraint | 9.0 | 7.7% |
| Path present | 6.2 | 4.4% |
| No path | 8.3 | 7.2% |
| Acceptance present | 7.8 | 4.7% |
| No acceptance | 7.8 | 7.8% |

Acceptance language does not shorten sessions but halves the rework rate.

**Interpretation.** These prompts are doing different jobs. Structure and
constraints reduce *back-and-forth*; acceptance criteria reduce *wrong results*.

**Confidence:** medium (observational; task size is uncontrolled). The direction
is consistent across all five large projects.

---

## F5 — Big context dumps shorten the loop and shrink the signal

**Evidence.** 204 prompts (5.4%) contain a >2 kB dump; 12 exceed 100 kB, the
largest 1.19 MB. Sessions whose first prompt contains a dump average 2.8 prompts
instead of 8.9 and 209 k input tokens instead of 515 k — they are short, focused
jobs. But each of those few turns carries the whole dump, and in the 1.19 MB
prompt more than 99% of the text is API JSON while one sentence carries the
request.

**Interpretation.** Dumping is a legitimate strategy for a *self-contained
extraction job* (here is the schema, produce the mapping). It is a bad strategy
for a *conversation*, because the dump is re-sent on every turn and eventually
summarised away. The better pattern already exists in the corpus: `lint-errors.txt`
— a file the agent reads, not a paste.

**Confidence:** medium-high (counts exact; the outcome comparison is confounded by
task type).

---

## F6 — Verification is rare, late, and reactive

**Evidence.** Only 19.5% of prompts contain acceptance language, and only 45
prompts explicitly ask "did you test/check/verify". The corpus contains the
canonical failure: a "fix all lint errors" task where the agent used
`// eslint-disable-next-line` and the user had to reply *"i want you to not use
that and solve it properly instead"*. Similar "properly / not properly /
workaround" pushback appears 29 times.

**Interpretation.** The definition of done lives in the user's head. Each time it
is externalised, it is as a correction.

**Confidence:** high for the counts, medium for "reactive" (some verification may
happen without a prompt).

---

## F7 — Capability mismatches waste turns

**Evidence.** 57 restart/reload prompts and 45 explicit "restart macos app/server"
requests in ai-tools, where the agent cannot interact with the GUI. 189 tool calls
(20% of all errors) were interrupted or dismissed by the user — the human pulling
the plug on a wrong trajectory.

**Interpretation.** Some "agent failures" are actually "wrong interface" failures.
The fix is environmental (a restart script) or contractual ("if you cannot do X,
print the command and stop").

**Confidence:** high for counts; medium for the interpretation of interrupts.

---

## F8 — Projects fail in two distinct modes

**Evidence.** Cluster the per-project table:

- *Bookkeeping-heavy*: ai-tools (33.7% ritual, 4.7 mean prompts), mailr (29.6%,
  4.2), managr (26.7%, 4.3), campus-assistant (25.9%, 7.3). Small changes, many
  sessions, low correction rate.
- *Marathon*: wow-diary (24.9 mean prompts, 17.4% dangling references), eu-news
  (12.9, 46% compacted), archive-automation (17.5, 25 compactions, 6.3%
  corrections). Few sessions, huge threads, late constraints.

**Interpretation.** There is no single "better prompting" fix. Bookkeeping
projects need automation (commit policy, restart scripts). Marathon projects need
state management (briefs, checkpoints, fresh sessions).

**Confidence:** high (the two clusters are visible in the raw per-project table).

---

## F9 — Late night is marathon time, and corrections are twice as likely

**Evidence.** 44% of prompts fall in 22:00–04:00. Correction-style prompts are
3.1–3.3% in those hours vs 1.6% in the evening. The night sessions are the long
ones (wow-diary, eu-news).

**Interpretation.** Not "don't code at night" — rather, irreversible operations
and multi-file refactors should not be started late with a short brief.

**Confidence:** medium (correlation; hour-of-day is a proxy for task type).

---

## F10 — Templates beat willpower

**Evidence.** The 79 automated digest sessions (one prompt each) have the highest
acceptance-signal rate in the corpus (49.4%), zero compaction, zero rework and one
turn per job. The prompt is a fixed taxonomy plus an output schema.

**Interpretation.** When the request is generated from a template, every property
this study recommends appears automatically: scope, schema, acceptance, no
bookkeeping, no chat state. The skills in this repo are an attempt to give
interactive sessions the same properties.

**Confidence:** high for the observation, medium for generalisation (the task is
narrower than app development).

---

## What did *not* turn out to be the problem

- **Model quality.** 1.0% tool-call error rate; most errors are mechanical
  (anchors, interrupts), not reasoning failures.
- **Prompt length per se.** Terse first prompts correlate with *shorter* sessions
  (5.2 vs 8.2 prompts) because they are used for small tasks. Ambiguity, not
  brevity, is the problem.
- **The agent never asking.** It used the `question` tool 198 times in 487
  sessions — rare, but it exists. The bigger issue is that ambiguity usually gets
  guessed rather than asked about.

## The one-sentence conclusion

> I do not have a prompting problem; I have a **specification and state
> management** problem that shows up as 3,784 prompts — and the cheapest fixes are
> to automate bookkeeping, write the brief once, and keep verification inside the
> task instead of after it.
