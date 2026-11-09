#!/usr/bin/env node
/**
 * Turn data/ (raw corpus) into analysis/report.json (aggregates only).
 * Nothing in the report contains full prompt text: examples are truncated,
 * redacted (paths/emails/URLs) and limited to a handful.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { classifyTasks, primaryTask, signalFlags, projectLabel, publicPath, publicText, TASK_RULES } from "./taxonomy.mjs";

const CWD = process.cwd();
const read = (p) => readFileSync(resolve(CWD, p), "utf8");
const sessions = JSON.parse(read("data/sessions.json"));
const prompts = read("data/prompts.jsonl")
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l));
const toolCalls = read("data/tool-calls.jsonl")
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l));

mkdirSync(resolve(CWD, "analysis"), { recursive: true });

const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round = (n, d = 0) => Math.round(n * 10 ** d) / 10 ** d;

const bySession = new Map(sessions.map((s) => [s.id, s]));
const projectKey = (s) => (s.parentID ? bySession.get(s.parentID)?.directory ?? s.directory : s.directory);

const enrichedPrompts = prompts.map((p) => {
  const s = bySession.get(p.sessionID);
  const flags = signalFlags(p.text);
  const tasks = classifyTasks(p.text);
  return {
    ...p,
    directory: s?.directory ?? "unknown",
    projectKey: s ? projectKey(s) : "unknown",
    isSubagent: Boolean(s?.parentID),
    chars: p.text.length,
    flags,
    tasks,
    primary: primaryTask(tasks),
    first: s ? p.seq === s.prompts?.[0]?.seq : false,
  };
});

const promptBySession = new Map();
for (const p of enrichedPrompts) {
  if (!promptBySession.has(p.sessionID)) promptBySession.set(p.sessionID, []);
  promptBySession.get(p.sessionID).push(p);
}

const rootSessions = sessions.filter((s) => !s.parentID);
const subSessions = sessions.filter((s) => s.parentID);

// ---------- session outcomes ----------
const sessionOutcomes = sessions.map((s) => {
  const ps = promptBySession.get(s.id) ?? [];
  const first = ps[0];
  const corrections = ps.filter((p) => p.flags.correction).length;
  const rituals = ps.filter((p) => p.flags.commitRitual || p.flags.restartRitual).length;
  const terse = ps.filter((p) => p.flags.terse).length;
  const withAcceptance = ps.filter((p) => p.flags.acceptance).length;
  const withPaths = ps.filter((p) => p.flags.paths).length;
  const contextless = ps.filter((p) => p.flags.contextlessPronoun || p.flags.bareContinuation).length;
  let longestCorrectionChain = 0;
  let chain = 0;
  for (const p of ps) {
    if (p.flags.correction) {
      chain++;
      longestCorrectionChain = Math.max(longestCorrectionChain, chain);
    } else chain = 0;
  }
  return {
    id: s.id,
    directory: publicPath(s.directory),
    project: projectLabel(projectKey(s)),
    title: publicText(s.title),
    isSubagent: Boolean(s.parentID),
    prompts: ps.length,
    assistantTurns: s.assistantTurns,
    toolCalls: s.toolCalls,
    toolErrors: s.toolErrors,
    textBlocks: s.textBlocks,
    compactions: s.compactions,
    tokensIn: s.tokensInput,
    tokensOut: s.tokensOutput,
    cost: s.cost,
    durationMs: s.durationMs,
    corrections,
    rituals,
    terse,
    withAcceptance,
    withPaths,
    contextless,
    longestCorrectionChain,
    firstPromptChars: first?.chars ?? 0,
    firstPromptTasks: first?.tasks ?? [],
    firstPromptPrimary: first?.primary ?? "none",
    firstPromptFlags: first?.flags ?? {},
    firstPromptHasAcceptance: Boolean(first?.flags.acceptance),
    firstPromptHasPaths: Boolean(first?.flags.paths),
    firstPromptIsTerse: Boolean(first?.flags.terse),
    model: s.model?.id ?? "unknown",
    created: s.timeCreated,
  };
});

// ---------- aggregate helper ----------
function aggregate(list, keyOf) {
  const groups = new Map();
  for (const row of list) {
    const k = keyOf(row);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(row);
  }
  return [...groups.entries()]
    .map(([key, rows]) => {
      const totals = {
        key,
        sessions: rows.length,
        prompts: rows.reduce((a, r) => a + r.prompts, 0),
        assistantTurns: rows.reduce((a, r) => a + r.assistantTurns, 0),
        toolCalls: rows.reduce((a, r) => a + r.toolCalls, 0),
        toolErrors: rows.reduce((a, r) => a + r.toolErrors, 0),
        tokensIn: rows.reduce((a, r) => a + r.tokensIn, 0),
        tokensOut: rows.reduce((a, r) => a + r.tokensOut, 0),
        compactions: rows.reduce((a, r) => a + r.compactions, 0),
      };
      const totalPrompts = totals.prompts || 1;
      return {
        ...totals,
        medianPromptsPerSession: median(rows.map((r) => r.prompts)),
        meanPromptsPerSession: round(mean(rows.map((r) => r.prompts)), 1),
        promptsPerTurn: round(totals.prompts / (totals.assistantTurns || 1), 2),
        tokenEfficiency: round((totals.tokensOut || 0) / (totals.tokensIn || 1), 3),
        toolErrorRate: pct(totals.toolErrors, totals.toolCalls),
        correctionRate: pct(rows.reduce((a, r) => a + r.corrections, 0), totalPrompts),
        ritualRate: pct(rows.reduce((a, r) => a + r.rituals, 0), totalPrompts),
        terseRate: pct(rows.reduce((a, r) => a + r.terse, 0), totalPrompts),
        acceptanceRate: pct(rows.reduce((a, r) => a + r.withAcceptance, 0), totalPrompts),
        pathRate: pct(rows.reduce((a, r) => a + r.withPaths, 0), totalPrompts),
        contextlessRate: pct(rows.reduce((a, r) => a + r.contextless, 0), totalPrompts),
        reworkSessions: rows.filter((r) => r.corrections >= 2).length,
        compactionSessions: rows.filter((r) => r.compactions > 0).length,
        abandoned: rows.filter((r) => r.prompts > 0 && r.assistantTurns === 0).length,
        oneShot: rows.filter((r) => r.prompts === 1).length,
        longSessions: rows.filter((r) => r.prompts >= 10).length,
      };
    })
    .sort((a, b) => b.sessions - a.sessions);
}

const projects = aggregate(sessionOutcomes, (r) => r.project);
const projectsRoot = aggregate(sessionOutcomes.filter((r) => !r.isSubagent), (r) => r.project);
const directories = aggregate(sessionOutcomes, (r) => r.directory);

// ---------- prompt-level stats (human prompts only) ----------
const P = enrichedPrompts.filter((p) => !p.isSubagent);
const N = P.length;
const signalCounts = {};
for (const key of Object.keys(P[0]?.flags ?? {})) signalCounts[key] = P.filter((p) => p.flags[key]).length;

const primaryMix = {};
for (const p of P) primaryMix[p.primary] = (primaryMix[p.primary] ?? 0) + 1;

const taskMulti = {};
for (const rule of TASK_RULES) taskMulti[rule.id] = P.filter((p) => p.tasks.includes(rule.id)).length;

const sizeBuckets = [
  { label: "< 60 chars", min: 0, max: 60 },
  { label: "60–200", min: 60, max: 200 },
  { label: "200–600", min: 200, max: 600 },
  { label: "600–2k", min: 600, max: 2000 },
  { label: "2k–10k", min: 2000, max: 10000 },
  { label: "10k–100k", min: 10000, max: 100000 },
  { label: "> 100k", min: 100000, max: 1e15 },
].map((b) => ({
  ...b,
  count: P.filter((p) => p.chars >= b.min && p.chars < b.max).length,
  share: pct(P.filter((p) => p.chars >= b.min && p.chars < b.max).length, N),
}));

// quality vs turns: does specifying the first prompt shorten the loop?
function compare(flagName) {
  const yes = sessionOutcomes.filter((s) => s.isSubagent === false && s.firstPromptFlags?.[flagName]);
  const no = sessionOutcomes.filter((s) => s.isSubagent === false && s.prompts > 0 && !s.firstPromptFlags?.[flagName]);
  const stat = (xs) => ({
    sessions: xs.length,
    meanPrompts: round(mean(xs.map((x) => x.prompts)), 2),
    medianPrompts: median(xs.map((x) => x.prompts)),
    meanCorrections: round(mean(xs.map((x) => x.corrections)), 2),
    meanTurns: round(mean(xs.map((x) => x.assistantTurns)), 1),
    reworkRate: pct(xs.filter((x) => x.corrections >= 2).length, xs.length),
  });
  return { with: stat(yes), without: stat(no) };
}

const qualityImpact = {
  acceptance: compare("acceptance"),
  paths: compare("paths"),
  structure: compare("structure"),
  constraint: compare("constraint"),
  terse: { with: compare("terse").with, without: compare("terse").without },
  payload: compare("payload"),
};

// Context payload: shorter loops, but what does it cost?
function payloadImpact() {
  const root = sessionOutcomes.filter((s) => !s.isSubagent && s.prompts > 0);
  const withP = root.filter((s) => s.firstPromptFlags?.payload);
  const without = root.filter((s) => !s.firstPromptFlags?.payload);
  const stat = (xs) => ({
    sessions: xs.length,
    meanPrompts: round(mean(xs.map((x) => x.prompts)), 2),
    meanTurns: round(mean(xs.map((x) => x.assistantTurns)), 1),
    meanTokensIn: Math.round(mean(xs.map((x) => x.tokensIn))),
    meanDurationMin: round(mean(xs.map((x) => x.durationMs)) / 60000, 1),
    compactionRate: pct(xs.filter((x) => x.compactions > 0).length, xs.length),
    reworkRate: pct(xs.filter((x) => x.corrections >= 2).length, xs.length),
  });
  return { with: stat(withP), without: stat(without) };
}

const firstPromptOutcomes = {
  withAcceptance: compare("acceptance").with,
  withoutAcceptance: compare("acceptance").without,
  withStructure: compare("structure").with,
  withoutStructure: compare("structure").without,
  withPaths: compare("paths").with,
  withoutPaths: compare("paths").without,
};

// ---------- tools ----------
const toolTotals = {};
const toolErrors = {};
for (const t of toolCalls) {
  toolTotals[t.name] = (toolTotals[t.name] ?? 0) + 1;
  if (t.status === "error") toolErrors[t.name] = (toolErrors[t.name] ?? 0) + 1;
}
const tools = Object.entries(toolTotals)
  .map(([name, count]) => ({ name, count, errors: toolErrors[name] ?? 0, errorRate: pct(toolErrors[name] ?? 0, count) }))
  .sort((a, b) => b.count - a.count);

// error taxonomies
const errorSamples = toolCalls.filter((t) => t.status === "error").map((t) => (t.error ?? "").toLowerCase());
const errorBuckets = [
  { label: "edit anchor not found / ambiguous", re: /could not find oldstring|failed to find expected lines|multiple matches|found \d+ matches/ },
  { label: "no-op edit (identical strings)", re: /no changes to apply|identical/ },
  { label: "interrupted / dismissed by user", re: /interrupted|aborted|dismissed|cancelled|shut down/ },
  { label: "invalid tool arguments", re: /invalid arguments|missing key|expected .* received/ },
  { label: "file/path not found", re: /no such file|not found|does not exist|enoent|cannot find/ },
  { label: "command failed / exit code", re: /exit code|exit status|command failed|non-zero|permission denied|eacces/ },
  { label: "type / compile error", re: /type error|ts\d{4}|cannot find module|compile|syntaxerror|unexpected token/ },
  { label: "network / fetch", re: /fetch failed|econn|timeout|network|dns|socket|econnreset|status code/ },
  { label: "timeout / killed", re: /timed out|timeout|killed/ },
];
const errorTaxonomy = errorBuckets.map((b) => ({
  label: b.label,
  count: errorSamples.filter((e) => b.re.test(e)).length,
}));
errorTaxonomy.push({ label: "other", count: errorSamples.filter((e) => !errorBuckets.some((b) => b.re.test(e))).length });

// ---------- time series ----------
const weekKey = (ts) => {
  const d = new Date(ts);
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.floor((d - start) / (7 * 864e5)) + 1;
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};
const weeks = {};
for (const s of sessionOutcomes) {
  const w = weekKey(s.created);
  weeks[w] ??= { week: w, sessions: 0, prompts: 0, corrections: 0, assistantTurns: 0 };
  weeks[w].sessions++;
  weeks[w].prompts += s.prompts;
  weeks[w].corrections += s.corrections;
  weeks[w].assistantTurns += s.assistantTurns;
}
const timeSeries = Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week));

// hour-of-day
const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, prompts: 0 }));
for (const p of P) hours[new Date(p.ts).getHours()].prompts++;

// models
const models = {};
for (const s of sessions) {
  const m = s.model?.id ?? "unknown";
  models[m] ??= { model: m, sessions: 0, tokensOut: 0, cost: 0 };
  models[m].sessions++;
  models[m].tokensOut += s.tokens.output;
  models[m].cost += s.cost;
}

// ---------- redacted examples ----------
function redact(text) {
  return publicText(text).slice(0, 420);
}
const exampleSets = {
  terse: P.filter((p) => p.chars < 60 && !p.flags.commitRitual).slice(0, 8),
  ritual: P.filter((p) => p.flags.commitRitual).slice(0, 6),
  correction: P.filter((p) => p.flags.correction && p.chars < 220).slice(0, 8),
  contextless: P.filter((p) => p.flags.contextlessPronoun && p.chars < 160).slice(0, 8),
  good: P.filter(
    (p) =>
      p.chars > 150 &&
      p.chars < 1200 &&
      p.flags.acceptance &&
      p.flags.paths &&
      !p.flags.payload &&
      !/crefo|container-becker|ilias|d:\\dat|stuttgart/i.test(p.text),
  ).slice(0, 6),
  payload: P.filter((p) => p.chars > 50000).slice(0, 4),
};
const examples = Object.fromEntries(
  Object.entries(exampleSets).map(([k, arr]) => [
    k,
    arr.map((p) => ({
      chars: p.chars,
      project: projectLabel(p.projectKey),
      text: redact(p.text).slice(0, k === "payload" ? 240 : 420),    })),
  ]),
);

// ---------- theme keywords per project ----------
const STOP = new Set(
  `the a an and or of to in for with on at by from is are was were be been being it this that these those i you he she they we my our your as not no but if then than so such can could should would will just also into out up down over under about after before more most other some any all each every new add fix make use using create update remove change set get show hide move split refactor implement build run support need needs want wants please do does did done don't doesnt only when where what which who why how there here their its our yours`.split(
    /\s+/,
  ),
);
function keywords(texts, limit = 18) {
  const freq = {};
  for (const t of texts) {
    for (const w of t.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? []) {
      if (STOP.has(w)) continue;
      if (/crefo|ilias|container-becker|olivermolnar|stuttgart|ninjaone/.test(w)) continue;
      freq[w] = (freq[w] ?? 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

const projectThemes = projects.slice(0, 12).map((p) => {
  const texts = sessionOutcomes
    .filter((s) => s.project === p.key && !s.isSubagent && !/^New session - /.test(s.title))
    .map((s) => s.title);
  const firstPrompts = P.filter((x) => projectLabel(x.projectKey) === p.key && x.first && x.chars < 600).map((x) => x.text);
  return {
    project: p.key,
    titleKeywords: keywords(texts),
    promptKeywords: keywords(firstPrompts),
    exampleTitles: [...new Set(texts.map(publicText))].slice(0, 10),
  };
});

// primary intent mix per project (share of prompts)
const projectTaskMix = {};
for (const p of P) {
  const key = projectLabel(p.projectKey);
  projectTaskMix[key] ??= {};
  projectTaskMix[key][p.primary] = (projectTaskMix[key][p.primary] ?? 0) + 1;
}
for (const [k, mix] of Object.entries(projectTaskMix)) {
  const total = Object.values(mix).reduce((a, b) => a + b, 0);
  projectTaskMix[k] = Object.entries(mix)
    .map(([id, count]) => ({ id, count, share: pct(count, total) }))
    .sort((a, b) => b.count - a.count);
}

// ---------- headline numbers ----------
const totals = {
  sessions: sessions.length,
  rootSessions: rootSessions.length,
  subagentSessions: subSessions.length,
  prompts: N,
  assistantTurns: sessions.reduce((a, s) => a + s.assistantTurns, 0),
  toolCalls: sessions.reduce((a, s) => a + s.toolCalls, 0),
  toolErrors: sessions.reduce((a, s) => a + s.toolErrors, 0),
  tokensIn: sessions.reduce((a, s) => a + s.tokens.input, 0),
  tokensOut: sessions.reduce((a, s) => a + s.tokens.output, 0),
  tokensReasoning: sessions.reduce((a, s) => a + s.tokens.reasoning, 0),
  cacheRead: sessions.reduce((a, s) => a + s.tokens.cacheRead, 0),
  compactions: sessions.reduce((a, s) => a + s.compactions, 0),
  directories: new Set(sessions.map((s) => s.directory)).size,
  projects: projects.length,
  firstSession: Math.min(...sessions.map((s) => s.timeCreated)),
  lastSession: Math.max(...sessions.map((s) => s.timeCreated)),
};

const rootOutcomes = sessionOutcomes.filter((s) => !s.isSubagent);
const interrupted = toolCalls.filter((t) => /interrupt|abort|dismiss/i.test(t.error ?? "")).length;

const promptBucket = (min, max) => rootOutcomes.filter((s) => s.prompts >= min && s.prompts <= max).length;
const sessionShape = [
  { label: "1 prompt", count: promptBucket(1, 1), share: pct(promptBucket(1, 1), rootOutcomes.length) },
  { label: "2–3 prompts", count: promptBucket(2, 3), share: pct(promptBucket(2, 3), rootOutcomes.length) },
  { label: "4–9 prompts", count: promptBucket(4, 9), share: pct(promptBucket(4, 9), rootOutcomes.length) },
  { label: "10+ prompts", count: promptBucket(10, 1e9), share: pct(promptBucket(10, 1e9), rootOutcomes.length) },
];

const report = {
  generatedAt: new Date().toISOString(),
  totals,
  headline: {
    promptsPerSession: round(N / (rootOutcomes.filter((s) => s.prompts > 0).length || 1), 1),
    medianPromptsPerSession: median(rootOutcomes.filter((s) => s.prompts > 0).map((s) => s.prompts)),
    tersePromptShare: pct(signalCounts.terse, N),
    ritualPromptShare: pct(signalCounts.commitRitual + signalCounts.restartRitual, N),
    correctionShare: pct(signalCounts.correction, N),
    acceptanceShare: pct(signalCounts.acceptance, N),
    pathShare: pct(signalCounts.paths, N),
    contextlessShare: pct(signalCounts.contextlessPronoun + signalCounts.bareContinuation, N),
    payloadShare: pct(signalCounts.payload, N),
    structuredShare: pct(signalCounts.structure, N),
    toolErrorRate: pct(totals.toolErrors, totals.toolCalls),
    interruptedToolCalls: interrupted,
    compactedSessionShare: pct(sessions.filter((s) => s.compactions > 0).length, sessions.length),
    reworkSessionShare: pct(rootOutcomes.filter((s) => s.corrections >= 2).length, (rootOutcomes.length || 1)),
    oneShotShare: pct(rootOutcomes.filter((s) => s.prompts === 1).length, (rootOutcomes.length || 1)),
    longSessionShare: pct(rootOutcomes.filter((s) => s.prompts >= 10).length, (rootOutcomes.length || 1)),
    commitPrompts: P.filter((p) => p.flags.commitRitual).length,
    humanPrompts: N,
    untitledSessions: sessions.filter((s) => /^New session - /.test(s.title)).length,
    cacheHitRate: pct(totals.cacheRead, totals.tokensIn + totals.cacheRead),
    spanDays: Math.round((totals.lastSession - totals.firstSession) / 864e5),
    avgToolCallsPerSession: round(totals.toolCalls / sessions.length, 1),
  },
  sessionShape,
  signalCounts,
  signalShares: Object.fromEntries(Object.entries(signalCounts).map(([k, v]) => [k, pct(v, N)])),
  primaryMix,
  taskMulti,
  sizeBuckets,
  qualityImpact,
  payloadImpact: payloadImpact(),
  firstPromptOutcomes,
  projects,
  projectsRoot,
  directories,
  tools,
  errorTaxonomy,
  timeSeries,
  hours,
  models: Object.values(models),
  projectThemes,
  projectTaskMix,
  examples,
  sessions: sessionOutcomes,
};

writeFileSync(resolve(CWD, "analysis/report.json"), JSON.stringify(report));
console.log(
  `report.json written: sessions=${totals.sessions} prompts=${N} projects=${projects.length} tools=${tools.length}`,
);
console.log("headline:", report.headline);
