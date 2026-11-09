# 03 — What was asked, directory by directory

This chapter answers the first question: **what did I actually ask for?** It goes
project by project, in descending order of root-session volume, and describes
(a) the domain, (b) the dominant request types, (c) how the prompts were shaped,
and (d) one representative prompt rewritten as a brief.

All quotes are sanitized: client and institution names are codenames, paths are
`<path>`, and long pastes are cut at one or two sentences.

## 3.1 eu-news — the deepest iterative build

**Domain:** an EU-affairs news platform. Next.js monorepo, Bun, Drizzle/SQLite,
i18n, a hemicycle visualisation of MEPs, a chat/agent layer with MCP, and data
pipelines that mirror news sources into a local database.

**65 root sessions, 839 prompts, 12.9 prompts per session, 30 of 65 sessions
compacted the context window (83 compaction events).**

| Primary intent | Share of prompts |
| --- | ---: |
| conversational / continuation | 34.2% |
| commit / VCS | 16.1% |
| new feature | 14.7% |
| bug fix | 11.6% |
| UI / design | 9.1% |
| refactor | 7.0% |

**What was asked.** Four repeating streams:

1. **Build-error whack-a-mole.** Next.js 16 prerender failures, `generateMetadata`
   in dynamic routes, Turbopack warnings, lint errors. Session titles like
   *"Resolving Next.js build issue with generateMetadata"*, *"Bun build fix"*,
   *"Next.js build fails due to dynamic metadata in /topics"*.
2. **Page-level UI iteration.** The hemicycle, MEP list, filters, sidebars,
   chart responsiveness, sort/search rows.
3. **Structural refactors.** Splitting `transforms.ts`, moving `i18n` and `db`
   into packages, migrating to TanStack Query, extracting scripts.
4. **Feature builds.** Chat page, MCP access with rate limits, story pipeline,
   video rendering, marketplace stories.

**How it was shaped.** Path-dense (23.5% of prompts contain a path) but very
short: median 5 prompts per session is misleading — the mean is 12.9 and 21
sessions exceed 10 prompts. The typical rhythm is:

> tweak → "stage and commit all relevant changes" → next tweak → build error dump →
> "fix" → "stage and commit" …

**What it cost.** 83 compactions, 32 M input tokens, and a high tool-error rate
(242 errors, mostly edit-anchor misses). The context dies long before the work
does. This is the project where "one thread per task" would pay off most.

**Representative prompt (verbatim, trimmed):**

> "create a hemicycle that uses the full height and width and shows the
> thumbnails of all MEPs as their seat dot."

**Rewritten as a brief:**

> **Goal** — `/meps` hemicycle: fill the viewport, one seat per MEP, seat dot
> replaced by the MEP's thumbnail.
> **Scope** — `apps/web/src/components/hemicycle/*`, reuse `useMeps()`; do not
> touch the API route.
> **Acceptance** — at 1440×900 and 390×844 the chart fills its container without
> scrollbars; 719 thumbnails load lazily; no layout shift > 0.1 CLS.
> **Verify** — `bun run build` + screenshot both viewports, attach to the reply.
> **Out of scope** — grouping, filters, tooltips.

## 3.2 campus-assistant — login, tabs and a marketing site

**Domain:** a university companion app: Expo/React Native client, Node server,
admin dashboard, quiz/learning tools, LMS integration, and a Docusaurus marketing
site.

**101 root sessions, 734 prompts, mean 7.3, 21 sessions above 10 prompts.**

| Primary intent | Share |
| --- | ---: |
| conversational / continuation | 31.6% |
| commit / VCS | 25.9% |
| new feature | 11.4% |
| UI / design | 8.2% |
| bug fix | 5.9% |

**What was asked.** Login and OIDC flows, tab/navigation restructuring, LMS
course content fetched headlessly, quiz screens, admin dashboard features,
theming/dark mode, i18n extraction, iOS build problems, and a stream of marketing
site edits (*"make docusaurus use the same design as the marketing website"*).

**How it was shaped.** A quarter of all prompts are bookkeeping. Several
*sessions* exist only to write a commit message — session titles
*"Commit message from code changes"* and *"Commit message from changes"* appear
repeatedly. The prompt *"commit all relevant changes if you didn't"* is a
standing instruction that was never actually made standing.

There are also the classic end-of-task checks: *"did you update docs?"*, *"git
commit. then, update marketing material (website)"* — verification arriving as a
separate prompt instead of as part of the definition of done.

**Representative prompt:**

> "animate how sounds are produced using that corresponding quiz ui. we would need
> to be able to access these type of 'learning tools' (if you will to say so, you
> might find better terminology for this)"

**Rewritten as a brief:**

> **Goal** — in the phonetics quiz, add a "sound production" learning tool:
> an animated sagittal view driven by the current phoneme.
> **Scope** — quiz screen + new `LearningTool` component; reuse the existing
> phoneme data; no server change.
> **Acceptance** — tool opens from the quiz card, animates 3 articulation stages,
> works offline, respects dark mode; reduced-motion users get a static diagram.
> **Naming** — pick a term and use it in UI copy, code and docs.
> **Verify** — Expo web screenshot + iOS simulator recording.

## 3.3 ai-tools — a dashboard for the agent itself

**Domain:** a macOS menu-bar + iOS app that observes OpenCode sessions: usage,
projects, diffs, live status, settings, and a companion server.

**96 root sessions, 451 prompts, mean 4.7. 33.7% of prompts are commit
bookkeeping — the highest large-project rate in the corpus. 61.4% of prompts are
under 60 characters.**

| Primary intent | Share |
| --- | ---: |
| commit / VCS | 31.5% |
| conversational / continuation | 31.3% |
| build / ops / restart | 15.3% |
| new feature | 9.8% |
| UI / design | 5.8% |

**What was asked.** Menu-bar dashboards, session/project detail views, global and
per-project graphs, mobile pairing and QR codes, live session status, pause/resume,
virtualised lists, NixOS VM management, system monitoring, and repeated
documentation updates.

**How it was shaped.** This is the corpus's purest micro-prompting style:

> "restart macos app" · "git commit rleevant changes" · "restart macos server and
> app" · "did you commit relevant changes?" · "group scripts if possible"

Two structural problems hide here:

1. **Capability mismatch.** "restart macos app" assumes the agent can drive a GUI
   it cannot see. It burns a turn and often triggers a workaround.
2. **Ritual turns.** One in three prompts is housekeeping, not product work. On a
   96-session project that is ~150 prompts spent on git and restarts.

The one well-structured request in the sample — *"add a command bar … a) search
priorities b) favorites c) sessions"* — shows the fix: lettered acceptance
criteria. That form appears in only 4.9% of all prompts.

**Rewrite of the worst offender:** instead of *"restart macos app"*, either give
the command (`make restart-app`) or state the boundary: *"rebuild and relaunch the
tray app; if you cannot interact with the GUI, print the exact command I should
run and stop."*

## 3.4 wow-diary — the marathon

**Domain:** a World of Warcraft addon that records combat/world state plus a
web replay viewer (2D/3D maps, portraits, timeline), a Rust model server, and a
landing page.

**36 root sessions, 896 prompts, median 11, mean 24.9 — the longest sessions in
the corpus. 17.4% of prompts contain a dangling "it/this/that".**

| Primary intent | Share |
| --- | ---: |
| conversational / continuation | 44.4% |
| commit / VCS | 26.2% |
| new feature | 11.3% |
| refactor | 5.0% |

**What was asked.** Capture spell casts, bag contents, item trades, entity
positions; render replay maps upright; add 3D race models; make timeline badges
clickable; fix addon loading; rebuild the viewer into modules.

**How it was shaped.** This is conversation-as-state. Examples:

> "weirdly the map for 2d and 3d replay view is not shown upright. basically would
> need to turn it 180 degrees. or … the position needs to be negated — you need to
> check which one."

> "congratulations, you made it worse!"

> "it is important that we never delete files." *(after the implementation)*

The corpus contains one 1.19 MB prompt here: an entire game-API JSON response
pasted with *"quite stupid what you do because we already get the avatar from the
wow api: {…}"*. That single prompt is larger than 99.7% of the corpus.

It also contains the best prompt in the corpus — a read-only research task with
an explicit file list, a deliverable, and a no-code-change constraint. That form
is rare but proves the capability was always there.

## 3.5 archive-automation — high stakes, high verification

**Domain:** PowerShell automation for a client archive: pull debtor data from a
credit API, export CSV, sync incrementally without deleting files, plus a Rust
file indexer.

**20 root sessions, 350 prompts, mean 17.5, 6 sessions compacted (25 events).
Correction rate 6.3% — the highest of the large projects.**

| Primary intent | Share |
| --- | ---: |
| conversational / continuation | 30.3% |
| commit / VCS | 20.9% |
| new feature | 12.3% |
| data / API | 11.1% |
| tests | 7.4% |
| bug fix | 6.9% |

**What was asked.** Change archive paths, rename outputs, decide when a file is
"already downloaded", add an API-to-staging folder, add tests with a mock server,
fix a SQL update that wrote the wrong customer value.

**How it was shaped.** Better than average on precision — 28% of prompts name a
path and 21% state acceptance — but with expensive late constraints:

> "it is important that we never delete files."

> "no, i want to always download the most recent, because since we renamed the
> file we do not know whether it was downloaded or not."

Constraints like "never delete" and "always fetch the newest" define the whole
design; delivered as corrections, they force rework. This project also has the
best test request in the corpus: *"make sure you test the flow and everything
that has to do it and nothing more"* — scope + boundary in one sentence.

## 3.6 scratch / temp — the prompt template that works

**79 automated sessions, 1 prompt each, generated by a news-digest pipeline.**

These are not human conversations. A script groups articles into stories and asks
a model to classify each one. The prompt is fully specified:

> "Decide what kind of story each one is: — 'report' … — 'decision' … — 'data' …
> — 'statement' … For each story give: 'kind' … 'body' …"

Result: 49.4% acceptance-signal rate (highest in the corpus), zero compaction,
zero corrections, one turn per job. It is the empirical proof of the thesis: when
the request is a template with a schema, the loop disappears.

## 3.7 The smaller directories

| Project | Root sessions | What was asked | Notable pattern |
| --- | ---: | --- | --- |
| mindme | 16 | cross-platform mind map of Gemini conversations, Jekyll build, ontology/grouping pipeline, Swift renderer | exploratory, 63.6% terse |
| unicode-zigs | 4 | Zig↔Swift FFI, sidebar/CLI work, refactoring in 20-prompt sessions | very few sessions, huge ones |
| mailr | 13 | Swift mail client, SQLite, biometrics, Docusaurus site | 72.2% terse, 27.8% commit turns |
| nixos | 9 | VM creation, ZFS mounts, deployment, Docusaurus site | highest acceptance rate (39.3%) |
| managr | 7 | invoicing, production/demo DB switching, Service-BW validator | multilingual data work |
| downloader | 6 | video downloader + marketing site, MP4/QuickTime compatibility | 35.7% commit turns |
| fitr | 5 | fitness app experiments | short bursts |
| one-offs | ~15 | registry scraping, VPN client, MDM monitoring, iOS simulator variants, FocusGuard | tooling probes |

Across the small projects the same three habits repeat: terse follow-ups, commit
rituals, and exploration without a written goal. The difference is that small
projects finish before the cost compounds.

## 3.8 Cross-directory summary

| Project | Mean prompts | Terse | Commit/restart | Acceptance | Path | Dangling ref | Correction |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| campus-assistant | 7.3 | 45.9% | 21.7% | 22.3% | 11.6% | 11.0% | 3.7% |
| ai-tools | 4.7 | 61.4% | **33.7%** | 15.5% | 2.9% | 13.3% | 2.2% |
| eu-news | **12.9** | 39.5% | 4.5% | 21.3% | **23.5%** | 12.5% | **6.2%** |
| wow-diary | **24.9** | 53.1% | 20.4% | 15.6% | 9.2% | **17.4%** | 3.5% |
| archive-automation | 17.5 | 37.4% | 5.7% | 20.9% | **28.0%** | 10.0% | **6.3%** |
| mailr | 4.2 | **72.2%** | 27.8% | 11.1% | 1.9% | 7.4% | 1.9% |
| mindme | 4.1 | 63.6% | 24.2% | 10.6% | 12.1% | 6.1% | 4.5% |
| scratch / temp | 1.0 | 10.1% | 0% | **49.4%** | 21.5% | 0% | 12.7%* |

\* The scratch corrections are automated retries, not human pushback.

Two clusters emerge:

- **Bookkeeping-heavy projects** (ai-tools, mailr, managr, campus-assistant):
  many short sessions, a third of prompts spent on git/restarts, low rework
  because each change is small.
- **Marathon projects** (eu-news, wow-diary, archive-automation): few sessions,
  huge prompt counts, high compaction, corrections concentrated around late
  constraints and visual bugs.

They fail differently, but both failure modes come from the same missing
artifact: a written request that survives the turn.

## 3.9 The four request archetypes

Every prompt in the corpus is one of four things:

1. **A spec** (what to build, with scope and acceptance) — 3.4% of prompts are
   mid-sized well-formed briefs; these finish in the fewest turns.
2. **A nudge** (continue, yes, do it, still broken) — 13.9% are bare
   continuations or correction-style nudges. The conversation holds the state.
3. **A chore** (commit, restart, run build) — 16.4%. Mechanical work left to chat.
4. **A dump** (error output, API JSON, HTML, schema) — 5.4%, with 12 prompts above
   100 kB.

Improving prompting is mostly about moving mass from 2 and 3 into 1 — and giving
4 a stable home outside the chat.
