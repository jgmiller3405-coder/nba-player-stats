// Hero basketball: still until you grab it. Drag to turn it; it keeps spinning briefly after you let go.
(function () {
  const wrap = document.querySelector(".ball-wrap");
  const ball = document.querySelector(".ball");
  if (!wrap || !ball) return;

  let angle = 0, last = null, vel = 0, raf = null, dragging = false;
  const render = () => (ball.style.transform = "rotate(" + angle + "deg)");
  const pointerAngle = (e) => {
    const r = wrap.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
  };

  wrap.addEventListener("pointerdown", (e) => {
    dragging = true; vel = 0; cancelAnimationFrame(raf);
    last = pointerAngle(e);
    wrap.setPointerCapture(e.pointerId);
    wrap.classList.add("grabbing");
  });
  wrap.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const a = pointerAngle(e);
    let d = a - last;
    if (d > 180) d -= 360; else if (d < -180) d += 360;
    angle += d; vel = d; last = a;
    render();
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove("grabbing");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const coast = () => {
      vel *= 0.95;
      if (Math.abs(vel) < 0.05) return;
      angle += vel; render();
      raf = requestAnimationFrame(coast);
    };
    raf = requestAnimationFrame(coast);
  };
  wrap.addEventListener("pointerup", release);
  wrap.addEventListener("pointercancel", release);
})();
