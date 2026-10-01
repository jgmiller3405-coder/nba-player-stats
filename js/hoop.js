// Finding 01: the chart starts hidden behind a hoop. Click the ball and it shoots in; the chart is revealed when it goes through.
(function () {
  const stage = document.querySelector(".hoop-stage");
  if (!stage) return;
  const ns = "http://www.w3.org/2000/svg";
  const ball = stage.querySelector(".hoop-ball");
  const net = stage.querySelector(".hoop-net");
  const hint = stage.querySelector(".hoop-hint");
  const START = { x: 120, y: 268 }, RIM = { x: 440, y: 150 }, END_Y = 236;
  const R = 0.48; // ball scale (100-unit art -> ~48px)
  let shot = false;

  const place = (x, y, a) => ball.setAttribute("transform",
    "translate(" + x + " " + y + ") rotate(" + a + ") scale(" + R + ") translate(-50 -50)");
  place(START.x, START.y, 0);

  const reveal = () => {
    const canvas = document.getElementById("c1");
    const chart = canvas && window.Chart && Chart.getChart(canvas);
    stage.classList.add("done");
    if (chart) { chart.reset(); chart.update(); }
    setTimeout(() => stage.remove(), 600);
  };

  const shoot = () => {
    if (shot) return;
    shot = true;
    stage.classList.add("shot");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { reveal(); return; }
    const flight = 1500, drop = 420, t0 = performance.now();
    const tick = (now) => {
      const el = now - t0;
      if (el < flight) {
        const t = el / flight;
        place(START.x + (RIM.x - START.x) * t,
              START.y + (RIM.y - START.y) * t - 150 * 4 * t * (1 - t), t * 540);
        requestAnimationFrame(tick);
      } else if (el < flight + drop) {
        const t = (el - flight) / drop;
        place(RIM.x, RIM.y + (END_Y - RIM.y) * t * t, 540 + t * 40);
        net.style.transform = "scale(" + (1 + 0.08 * Math.sin(t * Math.PI)) + "," + (1 + 0.22 * Math.sin(t * Math.PI)) + ")";
        requestAnimationFrame(tick);
      } else {
        net.style.transform = "";
        place(RIM.x, END_Y, 580);
        reveal();
      }
    };
    requestAnimationFrame(tick);
  };

  ball.addEventListener("click", shoot);
  ball.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); shoot(); }
  });
})();
