#!/usr/bin/env node
/**
 * Extract a privacy-safe working corpus from the local OpenCode database.
 *
 * Reads  : ~/.local/share/opencode/opencode.db (read-only)
 * Writes : data/sessions.json      session-level metadata + counters
 *          data/prompts.jsonl      every user prompt (raw, gitignored)
 *          data/tool-calls.jsonl   tool call records (name, status, session)
 *
 * Raw prompt text never leaves data/ (gitignored). Downstream scripts only
 * publish aggregates and redacted examples.
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const DB = process.env.OPENCODE_DB ?? join(homedir(), ".local/share/opencode/opencode.db");
const OUT = resolve(process.cwd(), "data");
mkdirSync(OUT, { recursive: true });

const db = new DatabaseSync(DB, { readOnly: true });

const sessions = db
  .prepare(
    `SELECT id, project_id, parent_id, directory, title, agent, model, cost,
            tokens_input, tokens_output, tokens_reasoning, tokens_cache_read,
            tokens_cache_write, time_created, time_updated, time_archived
       FROM session_v2`,
  )
  .all();

const projectRows = db.prepare(`SELECT id, name, worktree, time_created, time_archived FROM project`).all();
const projectDirRows = db.prepare(`SELECT project_id, directory, type, strategy FROM project_directory`).all();
const projectById = new Map(projectRows.map((p) => [p.id, p]));

const msgs = db
  .prepare(
    `SELECT id, session_id, type, seq, time_created, data
       FROM session_message
      ORDER BY session_id, seq`,
  )
  .all();

const prompts = [];
const toolCalls = [];
const bySession = new Map();

function bucket(id) {
  let b = bySession.get(id);
  if (!b) {
    b = {
      prompts: [],
      assistantTurns: 0,
      synthetic: 0,
      system: 0,
      compactions: 0,
      idle: 0,
      tokensIn: 0,
      tokensOut: 0,
      tokensReasoning: 0,
      cacheRead: 0,
      cost: 0,
      tools: {},
      toolErrors: 0,
      questions: 0,
      textBlocks: 0,
      editTurns: 0,
      durationMs: 0,
      firstTs: null,
      lastTs: null,
      finish: {},
    };
    bySession.set(id, b);
  }
  return b;
}

for (const s of sessions) bucket(s.id);

for (const m of msgs) {
  const b = bucket(m.session_id);
  let data;
  try {
    data = JSON.parse(m.data);
  } catch {
    continue;
  }
  b.firstTs ??= m.time_created;
  b.lastTs = Math.max(b.lastTs ?? 0, m.time_created);

  if (m.type === "user") {
    const text = typeof data.text === "string" ? data.text : "";
    if (!text.trim()) continue;
    b.prompts.push({ seq: m.seq, ts: m.time_created, text });
    prompts.push({ sessionID: m.session_id, seq: m.seq, ts: m.time_created, text });
    continue;
  }

  if (m.type !== "assistant") {
    if (m.type === "synthetic") b.synthetic++;
    if (m.type === "system") b.system++;
    if (m.type === "compaction") b.compactions++;
    if (m.type === "idle") b.idle++;
    continue;
  }

  b.assistantTurns++;
  b.tokensIn += data.tokens?.input ?? 0;
  b.tokensOut += data.tokens?.output ?? 0;
  b.tokensReasoning += data.tokens?.reasoning ?? 0;
  b.cacheRead += data.tokens?.cache?.read ?? 0;
  b.cost += data.cost ?? 0;
  if (data.finish) b.finish[data.finish] = (b.finish[data.finish] ?? 0) + 1;

  for (const block of data.content ?? []) {
    if (block.type === "text" && block.text?.trim()) b.textBlocks++;
    if (block.type === "tool") {
      const name = block.name ?? "unknown";
      b.tools[name] = (b.tools[name] ?? 0) + 1;
      const status = block.state?.status ?? "unknown";
      if (status === "error") b.toolErrors++;
      if (name === "question" || name === "ask") b.questions++;
      toolCalls.push({
        sessionID: m.session_id,
        seq: m.seq,
        name,
        status,
        error:
          status === "error"
            ? String(
                typeof block.state?.error === "string"
                  ? block.state.error
                  : (block.state?.error?.message ?? block.state?.error?.type ?? JSON.stringify(block.state?.error ?? "")),
              ).slice(0, 800)
            : undefined,
        input: block.state?.input ?? undefined,
      });
    }
  }
}

const outSessions = sessions.map((s) => {
  const b = bySession.get(s.id);
  const model = s.model ? JSON.parse(s.model) : null;
  const project = projectById.get(s.project_id);
  const promptLens = b.prompts.map((p) => p.text.length);
  return {
    id: s.id,
    projectID: s.project_id,
    projectName: project?.name ?? null,
    projectWorktree: project?.worktree ?? null,
    parentID: s.parent_id ?? null,
    directory: s.directory,
    title: s.title ?? "",
    agent: s.agent ?? null,
    model: model ? { id: model.id ?? null, providerID: model.providerID ?? null, variant: model.variant ?? null } : null,
    cost: s.cost,
    tokensInput: s.tokens_input,
    tokensOutput: s.tokens_output,
    tokensReasoning: s.tokens_reasoning,
    tokensCacheRead: s.tokens_cache_read,
    tokensCacheWrite: s.tokens_cache_write,
    timeCreated: s.time_created,
    timeUpdated: s.time_updated,
    archived: s.time_archived != null,
    userMessages: b.prompts.length,
    assistantTurns: b.assistantTurns,
    synthetic: b.synthetic,
    systemMessages: b.system,
    compactions: b.compactions,
    idle: b.idle,
    tools: b.tools,
    toolCalls: Object.values(b.tools).reduce((a, n) => a + n, 0),
    toolErrors: b.toolErrors,
    questions: b.questions,
    textBlocks: b.textBlocks,
    tokens: {
      input: b.tokensIn,
      output: b.tokensOut,
      reasoning: b.tokensReasoning,
      cacheRead: b.cacheRead,
    },
    durationMs: b.firstTs ? (b.lastTs ?? b.firstTs) - b.firstTs : 0,
    firstPromptChars: promptLens[0] ?? 0,
    totalPromptChars: promptLens.reduce((a, n) => a + n, 0),
    maxPromptChars: promptLens.length ? Math.max(...promptLens) : 0,
    finish: b.finish,
    prompts: b.prompts.map((p, i) => ({ i, seq: p.seq, ts: p.ts, chars: p.text.length })),
  };
});

writeFileSync(join(OUT, "sessions.json"), JSON.stringify(outSessions));
writeFileSync(join(OUT, "prompts.jsonl"), prompts.map((p) => JSON.stringify(p)).join("\n"));
writeFileSync(join(OUT, "tool-calls.jsonl"), toolCalls.map((p) => JSON.stringify(p)).join("\n"));
writeFileSync(
  join(OUT, "projects.json"),
  JSON.stringify(
    projectRows.map((p) => ({
      id: p.id,
      name: p.name,
      worktree: p.worktree,
      created: p.time_created,
      dirs: projectDirRows.filter((d) => d.project_id === p.id),
    })),
  ),
);

console.log(
  `sessions=${outSessions.length} prompts=${prompts.length} toolCalls=${toolCalls.length} -> ${OUT}`,
);
