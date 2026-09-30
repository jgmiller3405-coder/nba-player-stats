// Dashboard: loads data/cube.csv, filters it in the browser, and redraws KPIs, charts and table.
(async function () {
  const text = await (await fetch("data/cube.csv")).text();
  const lines = text.trim().split("\n");
  const head = lines[0].trim().split(",");
  const rows = lines.slice(1).map((l) => {
    const p = l.trim().split(","), o = {};
    head.forEach((h, i) => (o[h] = i >= 5 || h === "season" ? +p[i] : p[i]));
    o.era = o.season < 2005 ? "1994-2004" : o.season < 2015 ? "2005-2014" : "2015-2025";
    return o;
  });

  const uniq = (k) => [...new Set(rows.map((r) => r[k]))];
  const seasons = uniq("season").sort((a, b) => a - b);
  const sl = (s) => s + "-" + String(s + 1).slice(2);
  const ROLE_ORDER = ["Starting guard", "Starting forward", "Starting center", "Bench"];
  const OPTS = { franchise: uniq("franchise").sort(), role: ROLE_ORDER, venue: ["Home", "Away"], result: ["Win", "Loss"] };

  // measures take summed columns {games, min, pts, ...}
  const pc = (x) => (x * 100).toFixed(1) + "%";
  const d2 = (x) => x.toFixed(2);
  const int = (x) => Math.round(x).toLocaleString();
  const MEASURES = {
    games: { label: "Player appearances", fn: (s) => s.games, fmt: int },
    pts_total: { label: "Total points", fn: (s) => s.pts, fmt: int },
    pts: { label: "Points per appearance", fn: (s) => s.pts / s.games, fmt: d2 },
    ast: { label: "Assists per appearance", fn: (s) => s.ast / s.games, fmt: d2 },
    reb: { label: "Rebounds per appearance", fn: (s) => s.reb / s.games, fmt: d2 },
    tpa: { label: "3-pt attempts per appearance", fn: (s) => s.tpa / s.games, fmt: d2 },
    min: { label: "Minutes per appearance", fn: (s) => s.min / s.games, fmt: d2 },
    tov: { label: "Turnovers per appearance", fn: (s) => s.tov / s.games, fmt: d2 },
    fgp: { label: "Field-goal %", fn: (s) => s.fgm / s.fga, fmt: pc, pct: true },
    tpp: { label: "3-point %", fn: (s) => s.tpm / s.tpa, fmt: pc, pct: true },
    ts: { label: "True shooting %", fn: (s) => s.pts / (2 * (s.fga + 0.44 * s.fta)), fmt: pc, pct: true },
  };
  const BREAKS = { franchise: "Franchise", role: "Role", venue: "Venue", result: "Result", era: "Era" };
  const COLS = ["games", "min", "pts", "ast", "reb", "oreb", "stl", "blk", "tov", "pf", "fgm", "fga", "tpm", "tpa", "ftm", "fta"];
  const blank = () => Object.fromEntries(COLS.map((c) => [c, 0]));
  const add = (s, r) => COLS.forEach((c) => (s[c] += r[c]));

  const $ = (id) => document.getElementById(id);
  const fill = (id, vals) => ($(id).innerHTML = vals.map(([v, l]) => `<option value="${v}">${l}</option>`).join(""));
  fill("f-from", seasons.map((s) => [s, sl(s)]));
  fill("f-to", seasons.map((s) => [s, sl(s)]));
  ["franchise", "role", "venue", "result"].forEach((k) => fill("f-" + k, [["all", "All"], ...OPTS[k].map((v) => [v, v])]));
  fill("measure", Object.entries(MEASURES).map(([k, m]) => [k, m.label]));
  fill("breakdown", Object.entries(BREAKS));

  function reset() {
    $("f-from").value = seasons[0];
    $("f-to").value = seasons[seasons.length - 1];
    ["franchise", "role", "venue", "result"].forEach((k) => ($("f-" + k).value = "all"));
    $("measure").value = "pts";
    $("breakdown").value = "role";
    update();
  }
  $("reset").addEventListener("click", reset);
  document.querySelectorAll("select").forEach((s) => s.addEventListener("change", () => {
    if (+$("f-from").value > +$("f-to").value) {
      if (s.id === "f-from") $("f-to").value = $("f-from").value; else $("f-from").value = $("f-to").value;
    }
    update();
  }));

  let charts = {};
  let sortKey = "games", sortDir = -1;
  const C = window.COLORS;

  function groupBy(data, key) {
    const m = new Map();
    data.forEach((r) => { if (!m.has(r[key])) m.set(r[key], blank()); add(m.get(r[key]), r); });
    return m;
  }
  function orderKeys(key, m) {
    if (key === "role") return ROLE_ORDER.filter((k) => m.has(k));
    if (key === "venue") return ["Home", "Away"].filter((k) => m.has(k));
    if (key === "result") return ["Win", "Loss"].filter((k) => m.has(k));
    return [...m.keys()].sort();
  }
  function draw(id, cfg) {
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart($(id), cfg);
  }

  function update() {
    const from = +$("f-from").value, to = +$("f-to").value;
    const sel = Object.fromEntries(["franchise", "role", "venue", "result"].map((k) => [k, $("f-" + k).value]));
    const data = rows.filter((r) => r.season >= from && r.season <= to &&
      Object.entries(sel).every(([k, v]) => v === "all" || r[k] === v));
    const M = MEASURES[$("measure").value], bKey = $("breakdown").value;

    const tot = blank(); data.forEach((r) => add(tot, r));
    const kp = [["Player appearances", MEASURES.games], ["Points per appearance", MEASURES.pts],
      ["3-pt attempts per appearance", MEASURES.tpa], ["True shooting %", MEASURES.ts], ["Total points", MEASURES.pts_total]];
    $("kpis").innerHTML = kp.map(([l, m]) =>
      `<div class="kpi"><div class="num">${tot.games ? m.fmt(m.fn(tot)) : "-"}</div><div class="lab">${l}</div></div>`).join("");

    if (!data.length) {
      Object.values(charts).forEach((c) => c.destroy()); charts = {};
      ["cap1", "cap2", "cap3", "cap4"].forEach((i) => ($(i).textContent = "No rows match these filters."));
      $("table").innerHTML = '<div class="empty">No rows match these filters. Use Reset to start over.</div>';
      return;
    }

    const fmtAxis = (v) => (M.pct ? (v * 100).toFixed(0) + "%" : v.toLocaleString());
    const byGroup = groupBy(data, bKey);
    const keys = orderKeys(bKey, byGroup);
    const bName = BREAKS[bKey].toLowerCase();

    // 1. measure over time, one line per group (6 largest)
    const big = keys.slice().sort((a, b) => byGroup.get(b).games - byGroup.get(a).games);
    const top = big.slice(0, 6);
    const yrs = seasons.filter((s) => s >= from && s <= to);
    const bySeason = new Map();
    data.forEach((r) => { const k = r[bKey] + "|" + r.season; if (!bySeason.has(k)) bySeason.set(k, blank()); add(bySeason.get(k), r); });
    $("cap1").textContent = `${M.label} by season, by ${bName}` + (keys.length > 6 ? " (6 largest groups)" : "");
    draw("d1", {
      type: "line",
      data: { labels: yrs.map(sl), datasets: top.map((k, i) => ({
        label: k, borderColor: C[i], backgroundColor: C[i], borderWidth: 2.3, pointRadius: yrs.length < 4 ? 4 : 0, tension: 0.2, spanGaps: true,
        data: yrs.map((y) => { const s = bySeason.get(k + "|" + y); return s && s.games ? M.fn(s) : null; }),
      })) },
      options: { interaction: { mode: "index", intersect: false }, scales: { x: { ticks: { maxTicksLimit: 9 } }, y: { ticks: { callback: fmtAxis } } },
        plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${M.fmt(c.parsed.y)}` } } } },
    });

    // 2. measure by group
    $("cap2").textContent = `${M.label}, by ${bName}`;
    const sorted = keys.slice().sort((a, b) => M.fn(byGroup.get(b)) - M.fn(byGroup.get(a)));
    const horiz = keys.length > 6;
    draw("d2", {
      type: "bar",
      data: { labels: sorted, datasets: [{ label: M.label, data: sorted.map((k) => M.fn(byGroup.get(k))), backgroundColor: C[0] }] },
      options: { indexAxis: horiz ? "y" : "x",
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => M.fmt(horiz ? c.parsed.x : c.parsed.y) } } },
        scales: horiz ? { x: { ticks: { callback: fmtAxis } }, y: { ticks: { autoSkip: false, font: { size: 10 } } } } : { y: { ticks: { callback: fmtAxis } } } },
    });

    // 3. share of appearances
    $("cap3").textContent = `Share of player appearances, by ${bName}` + (keys.length > 6 ? " (6 largest, rest grouped)" : "");
    const slices = top.map((k) => [k, byGroup.get(k).games]);
    if (big.length > 6) slices.push(["Other", big.slice(6).reduce((s, k) => s + byGroup.get(k).games, 0)]);
    draw("d3", {
      type: "doughnut",
      data: { labels: slices.map((s) => s[0]), datasets: [{ data: slices.map((s) => s[1]), backgroundColor: [...C, "#56627f"], borderColor: "#171e30" }] },
      options: { plugins: { legend: { position: "right" }, tooltip: { callbacks: { label: (c) => `${c.label}: ${c.parsed.toLocaleString()} (${(c.parsed / tot.games * 100).toFixed(1)}%)` } } } },
    });

    // 4. shooting profile
    $("cap4").textContent = `Shooting percentages, by ${bName}` + (keys.length > 8 ? " (8 highest on the selected measure)" : "");
    const prof = keys.length > 8 ? sorted.slice(0, 8) : keys;
    draw("d4", {
      type: "bar",
      data: { labels: prof, datasets: [["fgp", C[3]], ["tpp", C[0]], ["ts", C[1]]].map(([m, col]) =>
        ({ label: MEASURES[m].label, data: prof.map((k) => MEASURES[m].fn(byGroup.get(k))), backgroundColor: col })) },
      options: { scales: { x: { ticks: { autoSkip: false, font: { size: 10 } } }, y: { min: 0.2, ticks: { callback: (v) => (v * 100).toFixed(0) + "%" } } },
        plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${pc(c.parsed.y)}` } } } },
    });

    // table
    const cols = [["group", BREAKS[bKey], null], ["games", "Appearances", MEASURES.games], ["pts_total", "Total pts", MEASURES.pts_total],
      ["pts", "Pts/app", MEASURES.pts], ["ast", "Ast/app", MEASURES.ast], ["reb", "Reb/app", MEASURES.reb],
      ["tpa", "3PA/app", MEASURES.tpa], ["fgp", "FG%", MEASURES.fgp], ["tpp", "3P%", MEASURES.tpp], ["ts", "TS%", MEASURES.ts]];
    const trs = keys.map((k) => { const s = byGroup.get(k); const o = { group: k }; cols.slice(1).forEach(([c, , m]) => (o[c] = m.fn(s))); return o; });
    trs.sort((a, b) => sortKey === "group" ? -sortDir * String(a.group).localeCompare(b.group) : sortDir * (a[sortKey] - b[sortKey]));
    $("table").innerHTML = `<table class="data"><thead><tr>${cols.map(([c, l]) =>
      `<th data-k="${c}">${l}${c === sortKey ? (sortDir < 0 ? " ▾" : " ▴") : ""}</th>`).join("")}</tr></thead><tbody>` +
      trs.map((o) => `<tr><td>${o.group}</td>${cols.slice(1).map(([c, , m]) => `<td>${m.fmt(o[c])}</td>`).join("")}</tr>`).join("") +
      `<tr><td><strong>All filtered</strong></td>${cols.slice(1).map(([c, , m]) => `<td>${m.fmt(m.fn(tot))}</td>`).join("")}</tr></tbody></table>`;
    $("table").querySelectorAll("th").forEach((th) => th.addEventListener("click", () => {
      const k = th.dataset.k; sortDir = k === sortKey ? -sortDir : -1; sortKey = k; update();
    }));
  }

  reset();
})();
