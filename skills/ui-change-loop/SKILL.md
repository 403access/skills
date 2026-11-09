---
name: UI Change Loop
description: Use for visual changes (layout, responsiveness, styling, animation, charts, maps). Requires a viewport matrix, a baseline, one visual concern per change, and before/after screenshots as the deliverable instead of "looks wrong" iterations.
---

# UI Change Loop

Visual tasks produced the most repeated corrections in the corpus: "the hemicycle
is not correctly drawn in full size mode", "the map is not upright", "tab bar
height seems too high". Each is a one-line complaint against an unstated baseline.

## Workflow

1. **Name the concern.** One visual property per change: size, alignment,
   orientation, colour, spacing, motion. If there are two, split them.
2. **Capture a baseline.** Screenshot (or DOM snapshot / computed styles) of the
   current state at the target viewports.
3. **Write the acceptance surface:**

   ```markdown
   Viewports:  1440×900, 1024×768, 390×844
   Baseline:   <screenshot path or "current dev server">
   Target:     <what must be observably different, per viewport>
   Invariants: <must not change: seat order, data, other pages, CLS budget>
   Evidence:   before/after screenshots + relevant computed style
   ```

4. **Change only the presentation layer.** Do not refactor data fetching to fix a
   layout.
5. **Verify at every viewport**, including the smallest and the empty state.
6. **Report**: before/after images, the property that changed, and anything that
   could not be checked (Safari, device-only behaviour).

## Rules

- **No "looks right on my screen".** The desktop layout is where these bugs hide:
  the corpus's hemicycle worked small and broke full-size.
- **Dark mode and reduced motion are acceptance criteria**, not follow-ups.
- **Charts/maps have data-shape edge cases**: 0 items, 1 item, 1000 items,
  long labels, RTL.
- **Animation needs a fallback**: if motion is essential, state what a
  reduced-motion user sees (static diagram is acceptable).
- **One concern per commit** so a visual regression can be bisected.

## When the agent cannot see the UI

If you cannot render the page, say so. Ask for a screenshot or run the dev server
and capture it with a headless browser if one is available. Do not guess what
"upright" means — ask for the 180° rotation vs negated-coordinate distinction
explicitly; the corpus shows both were plausible and the user had to decide.

## Acceptance template

```markdown
- [ ] 1440×900: <check>
- [ ] 390×844: <check>
- [ ] empty state: <check>
- [ ] dark mode: <check>
- [ ] reduced motion: <check>
- [ ] no layout shift in adjacent component
```
