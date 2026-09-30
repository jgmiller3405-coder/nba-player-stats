// Shared by both pages: navigation bar and Chart.js defaults.
(function () {
  const page = location.pathname.endsWith("dashboard.html") ? "dashboard" : "report";
  const nav = document.createElement("nav");
  nav.className = "nav";
  nav.innerHTML =
    '<a class="brand" href="index.html">NBA <span>BOX SCORES</span></a>' +
    '<a class="link ' + (page === "report" ? "active" : "") + '" href="index.html">Report</a>' +
    '<a class="link ' + (page === "dashboard" ? "active" : "") + '" href="dashboard.html">Dashboard</a>' +
    '<a class="link" href="https://github.com/jgmiller3405-coder/nba-player-stats">GitHub</a>';
  document.body.prepend(nav);

  if (window.Chart) {
    Chart.defaults.color = "#9aa6c2";
    Chart.defaults.font.family = '"Inter", system-ui, sans-serif';
    Chart.defaults.borderColor = "#2b3652";
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.plugins.legend.labels.boxWidth = 12;
  }
  window.COLORS = ["#ff7a1a", "#2ec4b6", "#ffc53d", "#5b8def", "#ef5da8", "#9b7bff"];
})();
