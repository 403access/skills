# Weak → brief rewrites

Real requests from the source corpus (sanitized), rewritten as briefs. The names
are codenames; the pattern is what matters.

## 1. Visual bug

**Weak**

> "the hemicycle is not correctly drawn in the full size mode."

**Brief**

```markdown
Goal:        /meps hemicycle fills its container at every viewport, same seat geometry as the small view.
Scope:       components/hemicycle/* only; do not touch data fetching.
Constraints: no new dependencies; keep the existing seat ordering.
Acceptance:  at 1440×900 and 390×844 the SVG fits without scrollbars; seat count = 719; no CLS > 0.1.
Verify:      screenshots at both viewports + `bun run build`.
Out of scope:filters, tooltips, grouping.
```

## 2. Late constraint

**Weak** (arrives after the implementation)

> "it is important that we never delete files."

**Brief** (declared up front)

```markdown
Goal:        incremental sync of debtor CSV exports.
Scope:       sync module + tests; no changes to the export format.
Constraints: NEVER delete or overwrite an existing file; unknown state = refetch;
             dry-run mode must be available and must not write.
Acceptance:  running twice in a row produces no duplicate files, no deletions,
             and the second run logs "0 new".
Verify:      integration test against the mock server + `ls -R` before/after.
Out of scope:changing the archive folder layout.
```

## 3. Bookkeeping that should be policy

**Weak**

> "stage and commit relevant changes" (14.9% of all prompts in the corpus)

**Fix**

Put the policy in the project instructions once:

```markdown
After each coherent, verified change: stage only the files you touched,
commit with a conventional message, and reply with `<hash> <subject>` + file list.
Never include unrelated files. Never amend or push unless asked.
```

## 4. Vague performance request

**Weak**

> "improve performance"

**Brief**

```markdown
Goal:        replay list renders 5,000 items without jank.
Scope:       list component + selector; no data-model changes.
Acceptance:  first render < 200 ms, scrolling stays > 50 fps, memoised selector
             hit-rate logged in dev.
Verify:      before/after React profiler numbers pasted in the reply.
Out of scope:virtualisation of the timeline.
```

## 5. Capability mismatch

**Weak**

> "restart macos app"

**Fix**

```text
Rebuild and relaunch the tray app with `make restart-app`.
If you cannot interact with the GUI, print the command and stop.
```
