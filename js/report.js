// Report page: fills {{expressions}} in the text from window.REPORT and draws the charts.
(function () {
  const R = window.REPORT;
  const n = (x) => Math.round(x).toLocaleString("en-US");
  const f = (x, d) => Number(x).toFixed(d);
  const pct = (x) => (x * 100).toFixed(1) + "%";
  const sum = (a) => a.reduce((s, v) => s + v, 0);

  // replace {{expr}} in the body text with computed values
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) if (walker.currentNode.nodeValue.includes("{{")) nodes.push(walker.currentNode);
  const run = new Function("R", "n", "f", "pct", "sum", "expr", "return eval(expr)");
  nodes.forEach((t) => {
    t.nodeValue = t.nodeValue.replace(/\{\{(.+?)\}\}/g, (_, e) => run(R, n, f, pct, sum, e));
  });
  document.title = document.title.replace(/\{\{.+?\}\}/g, "");

  const C = window.COLORS;
  const L = R.season_labels;
  const pctTick = (v) => (v * 100).toFixed(0) + "%";
  const pctTip = { callbacks: { label: (c) => c.dataset.label + ": " + (c.parsed.y * 100).toFixed(1) + "%" } };

  function line(id, datasets, yOpts) {
    return new Chart(document.getElementById(id), {
      type: "line",
      data: { labels: L, datasets: datasets.map((d, i) => Object.assign({ borderColor: C[i], backgroundColor: C[i], pointRadius: 0, pointHoverRadius: 4, borderWidth: 2.5, tension: 0.25 }, d)) },
      options: { interaction: { mode: "index", intersect: false }, scales: Object.assign({ x: { ticks: { maxTicksLimit: 9 } } }, yOpts), plugins: { legend: { display: datasets.length > 1 } } },
    });
  }

  // 1 volume
  line("c1", [
    { label: "3PA per appearance", data: R.s_tpa, yAxisID: "y" },
    { label: "Share of shots that are threes", data: R.s_tpar, yAxisID: "y2" },
  ], {
    y: { title: { display: true, text: "3PA per appearance" }, beginAtZero: true },
    y2: { position: "right", grid: { drawOnChartArea: false }, ticks: { callback: pctTick }, beginAtZero: true },
  });
  Chart.getChart("c1").options.plugins.tooltip = { callbacks: { label: (c) => c.dataset.yAxisID === "y2" ? c.dataset.label + ": " + (c.parsed.y * 100).toFixed(1) + "%" : c.dataset.label + ": " + c.parsed.y.toFixed(2) } };
  Chart.getChart("c1").update();

  // 2 efficiency
  line("c2", [
    { label: "3-point %", data: R.s_tpp },
    { label: "True shooting %", data: R.s_ts },
  ], { y: { ticks: { callback: pctTick } } });
  Chart.getChart("c2").options.plugins.tooltip = pctTip; Chart.getChart("c2").update();

  // 3 free throws
  line("c3", [{ label: "FTA per appearance", data: R.s_fta }], { y: { title: { display: true, text: "FTA per appearance" } } });

  // 4 rebounds
  line("c4", [
    { label: "Offensive rebounds", data: R.s_oreb, yAxisID: "y" },
    { label: "Total rebounds", data: R.s_reb, yAxisID: "y2" },
  ], {
    y: { title: { display: true, text: "Offensive" }, beginAtZero: true },
    y2: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "Total" }, beginAtZero: true },
  });

  // 5 big games
  new Chart(document.getElementById("c5"), {
    type: "bar",
    data: { labels: L, datasets: [
      { label: "40+ point games", data: R.g40, backgroundColor: C[1] },
      { label: "50+ point games", data: R.g50, backgroundColor: C[0] },
    ] },
    options: { scales: { x: { ticks: { maxTicksLimit: 9 } }, y: { beginAtZero: true } } },
  });

  // 6 bench vs starters
  const order = [3, 2, 1, 0]; // guard, forward, center, bench
  const roleLabels = order.map((i) => R.role_labels[i]);
  new Chart(document.getElementById("c6"), {
    type: "bar",
    data: { labels: roleLabels, datasets: [
      { label: "Points per appearance", data: order.map((i) => R.role_pts[i]), backgroundColor: C[3] },
      { label: "Points per 36 minutes", data: order.map((i) => R.role_pts36[i]), backgroundColor: C[0] },
    ] },
    options: { scales: { y: { beginAtZero: true } } },
  });

  // 7 role signatures
  new Chart(document.getElementById("c7"), {
    type: "bar",
    data: { labels: roleLabels, datasets: [
      { label: "Assists", data: order.map((i) => R.role_ast[i]), backgroundColor: C[0] },
      { label: "Rebounds", data: order.map((i) => R.role_reb[i]), backgroundColor: C[1] },
      { label: "Steals", data: order.map((i) => R.role_stl[i]), backgroundColor: C[2] },
      { label: "Blocks", data: order.map((i) => R.role_blk[i]), backgroundColor: C[3] },
    ] },
    options: { scales: { y: { beginAtZero: true } } },
  });

  // 8 home court
  line("c8", [
    { label: "Home win share", data: R.home_win },
    { label: "No advantage (50%)", data: R.home_win.map(() => 0.5), borderDash: [6, 6], borderColor: "#9aa6c2", backgroundColor: "#9aa6c2", borderWidth: 1.5 },
  ], { y: { min: 0.45, ticks: { callback: pctTick } } });
  Chart.getChart("c8").options.plugins.tooltip = pctTip; Chart.getChart("c8").update();

  // 9 franchises
  new Chart(document.getElementById("c9"), {
    type: "bar",
    data: { labels: R.fr_labels, datasets: [{ label: "3PA per appearance", data: R.fr_tpa, backgroundColor: C[0] }] },
    options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true }, y: { ticks: { autoSkip: false, font: { size: 11 } } } } },
  });

  // 10 career points
  new Chart(document.getElementById("c10"), {
    type: "bar",
    data: { labels: R.lead_labels, datasets: [{ label: "Career points", data: R.lead_pts, backgroundColor: C[2] }] },
    options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } },
  });
})();
