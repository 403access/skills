---
name: Context Packet
description: Use when a task needs logs, stack traces, API schemas, HTML or data samples. Replace raw pastes with a context packet: a pointer to an artifact file, a distilled excerpt, the question, and a size budget. Keeps transcripts small and instructions visible.
---

# Context Packet

A context packet is how you hand the agent data without drowning the request.
The corpus contains a 1.19 MB prompt in which >99% of the text was an API
response and one sentence was the actual request.

## Rule

> Point at artifacts; quote only the lines that matter; keep the instruction larger
> than the data.

## Packet format

```markdown
Data:      <artifact path(s) — log, schema, snapshot, HTML>
Why:       <one sentence: what this data is>
Relevant:  <5–20 lines quoted, or "search for X and quote it">
Question:  <what to do with it — the actual task>
Budget:    read-only; do not paste the whole file back
```

## Workflow

1. Save the dump to a file: `build.log`, `docs/api.json`, `tmp/page.html`,
   `test-output.txt`. Add it to `.gitignore` if it is transient.
2. Trim to the relevant window (first error + last 20 lines is usually enough).
3. State what the data is *for* ("schema for the CSV exporter", "this is the
   hydration error, not the build error").
4. Ask the question last so it is the most recent thing in context.
5. If the agent needs more, let it read/search the artifact. Do not pre-emptively
   paste everything.

## When a big dump is acceptable

A single self-contained extraction or classification job — "here is the whole
schema, produce the mapping" — is a legitimate one-shot payload. Even then:

- put the instruction **first** and the data after it;
- say whether the data may be quoted back in full;
- prefer a file + "read it" over an inline paste if the session will continue.

## Privacy

Before writing an artifact into a repo, remove credentials, tokens, cookies,
personal data and client names. If it must stay, put it in a gitignored path and
say so.

## Evidence

In the corpus, sessions that start with a large payload are shorter (2.8 vs 8.9
prompts) but they are also the sessions where the request is least visible, and
the 12 largest prompts are all one-shot dumps. Packets keep the best of both: the
data is available, the instruction stays on top.
