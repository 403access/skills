# 04 — Prompt patterns

This chapter catalogues what the corpus actually contains. Every pattern is
quantified and illustrated with a sanitized example. Nothing here is a generic
prompting tip; if a pattern is listed, it appears in the data at least a dozen
times.

## 4.1 The signal table

Share of the 3,784 human prompts:

| Signal | Share | Count |
| --- | ---: | ---: |
| Under 60 characters | 47.5% | 1,798 |
| Commit ritual ("stage and commit…") | 14.9% | 565 |
| Bare continuation ("yes", "ok", "continue") | 9.4% | 356 |
| Vague scope ("everything", "stuff", "properly") | 10.1% | 382 |
| No acceptance criteria | 80.5% | 3,046 |
| Contains a path | 14.7% | 556 |
| Contains acceptance language | 19.5% | 738 |
| Contains constraints (only / don't / nothing else) | 13.1% | 496 |
| Structured (numbered/lettered/bulleted) | 4.9% | 185 |
| Context dump (>2 kB / JSON / HTTP) | 5.4% | 204 |
| Correction / pushback | 4.5% | 170 |
| Dangling "it/this/that" | 4.3% | 163 |
| Restart/reload ritual | 1.5% | 57 |
| Meta-process ("did you…", "you forgot") | 2.1% | 79 |

## 4.2 Anti-patterns

### A1 — The bookkeeping turn (565 prompts, 14.9%)

The most common *task* in the corpus is not a task. It is:

> "stage and commit relevant changes" · "git commit rleevant changes" · "did you
> commit relevant changes?" · "commit all relevant changes if you didn't"

It occurs in **254 of 487 root sessions (52%)**. In ai-tools it is 23.7% of all
prompts (33.7% including restarts); in mailr 27.8%; in campus-assistant 21.5%.

Cost: one human turn, one model turn, one tool call, plus the risk of committing
the wrong scope (see the eu-news prompt *"commit only those files"*). The
behaviour is fully specified and never changes, yet it is re-issued hundreds of
times.

### A2 — The dangling reference (13.7% including continuations)

> "it is important that we never delete files." · "it's okay. add logs" ·
> "there are too many additional pagination buttons: the ones that select each
> page that is close to the current one." · "yes"

The referent lives only in the chat. If the session compacts, the referent can be
summarised away — which is exactly what happens in the 11.5% of root sessions
that compact.

### A3 — The late constraint (170 corrections, 4.5%)

Constraints that define the whole design arrive *after* an implementation:

> "it is important that we never delete files." *(archive-automation, after a
> sync implementation)*

> "you did some fixes by using an ignore comment (// eslint-disable-next-line) —
> i want you to not use that and solve it properly instead." *(eu-news)*

> "no, i want to always download the most recent … since we renamed the file we
> do not know whether it was downloaded or not." *(archive-automation)*

These are not model failures. They are requirements communicated in the wrong
order.

### A4 — Unmeasurable acceptance (80.5% of prompts have none)

> "make sure that everything works" · "make it so that …" · "fix all remaining
> lint errors" · "improve performance"

A human can interpret "everything works"; a model cannot. The result is a
plausible-looking change plus a follow-up prompt, which is why sessions with a
*structured* first prompt average 4.3 prompts and those without average 8.6.

### A5 — The raw dump (5.4%, 12 prompts > 100 kB)

The corpus contains 1.19 MB, 250 kB and 180 kB prompts: full API responses, full
HTTP header transcripts, full HTML pages, full stack traces.

> "quite stupid what you do because we already get the avatar from the wow api:
> {profile: {_links: …, id: …, name: …}}"

Dumps are not useless — sessions that start with a big payload actually finish in
*fewer* prompts (2.8 vs 8.9) — but they are expensive (209 k mean input tokens)
and they crowd out the actual request. The prompt above spends 99.9% of its
length on data and 0.1% on the instruction.

### A6 — The capability ask (57 restart prompts, plus GUI actions)

> "restart macos app" · "restart macos server and app" · "deploy iPhone app"

The agent cannot see or drive a GUI. These prompts either trigger a workaround or
burn a turn explaining the limitation. They appear 45 times in ai-tools alone.

### A7 — The frustrated fix (part of the 4.5% corrections)

> "congratulations, you made it worse!" · "what are you doing? do the lint changes
> now!" · "quite stupid what you do because…"

Emotion is legitimate; it just carries no diagnostic information. None of these
prompts says *what* got worse or *where*. The next turn is inevitably "what do
you mean?" or a blind retry.

## 4.3 Positive patterns found in the corpus

### P1 — The scoped research brief (wow-diary)

> "Research task (no code changes). In the repo `<path>`, find how zooming works
> in the 3D replay view and what work happens on zoom. Look at: — viewer/src/ui/
> components/Zoom…"

Deliverable, scope, explicit non-goal ("no code changes"), file anchors. One turn,
no rework.

### P2 — The lettered acceptance list (ai-tools)

> "add a command bar that allows to search through basically everything within
> this app. a) the search results must be prioritized by project > session >
> remaining stuff. b) it should be possible to add favorites c) the search …"

The only prompt in that project with three testable requirements. Lettered lists
are rare (4.9%) and they work.

### P3 — The artifact pointer (eu-news)

> "fix all remaining lint errors … i logged them at `<path>/lint-errors.txt`"

Instead of pasting 200 lines, the prompt names a file. The agent reads it, and the
transcript stays small. This is the correct answer to A5.

### P4 — Explicit non-goals (archive-automation, file_indexer)

> "do not change anything else" · "make sure you test the flow and everything that
> has to do it and nothing more" · "read-only" · "no code changes"

Constraints are present in only 13.1% of prompts, and sessions whose first prompt
contains one average 4.7 prompts instead of 9.0.

### P5 — The schema prompt (scratch/temp, 79 sessions)

The automated digest jobs pass a fixed taxonomy and an output schema. Result: one
turn per job, zero corrections, 49.4% acceptance-signal rate. This is what
"prompt as interface" looks like.

### P6 — The verification step (eu-news, campus-assistant)

> "did you test what happens if there are already files existing locally?" ·
> "in the 3d view it is okay to provide different angles … or a freely movable
> option is required as well"

Verification prompts appear in only 45 of 3,784 prompts. When they appear, they
usually catch a real gap — which means verification was missing from the original
request.

## 4.4 What the data says about effect

First-prompt signal vs. session outcome (root sessions only; observational, ±):

| First prompt has… | Sessions | Mean prompts | Rework rate | Mean assistant turns |
| --- | ---: | ---: | ---: | ---: |
| Structure (list) | 96 | **4.3** | **2.1%** | 72 |
| No structure | 390 | 8.6 | 7.7% | 165 |
| Constraints | 135 | **4.7** | 3.7% | 94 |
| No constraints | 351 | 9.0 | 7.7% | 167 |
| Paths | 113 | **6.2** | 4.4% | 125 |
| No paths | 373 | 8.3 | 7.2% | 153 |
| Acceptance language | 193 | 7.8 | **4.7%** | 165 |
| No acceptance language | 293 | 7.8 | 7.8% | 135 |
| Large payload | 86 | **2.8** | **1.2%** | 48 |
| No payload | 400 | 8.9 | 7.8% | 168 |
| Terse (< 60 chars) | 70 | 5.2 | 2.9% | 91 |
| Not terse | 416 | 8.2 | 7.2% | 156 |

**Read this table carefully.** These are single-factor comparisons with no
control for task size:

- *Payload* and *terse* look great because they are used for small, self-contained
  jobs. They are not evidence that dumping or terseness is generally better.
- *Structure*, *constraints* and *paths* reduce loop length and rework, and the
  effect survives across project sizes. This is the most actionable signal.
- *Acceptance language alone* does not shorten the loop; it halves the rework rate
  (4.7% vs 7.8%). It changes *quality*, not *length*.

The honest summary: **specificity reduces loops; structure reduces rework;
neither helps if the task is genuinely large and the state lives only in chat.**

## 4.5 The cost of a turn

Each human prompt in this corpus is followed by ~20 assistant turns and ~24 tool
calls on average. A bookkeeping prompt is not "cheap because it's short": it still
triggers a full model step with the entire context attached. At a 98.3% cache hit
rate the marginal cost is low in dollars, but the marginal cost in *attention* and
*context* is not: every extra turn is another chance for the anchor to go stale.

That is why the recommendations focus on *removing turns* rather than on writing
longer prompts.

## 4.6 Timing is part of the pattern

44% of prompts are sent between 22:00 and 04:00. Those sessions are the longest
ones, and correction-style prompts are roughly twice as likely at night and early
morning (3.1–3.3%) as in the evening (1.6%). This is not a moral judgement; it is
a scheduling observation. Risky refactors and irreversible operations (delete,
migrate, deploy) should not be started at 01:40 with a four-word brief.
