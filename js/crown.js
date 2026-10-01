// Finding 10: the chart starts hidden behind a cartoon player holding a crown. Click the crown, he lifts it with both hands
// and sets it on his head, it glows, and the chart is revealed.
(function () {
  const stage = document.querySelector(".crown-stage");
  if (!stage) return;
  const $ = (s) => stage.querySelector(s);
  const crown = $(".crown-piece"), glow = $(".crown-glow");
  const armL = $(".crown-arm-l"), armR = $(".crown-arm-r"), handL = $(".crown-hand-l"), handR = $(".crown-hand-r");
  const SH_L = { x: 264, y: 160 }, SH_R = { x: 336, y: 160 };
  const HOLD = { x: 300, y: 218 }, HEAD = { x: 300, y: 70 };
  const REST_L = { x: 252, y: 236 }, REST_R = { x: 348, y: 236 };
  let started = false;

  const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });

  // arm = shoulder -> elbow (bowed outward) -> hand
  const drawArm = (path, hand, sh, dir) => {
    const dx = hand.x - sh.x, dy = hand.y - sh.y, len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len, ny = dx / len;
    if (nx * dir < 0) { nx = -nx; ny = -ny; }
    const bend = 12;
    const e = { x: sh.x + dx / 2 + nx * bend, y: sh.y + dy / 2 + ny * bend };
    path.setAttribute("d", "M" + sh.x + " " + sh.y + " L" + e.x + " " + e.y + " L" + hand.x + " " + hand.y);
  };
  const pose = (hl, hr) => {
    drawArm(armL, hl, SH_L, -1); drawArm(armR, hr, SH_R, 1);
    handL.setAttribute("cx", hl.x); handL.setAttribute("cy", hl.y);
    handR.setAttribute("cx", hr.x); handR.setAttribute("cy", hr.y);
  };
  // hands grip either side of the crown
  const holding = (c) => pose({ x: c.x - 24, y: c.y + 9 }, { x: c.x + 24, y: c.y + 9 });
  const setCrown = (c, s) => crown.setAttribute("transform", "translate(" + c.x + " " + c.y + ") scale(" + (s || 1) + ")");
  setCrown(HOLD); holding(HOLD);

  const reveal = () => {
    const canvas = document.getElementById("c10");
    const chart = canvas && window.Chart && Chart.getChart(canvas);
    stage.classList.add("done");
    if (chart) { chart.reset(); chart.update(); }
    setTimeout(() => stage.remove(), 600);
  };

  const go = () => {
    if (started) return;
    started = true;
    stage.classList.add("shot");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { reveal(); return; }
    const tLift = 1300, tGlow = 1100, t0 = performance.now();
    const tick = (now) => {
      const el = Math.max(0, now - t0);
      if (el < tLift) {                         // both hands raise it a little above his head, then set it down
        const t = ease(el / tLift);
        const c = mix(HOLD, HEAD, t);
        c.y -= 20 * Math.sin(Math.pow(t, 1.4) * Math.PI);
        setCrown(c); holding(c);
      } else if (el < tLift + tGlow) {          // hands let go, crown glows
        const t = (el - tLift) / tGlow, r = ease(Math.min(t * 1.6, 1));
        setCrown(HEAD, 1 + 0.12 * Math.sin(t * Math.PI));
        pose(mix({ x: HEAD.x - 24, y: HEAD.y + 9 }, REST_L, r), mix({ x: HEAD.x + 24, y: HEAD.y + 9 }, REST_R, r));
        const g = Math.sin(Math.min(t * 1.25, 1) * Math.PI / 2);
        glow.setAttribute("r", 30 + 65 * g);
        glow.setAttribute("opacity", Math.min(1, g * 1.4) * (t > 0.75 ? (1 - t) * 4 : 1));
        crown.style.filter = "drop-shadow(0 0 " + (6 + 16 * g) + "px #ffc53d) brightness(" + (1 + 0.35 * g) + ")";
      } else {
        setCrown(HEAD); pose(REST_L, REST_R);
        reveal(); return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  crown.addEventListener("click", go);
  crown.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
  });
})();
