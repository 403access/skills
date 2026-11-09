/* Prompt Archaeology — shared charts. No dependencies, no network. */
(() => {
  const R = window.REPORT;
  if (!R) return;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fmt = (n, d = 0) => Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const compact = (n) => (n >= 1e9 ? (n / 1e9).toFixed(1) + "B" : n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "k" : String(Math.round(n)));
  const pct = (n, d = 1) => Number(n).toFixed(d) + "%";
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  /* ---------- generic bars ---------- */
  function renderBars(host, rows, { max, cls = "", value = (r) => r.value, label = (r) => r.label, suffix = "" } = {}) {
    if (!host) return;
    const top = max ?? Math.max(...rows.map(value), 1);
    host.innerHTML = rows
      .map((r) => {
        const v = value(r);
        const c = typeof cls === "function" ? cls(r) : cls;
        return `<div class="bar-row" title="${escapeAttr(label(r))}: ${suffix ? fmt(v) + suffix : fmt(v)}">
          <span class="label">${label(r)}</span>
          <span class="bar-track"><span class="bar-fill ${c}" data-w="${(v / top) * 100}"></span></span>
          <span class="bar-val">${suffix ? fmt(v) + suffix : fmt(v)}</span>
        </div>`;
      })
      .join("");
    requestAnimationFrame(() => $$(".bar-fill", host).forEach((b) => (b.style.width = b.dataset.w + "%")));
  }

  /* ---------- column chart ---------- */
  function renderCols(host, items, { hi = () => false } = {}) {
    if (!host) return;
    const max = Math.max(...items.map((i) => i.value), 1);
    host.innerHTML = items
      .map(
        (i) => `<div class="col ${hi(i) ? "hi" : ""}" title="${escapeAttr(i.label)}: ${fmt(i.value)}">
          <span class="cval">${i.display ?? fmt(i.value)}</span>
          <span class="cbar" data-h="${clamp((i.value / max) * 100, 2, 100)}"></span>
          <span class="clab">${i.label}</span>
        </div>`,
      )
      .join("");
    requestAnimationFrame(() => $$(".cbar", host).forEach((b) => (b.style.height = b.dataset.h + "%")));
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------- grouped bars (impact) ---------- */
  function renderGrouped(host, rows, metric) {
    if (!host) return;
    host.innerHTML = rows
      .map((r) => {
        const a = r.without?.[metric] ?? 0;
        const b = r.with?.[metric] ?? 0;
        const max = Math.max(a, b, 1) * 1.1;
        return `<div class="bar-row" style="grid-template-columns:120px 1fr 44px 1fr 44px;margin-bottom:12px">
          <span class="label">${r.label}</span>
          <span class="bar-track"><span class="bar-fill" data-w="${(a / max) * 100}"></span></span>
          <span class="bar-val">${metric === "meanPrompts" ? a.toFixed(1) : a.toFixed(1) + "%"}</span>
          <span class="bar-track"><span class="bar-fill acc" data-w="${(b / max) * 100}"></span></span>
          <span class="bar-val">${metric === "meanPrompts" ? b.toFixed(1) : b.toFixed(1) + "%"}</span>
        </div>`;
      })
      .join("");
    requestAnimationFrame(() => $$(".bar-fill", host).forEach((b) => (b.style.width = b.dataset.w + "%")));
  }

  /* ---------- stacked bar ---------- */
  const TASK_COLORS = {
    vcs: "#e8452c",
    feature: "#1f4fe0",
    ui: "#0b7a5c",
    bug: "#b8860b",
    refactor: "#6b4c9a",
    test: "#2a9d8f",
    docs: "#8a8f98",
    research: "#c26d9b",
    ops: "#7a5c3e",
    data: "#0a7ea4",
    other: "#cfc8b8",
  };
  const TASK_LABELS = {
    vcs: "commit / vcs",
    feature: "new feature",
    ui: "ui / design",
    bug: "bug fix",
    refactor: "refactor",
    test: "tests",
    docs: "docs",
    research: "research",
    ops: "build / ops",
    data: "data / api",
    other: "conversational",
  };

  function renderTaskMix(host, mix, projects) {
    if (!host) return;
    host.className = "taskmix";
    host.innerHTML = projects
      .map((p) => {
        const rows = mix[p.key] ?? [];
        const segs = rows
          .map(
            (r) =>
              `<span title="${TASK_LABELS[r.id] ?? r.id}: ${r.share}%" style="width:${r.share}%;background:${TASK_COLORS[r.id] ?? "#999"}"></span>`,
          )
          .join("");
        return `<div class="tm-row"><span class="tm-label">${esc(p.key)}</span><span class="tm-track">${segs}</span></div>`;
      })
      .join("");
    const legend = $("#taskLegend");
    if (legend) {
      legend.innerHTML = Object.keys(TASK_COLORS)
        .map((k) => `<span><i style="background:${TASK_COLORS[k]}"></i>${TASK_LABELS[k]}</span>`)
        .join("");
    }
  }

  /* ---------- SVG helpers ---------- */
  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }
  function svg(w, h) {
    const s = svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: "100%", height: "auto", role: "img" });
    s.style.overflow = "visible";
    return s;
  }

  /* ---------- scatter ---------- */
  function renderScatter(host, projects) {
    if (!host) return;
    const W = 560, H = 330, L = 46, B = 34, T = 12, Rr = 12;
    const s = svg(W, H);
    const xMax = Math.max(...projects.map((p) => p.meanPromptsPerSession), 10) * 1.15;
    const yMax = Math.max(...projects.map((p) => p.terseRate), 50) * 1.15;
    const X = (v) => L + (v / xMax) * (W - L - Rr);
    const Y = (v) => H - B - (v / yMax) * (H - T - B);

    for (let i = 0; i <= 4; i++) {
      const y = Y((yMax / 4) * i);
      s.appendChild(svgEl("line", { x1: L, x2: W - Rr, y1: y, y2: y, class: "gridline" }));
      s.appendChild(Object.assign(svgEl("text", { x: L - 7, y: y + 3, "text-anchor": "end" }), { textContent: fmt((yMax / 4) * i) + "%" }));
    }
    for (let i = 0; i <= 4; i++) {
      const x = X((xMax / 4) * i);
      s.appendChild(svgEl("line", { x1: x, x2: x, y1: T, y2: H - B, class: "gridline" }));
      s.appendChild(Object.assign(svgEl("text", { x, y: H - B + 16, "text-anchor": "middle" }), { textContent: fmt((xMax / 4) * i, 0) }));
    }
    s.appendChild(Object.assign(svgEl("text", { x: W / 2, y: H - 4, "text-anchor": "middle" }), { textContent: "mean prompts / session" }));
    s.appendChild(Object.assign(svgEl("text", { x: 12, y: T + 4, transform: `rotate(-90 12 ${T + 4})`, "text-anchor": "end" }), { textContent: "terse share" }));

    const top = [...projects].sort((a, b) => b.sessions - a.sessions).slice(0, 6);
    for (const p of projects) {
      const c = svgEl("circle", { cx: X(p.meanPromptsPerSession), cy: Y(p.terseRate), r: clamp(3 + Math.sqrt(p.sessions), 4, 12), class: "dot" });
      c.appendChild(svgEl("title"));
      c.lastChild.textContent = `${p.key}: ${p.sessions} sessions · ${p.meanPromptsPerSession} mean prompts · ${p.terseRate}% terse`;
      s.appendChild(c);
    }
    const placed = [];
    top.forEach((p) => {
      let ly = Y(p.terseRate) - 9;
      while (placed.some((q) => Math.abs(q - ly) < 12)) ly += 12;
      placed.push(ly);
      s.appendChild(
        Object.assign(svgEl("text", { x: X(p.meanPromptsPerSession) + 8, y: ly, class: "dot-label" }), {
          textContent: p.key,
        }),
      );
    });
    host.innerHTML = "";
    host.appendChild(s);
  }

  /* ---------- timeline ---------- */
  function renderTimeline(host, weeks) {
    if (!host) return;
    // fill missing ISO weeks so gaps are visible instead of collapsed
    const byKey = new Map(weeks.map((w) => [w.week, w]));
    const isoKey = (d) => {
      const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      const day = date.getUTCDay() || 7;
      date.setUTCDate(date.getUTCDate() + 4 - day);
      const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      const week = Math.ceil(((date - start) / 864e5 + 1) / 7);
      return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
    };
    const filled = [];
    if (weeks.length) {
      const cursor = new Date(R.totals.firstSession);
      const end = R.totals.lastSession;
      while (cursor.getTime() <= end && filled.length < 80) {
        const k = isoKey(cursor);
        filled.push(byKey.get(k) ?? { week: k, sessions: 0, prompts: 0, corrections: 0, assistantTurns: 0 });
        cursor.setUTCDate(cursor.getUTCDate() + 7);
      }
    }
    weeks = filled.length ? filled : weeks;
    const W = 900, H = 230, L = 34, B = 26, T = 10, Rr = 8;
    const s = svg(W, H);
    const maxS = Math.max(...weeks.map((w) => w.sessions), 1);
    const maxP = Math.max(...weeks.map((w) => w.prompts), 1);
    const bw = (W - L - Rr) / weeks.length;
    const X = (i) => L + i * bw + bw / 2;
    const Y = (v, m) => H - B - (v / m) * (H - T - B);

    for (let i = 0; i <= 3; i++) {
      const y = T + ((H - T - B) / 3) * i;
      s.appendChild(svgEl("line", { x1: L, x2: W - Rr, y1: y, y2: y, class: "gridline" }));
    }
    weeks.forEach((w, i) => {
      const h = H - B - Y(w.prompts / 10, maxP / 10);
      s.appendChild(svgEl("rect", { x: L + i * bw + bw * 0.25, y: H - B - h, width: bw * 0.5, height: h, fill: "#dcd5c4" }));
    });
    const line = (key, scale, cls, color) => {
      const pts = weeks.map((w, i) => `${X(i)},${Y(w[key] * scale, maxS)}`).join(" ");
      s.appendChild(svgEl("polyline", { points: pts, fill: "none", stroke: color, "stroke-width": 1.8 }));
      weeks.forEach((w, i) => {
        const c = svgEl("circle", { cx: X(i), cy: Y(w[key] * scale, maxS), r: 2.6, fill: color });
        c.appendChild(svgEl("title"));
        c.lastChild.textContent = `${w.week}: ${w[key]} ${key}`;
        s.appendChild(c);
      });
    };
    line("sessions", 1, "", "#15171b");
    line("corrections", 10, "acc", "#e8452c");
    weeks.forEach((w, i) => {
      if (i % 2 === 0)
        s.appendChild(Object.assign(svgEl("text", { x: X(i), y: H - 8, "text-anchor": "middle" }), { textContent: w.week.replace("2026-", "") }));
    });
    host.innerHTML = "";
    host.appendChild(s);
  }

  /* ---------- number animation ---------- */
  function animateNumbers() {
    // Values are rendered final on purpose: count-up animations leave wrong
    // numbers in screenshots, print views and throttled tabs.
    $$("[data-num]").forEach((el) => {
      const t = Number(el.dataset.num);
      const suffix = /%\s*$/.test(el.textContent) ? "%" : "";
      if (Number.isFinite(t)) el.textContent = fmt(t, Number(el.dataset.dec ?? 0)) + suffix;
    });
  }

  /* ---------- index page ---------- */
  function initIndex() {
    const size = R.sizeBuckets;
    renderCols(
      $("#sizeChart"),
      size.map((b, i) => ({ label: b.label.replace(" chars", ""), value: b.share, display: b.share + "%" })),
      { hi: (i) => i.value < 0.5 },
    );
    renderBars(
      $("#signalChart"),
      [
        { label: "under 60 chars", value: R.signalShares.terse },
        { label: "bookkeeping", value: R.signalShares.commitRitual + R.signalShares.restartRitual },
        { label: "no acceptance", value: 100 - R.signalShares.acceptance },
        { label: "dangling / continuation", value: R.signalShares.contextlessPronoun + R.signalShares.bareContinuation },
        { label: "payload > 2 kB", value: R.signalShares.payload },
        { label: "structured list", value: R.signalShares.structure },
        { label: "constraints", value: R.signalShares.constraint },
        { label: "paths", value: R.signalShares.paths },
        { label: "acceptance", value: R.signalShares.acceptance },
      ],
      { suffix: "%", cls: (r) => (["structured list", "constraints", "paths", "acceptance"].includes(r.label) ? "acc2" : "") },
    );
    animateNumbers();
  }

  /* ---------- dashboard ---------- */
  function initDashboard() {
    const gen = $("#generated");
    if (gen) gen.textContent = new Date(R.generatedAt).toISOString().slice(0, 10);

    const root = R.projectsRoot ?? [];
    const rootSessions = root.reduce((a, p) => a + p.sessions, 0);
    const compacted = root.reduce((a, p) => a + p.compactionSessions, 0);
    const cost = R.models.reduce((a, m) => a + m.cost, 0);

    const kpis = [
      [fmt(rootSessions), "root sessions", "human-run conversations"],
      [fmt(R.headline.humanPrompts), "human prompts", "subagent prompts excluded"],
      [R.headline.promptsPerSession, "mean prompts / session", `median ${R.headline.medianPromptsPerSession}`],
      [pct(R.headline.ritualPromptShare), "bookkeeping prompts", "commit · restart · reload"],
      [pct(R.headline.acceptanceShare), "with acceptance", "falsifiable success"],
      [pct(R.headline.structuredShare), "structured", "numbered or bulleted"],
      [pct(R.headline.contextlessShare), "dangling / bare", "state held by chat"],
      [pct((compacted / rootSessions) * 100), "sessions compacted", `${R.totals.compactions} events`],
      [pct(R.headline.reworkSessionShare), "sessions with rework", "≥2 corrections"],
      [pct(R.headline.toolErrorRate), "tool error rate", `${fmt(R.totals.toolErrors)} / ${compact(R.totals.toolCalls)} calls`],
      [compact(R.totals.tokensIn).replace(".0", ""), "input tokens", `${compact(R.totals.tokensOut)} out`],
      ["$" + cost.toFixed(2), "model spend", `${R.models.length} models`],
    ];
    const kh = $("#kpis");
    if (kh)
      kh.innerHTML = kpis
        .map(([b, s, em]) => `<div class="kpi"><b>${b}</b><span>${s}</span><em>${em}</em></div>`)
        .join("");

    /* corpus */
    renderScatter($("#scatter"), root.filter((p) => p.sessions >= 4 && p.prompts > 0 && p.key !== "skills"));

    const shape = R.sessionShape;
    const shapeHost = $("#shapeChart");
    if (shapeHost) {
      const colors = ["#15171b", "#4b4f57", "#b8860b", "#e8452c"];
      shapeHost.innerHTML = `<div style="display:flex;height:52px;border:1px solid var(--line)">${shape
        .map((s, i) => `<span title="${s.label}: ${s.count} sessions (${s.share}%)" style="width:${s.share}%;background:${colors[i]}"></span>`)
        .join("")}</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:18px">${shape
          .map(
            (s, i) =>
              `<div><div class="num" style="font-size:24px">${s.count}</div><div class="mono" style="font-size:9.5px;color:var(--ink-faint);margin-top:4px">${s.label}</div><div class="small muted">${s.share}%</div></div>`,
          )
          .join("")}</div>`;
    }

    renderTimeline($("#timeline"), R.timeSeries);
    renderCols(
      $("#hours"),
      R.hours.map((h) => ({ label: String(h.hour).padStart(2, "0"), value: h.prompts, display: "" })),
      { hi: (h) => Number(h.label) >= 22 || Number(h.label) <= 3 },
    );

    renderBars(
      $("#primaryChart"),
      Object.entries(R.primaryMix)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ label: TASK_LABELS[k] ?? k, value: Math.round((v / R.headline.humanPrompts) * 1000) / 10 })),
      { suffix: "%" },
    );

    /* project table */
    const pt = $("#projectTable tbody");
    if (pt) {
      pt.innerHTML = root
        .filter((p) => p.prompts > 0 && p.key !== "skills")
        .map(
          (p) => `<tr>
        <td>${esc(p.key)}</td>
        <td class="n">${p.sessions}</td>
        <td class="n">${fmt(p.prompts)}</td>
        <td class="n">${p.meanPromptsPerSession}</td>
        <td class="n">${p.terseRate}%</td>
        <td class="n">${p.ritualRate}%</td>
        <td class="n">${p.acceptanceRate}%</td>
        <td class="n">${p.pathRate}%</td>
        <td class="n">${p.correctionRate}%</td>
        <td class="n">${p.compactionSessions}</td>
        <td class="n">${compact(p.tokensIn)}</td>
      </tr>`,
        )
        .join("");
    }

    /* anatomy */
    const sig = [
      ["terse", "under 60 characters"],
      ["commitRitual", "commit ritual"],
      ["bareContinuation", "bare continuation"],
      ["vagueScope", "vague scope"],
      ["constraint", "constraints"],
      ["paths", "paths"],
      ["acceptance", "acceptance"],
      ["structure", "structured list"],
      ["payload", "payload > 2 kB"],
      ["correction", "correction / pushback"],
      ["contextlessPronoun", "dangling pronoun"],
      ["restartRitual", "restart ritual"],
    ];
    renderBars(
      $("#signalChartAll"),
      sig.map(([k, label]) => ({ label, value: R.signalShares[k] })),
      { suffix: "%", cls: (r) => (["constraints", "paths", "acceptance", "structured list"].includes(r.label) ? "acc2" : "") },
    );

    renderCols(
      $("#sizeChart"),
      R.sizeBuckets.map((b) => ({ label: b.label.replace(" chars", ""), value: b.share, display: b.share + "%" })),
      { hi: (i) => i.value < 0.5 },
    );

    const mixProjects = root.filter((p) => p.key !== "skills" && p.prompts > 0).slice(0, 9);
    renderTaskMix($("#taskMix"), R.projectTaskMix, mixProjects);

    /* outcomes */
    const q = R.qualityImpact;
    const impactRows = [
      { label: "structure", ...q.structure },
      { label: "constraints", ...q.constraint },
      { label: "paths", ...q.paths },
      { label: "acceptance", ...q.acceptance },
      { label: "payload", ...q.payload },
      { label: "terse", ...q.terse },
    ];
    renderGrouped($("#impactChart"), impactRows, "meanPrompts");
    renderGrouped($("#reworkChart"), impactRows, "reworkRate");

    const it = $("#impactTable tbody");
    if (it) {
      const f = R.firstPromptOutcomes;
      const rows = [
        ["structure", f.withStructure, f.withoutStructure],
        ["constraints", q.constraint.with, q.constraint.without],
        ["paths", f.withPaths, f.withoutPaths],
        ["acceptance", f.withAcceptance, f.withoutAcceptance],
        ["payload", q.payload.with, q.payload.without],
      ];
      it.innerHTML = rows
        .map(
          ([label, w, o]) => `<tr><td>${label}</td>
            <td class="n">${w.sessions} / ${o.sessions}</td>
            <td class="n">${w.meanPrompts} / ${o.meanPrompts}</td>
            <td class="n">${w.reworkRate}% / ${o.reworkRate}%</td>
            <td class="n">${fmt(w.meanTurns)} / ${fmt(o.meanTurns)}</td>
            <td class="n">—</td></tr>`,
        )
        .join("");
    }

    /* failures */
    renderBars(
      $("#errorChart"),
      R.errorTaxonomy.filter((e) => e.count > 0).sort((a, b) => b.count - a.count).map((e) => ({ label: e.label, value: e.count })),
      { cls: "acc" },
    );
    renderBars(
      $("#toolChart"),
      R.tools.slice(0, 9).map((t) => ({ label: t.name, value: t.count })),
      {},
    );
    const tt = $("#toolTable tbody");
    if (tt) {
      tt.innerHTML = R.tools
        .map((t) => `<tr><td>${esc(t.name)}</td><td class="n">${fmt(t.count)}</td><td class="n">${fmt(t.errors)}</td><td class="n">${t.errorRate}%</td></tr>`)
        .join("");
    }

    /* explorer */
    const sessions = R.sessions ?? [];
    const sel = $("#projectFilter");
    const projects = [...new Set(sessions.map((s) => s.p))].sort();
    if (sel) sel.innerHTML += projects.map((p) => `<option value="${escapeAttr(p)}">${esc(p)}</option>`).join("");
    const qEl = $("#q");
    const sortEl = $("#sortBy");
    const countEl = $("#count");
    const tb = $("#sessionTable tbody");
    const dur = (ms) =>
      ms > 36e5 ? (ms / 36e5).toFixed(1) + "h" : ms > 6e4 ? Math.round(ms / 6e4) + "m" : Math.round(ms / 1e3) + "s";
    function draw() {
      const term = (qEl?.value ?? "").toLowerCase().trim();
      const proj = sel?.value ?? "";
      let rows = sessions.filter((s) => (!proj || s.p === proj) && (!term || (s.t + " " + s.p).toLowerCase().includes(term)));
      const sort = sortEl?.value ?? "created";
      const key = { created: "created", prompts: "n", corrections: "c", compactions: "k", tokens: "ti" }[sort];
      rows = rows.sort((a, b) => (sort === "created" ? b.created - a.created : b[key] - a[key]));
      if (countEl) countEl.textContent = `${rows.length} of ${sessions.length}`;
      if (tb)
        tb.innerHTML = rows
          .map(
            (s) => `<tr><td title="${escapeAttr(s.t)}" style="max-width:420px;overflow:hidden;text-overflow:ellipsis">${esc(s.t)}</td>
            <td>${esc(s.p)}</td><td class="n">${s.n}</td><td class="n">${s.c || ""}</td><td class="n">${s.r || ""}</td><td class="n">${s.k || ""}</td>
            <td class="n">${fmt(s.ti)}k</td><td class="n">${dur(s.ms)}</td><td class="n">${new Date(s.created).toISOString().slice(0, 10)}</td></tr>`,
          )
          .join("");
    }
    qEl?.addEventListener("input", draw);
    sel?.addEventListener("change", draw);
    sortEl?.addEventListener("change", draw);
    draw();
    const sc = $("#sessionCount");
    if (sc) sc.textContent = sessions.length;

    /* examples */
    const tabs = $("#exampleTabs");
    const exHost = $("#examples");
    const EX = [
      ["terse", "under 60 chars"],
      ["ritual", "bookkeeping"],
      ["correction", "corrections"],
      ["contextless", "dangling refs"],
      ["good", "well-scoped"],
      ["payload", "megadumps"],
    ].filter(([k]) => (R.examples[k] ?? []).length);
    function showExamples(k) {
      if (!exHost) return;
      exHost.innerHTML = R.examples[k]
        .map(
          (e) => `<div class="example"><div class="meta"><span>${esc(e.project)}</span><span>${fmt(e.chars)} chars</span></div>
          <div class="text">${esc(e.text)}</div></div>`,
        )
        .join("");
      $$(".tab", tabs).forEach((t) => t.setAttribute("aria-selected", String(t.dataset.k === k)));
    }
    if (tabs) {
      tabs.innerHTML = EX.map(([k, label], i) => `<button class="tab" role="tab" data-k="${k}" aria-selected="${i === 0}">${label}</button>`).join("");
      tabs.addEventListener("click", (e) => {
        const t = e.target.closest(".tab");
        if (t) showExamples(t.dataset.k);
      });
      showExamples(EX[0][0]);
    }
  }

  /* ---------- reveal ---------- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")), { threshold: 0.08 }) : null;
  $$(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));

  if (document.body.dataset.page === "dashboard") initDashboard();
  else initIndex();

  // extra CSS for task mix, injected here to keep site.css focused
  const style = document.createElement("style");
  style.textContent = `
    .taskmix{display:grid;gap:8px}
    .tm-row{display:grid;grid-template-columns:150px 1fr;gap:12px;align-items:center;font-size:12.5px}
    .tm-label{color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .tm-track{display:flex;height:16px;background:var(--paper-2);overflow:hidden}
    .tm-track span{display:block;height:100%}
    @media(max-width:640px){.tm-row{grid-template-columns:100px 1fr}}
  `;
  document.head.appendChild(style);
})();
