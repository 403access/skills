# Prompt Archaeology

A data-driven study of **3,784 prompts** I sent to a coding agent between June and
November 2026 — and the skills I built to write better ones.

Everything here comes from my own local OpenCode database
(`~/.local/share/opencode/opencode.db`): 761 sessions across 47 directories,
74,599 assistant turns and 91,061 tool calls. The corpus was read locally, raw
prompt text never leaves `data/` (gitignored), and published material only
contains aggregates, codenames and redacted snippets.

- **Marketing site / story:** <https://403access.github.io/skills/> · [`site/index.html`](site/index.html)
- **Full dashboard:** <https://403access.github.io/skills/dashboard.html> · [`site/dashboard.html`](site/dashboard.html)
- **The skills:** [`skills/`](skills/) (7 skills, installable)
- **Method:** [`docs/01-methodology.md`](docs/01-methodology.md)
- **Findings:** [`docs/05-findings.md`](docs/05-findings.md)
- **Recommendations:** [`docs/06-recommendations.md`](docs/06-recommendations.md)

## Headline numbers

| Metric | Value |
| --- | --- |
| Human prompts analysed | **3,784** |
| Sessions (root / subagent) | **487 / 274** |
| Projects | **29** |
| Date range | 22 Jun – 9 Nov 2026 (140 days) |
| Median prompts per session | **3** |
| Sessions with 10+ prompts | **17.9%** |
| Prompts under 60 characters | **47.5%** |
| Prompts that are pure bookkeeping (commit/restart) | **16.4%** |
| Prompts with acceptance criteria | **19.5%** |
| Sessions that needed context compaction | **11.5%** of root sessions |
| Tool call error rate | **1.0%** (58% of errors are edit-anchor misses or interrupts) |

## Reproduce

```sh
node scripts/extract.mjs     # local DB → data/ (gitignored)
node scripts/analyze.mjs     # data/ → analysis/report.json
node scripts/build-site.mjs  # report.json → site/assets/report.js
```

No dependencies: Node 24 (`node:sqlite`), no npm install.

## Install the skills

```sh
./scripts/install-skills.sh          # → ~/.config/opencode/skills
./scripts/install-skills.sh --project # → ./.opencode/skills
```

Or reference this repo directly in `opencode.jsonc`:

```jsonc
{ "$schema": "https://opencode.ai/config.json", "skills": ["./skills"] }
```

## Repository layout

```
scripts/          extraction, heuristics, analysis, site build
analysis/         report.json (aggregates) + derived tables
docs/             methodology, corpus overview, per-directory analysis,
                  patterns, findings, recommendations, skills guide
skills/           7 portable SKILL.md packages
site/             static marketing site + dashboard (GitHub Pages)
data/             raw corpus, gitignored (privacy)
```

## Privacy

Project names that identify a client or institution are replaced with codenames
(`archive-automation`, `campus-assistant`). Paths become `<path>`, URLs
`<url>`, usernames `<user>`. No raw prompt is published; the few quoted examples
are truncated to one or two sentences. The sanitizer lives in
`scripts/taxonomy.mjs` and is applied at report-build time, not at display time.
