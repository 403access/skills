/**
 * Shared taxonomy + heuristics for the prompt corpus analysis.
 * Every rule here is documented in docs/03-methodology.md — keep them in sync.
 */

export const TASK_RULES = [
  { id: "vcs", label: "Commit / VCS", re: /\b(git|commit|stage|push|branch|merge|rebase|revert|cherry[- ]pick)\b/i },
  { id: "bug", label: "Bug fix", re: /\b(fix|bug|broken|crash|error|fails?|failing|exception|not working|doesn'?t work|stack ?trace|nil error|regression|untested)\b/i },
  { id: "ui", label: "UI / design", re: /\b(ui|layout|design|color|colour|spacing|padding|margin|font|icon|responsive|mobile|desktop|viewport|theme|dark mode|align|component looks|css|tailwind)\b/i },
  { id: "refactor", label: "Refactor / restructure", re: /\b(refactor|reorgani[sz]e|restructure|split|extract|move|rename|decouple|modulari[sz]e|into multiple files|clean ?up)\b/i },
  { id: "test", label: "Tests / verification", re: /\b(test|tests|testing|coverage|unit|e2e|integration test|verify|assert)\b/i },
  { id: "docs", label: "Docs / marketing", re: /\b(docs?|documentation|readme|marketing|website copy|impressum|landing page|blog|changelog)\b/i },
  { id: "research", label: "Research / explain", re: /\b(research|investigate|explain|how does|how do|why does|compare|analy[sz]e|find out|look into|figure out|review)\b/i },
  { id: "ops", label: "Build / ops / deploy", re: /\b(deploy|build|ci\b|pipeline|docker|nixos|release|install|restart|server|metr[oe]|workflow|vm\b|provision)\b/i },
  { id: "data", label: "Data / API / DB", re: /\b(api|endpoint|database|db\b|sql|drizzle|schema|migration|scrape|csv|json|openapi|crawl|ingest|endpoint)\b/i },
  { id: "feature", label: "New feature", re: /\b(add|create|implement|build|support|introduce|make|set ?up|new)\b/i },
];

export const RULES = {
  terse: (t) => t.trim().length < 60,
  payload: (t) => t.length > 2000 || /\{\s*"/.test(t.slice(0, 4000)) || /Request URL \| Request method/.test(t),
  code: (t) => /```/.test(t),
  stackTrace: (t) => /\n\s*at\s+\S+\(.*:\d+:\d+\)/.test(t) || /Time:\s+\w{3} \w{3}/.test(t),
  paths: (t) => /(?:^|[\s("'`])(?:~|\.{0,2}\/)?[\w./-]+\.(?:tsx?|jsx?|mjs|cjs|py|rs|go|swift|kt|lua|sql|json|ya?ml|md|toml|css|html|ps1|sh)\b/.test(t) || /\b[\w-]+\/[\w./-]+/.test(t),
  identifier: (t) => /`[^`]+`/.test(t),
  acceptance: (t) => /\b(should|must|make sure|ensure|expect(ed)?|verify|check that|so that|acceptance|criteria|tests? (must|should)|i want .* to)\b/i.test(t),
  constraint: (t) => /\b(don'?t|do not|only|without|avoid|keep|instead of|nothing else|no changes|read[- ]only|don'?t touch|exactly)\b/i.test(t),
  structure: (t) => /(^|\n)\s*(?:\d+[.)]|[a-z][.)]|[-*•])\s+/m.test(t) || /\b[a-c]\)\s/.test(t),
  bareContinuation: (t) =>
    /^(yes|yep|yeah|ok(ay)?|sure|continue|go on|go ahead|proceed|do it|next|done|both|all|same|again|please do|thanks|thx|👍|looks good|lgtm)\b[\s.!?]*$/i.test(
      t.trim(),
    ),
  correction: (t) =>
    /^(no\b|nope|but\b|why\b|still\b|again\b|wrong\b|actually\b|instead\b|that'?s not|it'?s not|this is not|you (didn'?t|made|broke|missed))/i.test(
      t.trim(),
    ) ||
    /\b(not working|doesn'?t work|didn'?t work|still (broken|not|fails?|wrong|missing)|you made it worse|not correct|that'?s wrong|regression|same (issue|problem|error)|again)\b/i.test(
      t,
    ),
  contextlessPronoun: (t) =>
    /^(it|this|that|they|them|those|these|there)\b/i.test(t.trim()) &&
    !/(?:^|[\s("'`])[\w./-]+\.(?:tsx?|jsx?|mjs|py|rs|go|swift|lua|sql|json|md|css|html)\b/.test(t),
  questionOnly: (t) => /\?\s*$/.test(t.trim()) && t.trim().length < 200,
  vagueScope: (t) => /\b(everything|all (?:the )?(?:stuff|things)|some stuff|whatever|etc\.?|and so on|similar|stuff|things|better|nicer|modern|properly|correctly)\b/i.test(t),
  imperative: (t) => /^(add|create|make|build|fix|update|remove|delete|move|rename|refactor|implement|change|show|hide|use|set|write|split|extract|run|deploy|commit|stage|investigate|research|check|ensure|verify|document|test)\b/i.test(t.trim()),
  question: (t) => /^(how|what|why|where|when|which|who|can|could|should|do|does|did|is|are|was|were|have|has|would|will)\b/i.test(t.trim()),
  praise: (t) => /\b(perfect|great|awesome|nice|looks good|congrat|thank|amazing|love it|brilliant)\b/i.test(t),
  restartRitual: (t) => /^(restart|re-?start)\b/i.test(t.trim()) || /\brestart (the )?(macos|ios|server|app)\b/i.test(t),
  commitRitual: (t) => /^((please )?(stage and commit|git commit|commit)( all)?( relevant)?( changes?)?( if you didn'?t)?|did you commit)\b/i.test(t.trim()),
  metaProcess: (t) => /\b(did you|have you|are you sure|why didn'?t|why did you|you forgot|you missed)\b/i.test(t),
};

export function classifyTasks(text) {
  const hits = [];
  for (const rule of TASK_RULES) if (rule.re.test(text)) hits.push(rule.id);
  if (!hits.length) hits.push("other");
  return hits;
}

/** Priority ordering for a single primary intent label. */
const PRIMARY_ORDER = ["vcs", "bug", "refactor", "test", "ui", "data", "ops", "docs", "research", "feature", "other"];

export function primaryTask(hits) {
  for (const id of PRIMARY_ORDER) if (hits.includes(id)) return id;
  return "other";
}

export function signalFlags(text) {
  const out = {};
  for (const [k, fn] of Object.entries(RULES)) {
    try {
      out[k] = Boolean(fn(text));
    } catch {
      out[k] = false;
    }
  }
  return out;
}

export function projectLabel(directory) {
  const tmp = /^\/private\/var\/folders|\/private\/tmp|\/tmp\//.test(directory);
  if (tmp) return "scratch / temp";
  const parts = directory.split("/").filter(Boolean);
  let base = parts[parts.length - 1] ?? directory;
  if (/worktree/i.test(directory)) base = (parts[parts.length - 1] ?? base) + " (worktree)";
  return PROJECT_ALIASES[base] ?? base;
}

/** Public codenames for projects whose real names identify a client or institution. */
export const PROJECT_ALIASES = {
  "stuttgart-uni-assistant": "campus-assistant",
  "uni-stuttgart-app": "campus-assistant",
  file_indexer: "archive-automation",
  "container-becker": "archive-automation",
  "handelsregister-de": "registry-tool",
  "NinjaOne-Monitoring": "mdm-monitoring",
  "cisco-anyconnect": "vpn-client",
};

const SANITIZE = [
  [/crefo/gi, "CreditAPI"],
  [/container-becker/gi, "archive-automation"],
  [/\bILIAS\b/gi, "LMS"],
  [/C@MPUS/gi, "campus portal"],
  [/Uni(versity)? (of )?Stuttgart/gi, "the university"],
  [/uni-stuttgart[-\w]*/gi, "campus-assistant"],
  [/\bhandelsregister\b/gi, "registry"],
  [/NinjaOne/gi, "MDM"],
];

import { userInfo } from "node:os";
const USERNAME = userInfo().username;

/** Sanitize a path for publication: home → ~, known project names → codenames. */
export function publicPath(directory) {
  if (/^\/private\/var\/folders|\/private\/tmp|\/tmp\//.test(directory)) return "scratch/temp";
  let out = String(directory)
    .replace(/^\/Users\/[^/]+/, "~")
    .replace(/^~\/Desktop\/Desktop - MacBook Air von [^/]+/, "~/Desktop");
  for (const [real, alias] of Object.entries(PROJECT_ALIASES)) out = out.replaceAll(real, alias);
  return out.replace(/\/Users\/[^/]+/g, "~");
}

/** Sanitize a title/snippet before publishing it: no client, institution, path or URL. */
export function publicText(text) {
  let out = String(text ?? "");
  for (const [re, to] of SANITIZE) out = out.replace(re, to);
  out = out
    .replace(/\/Users\/[^\s"')]+/g, "<path>")
    .replace(/https?:\/\/[^\s)"]+/g, "<url>")
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "<email>")
    .replace(/\b[A-Fa-f0-9]{24,}\b/g, "<hash>")
    .replace(new RegExp(`\\b${USERNAME}\\b`, "gi"), "<user>")
    .replace(/\s+/g, " ")
    .trim();
  return out;
}
