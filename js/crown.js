// Finding 10: the chart starts hidden behind a cartoon player and a crown. Click the crown, he picks it up and puts it on
// his head, it glows, and the chart is revealed.
(function () {
  const stage = document.querySelector(".crown-stage");
  if (!stage) return;
  const crown = stage.querySelector(".crown-piece");
  const arm = stage.querySelector(".crown-arm");
  const glow = stage.querySelector(".crown-glow");
  const SHOULDER = { x: 336, y: 160 };
  const REST = { x: 350, y: 232 }, PICK = { x: 381, y: 213 }, HEAD = { x: 300, y: 80 };
  let shot = false;

  const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const setArm = (h) => { arm.setAttribute("x2", h.x); arm.setAttribute("y2", h.y); };
  const setCrown = (x, y, s) => crown.setAttribute("transform", "translate(" + x + " " + y + ") scale(" + (s || 1) + ")");
  setArm(REST);

  const reveal = () => {
    const canvas = document.getElementById("c10");
    const chart = canvas && window.Chart && Chart.getChart(canvas);
    stage.classList.add("done");
    if (chart) { chart.reset(); chart.update(); }
    setTimeout(() => stage.remove(), 600);
  };

  const go = () => {
    if (shot) return;
    shot = true;
    stage.classList.add("shot");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { reveal(); return; }
    const tReach = 500, tLift = 1000, tGlow = 1100, tEnd = tReach + tLift + tGlow;
    const t0 = performance.now();
    const tick = (now) => {
      const el = Math.max(0, now - t0);
      if (el < tReach) {                        // reach for the crown
        const t = ease(el / tReach);
        setArm({ x: lerp(REST.x, PICK.x, t), y: lerp(REST.y, PICK.y, t) });
      } else if (el < tReach + tLift) {         // lift it onto his head
        const t = ease((el - tReach) / tLift);
        const h = { x: lerp(PICK.x, HEAD.x, t), y: lerp(PICK.y, HEAD.y, t) - 28 * Math.sin(t * Math.PI) };
        setArm(h); setCrown(h.x, h.y - 10);
      } else if (el < tEnd) {                   // let go, glow
        const t = (el - tReach - tLift) / tGlow;
        setArm({ x: lerp(HEAD.x, REST.x, ease(Math.min(t * 1.6, 1))), y: lerp(HEAD.y, REST.y, ease(Math.min(t * 1.6, 1))) });
        setCrown(HEAD.x, HEAD.y - 10, 1 + 0.12 * Math.sin(t * Math.PI));
        const g = Math.sin(Math.min(t * 1.25, 1) * Math.PI / 2);
        glow.setAttribute("r", 30 + 65 * g);
        glow.setAttribute("opacity", Math.min(1, g * 1.4) * (t > 0.75 ? (1 - t) * 4 + 0.0 : 1));
        crown.style.filter = "drop-shadow(0 0 " + (6 + 16 * g) + "px #ffc53d) brightness(" + (1 + 0.35 * g) + ")";
      } else {
        setArm(REST); setCrown(HEAD.x, HEAD.y - 10);
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
