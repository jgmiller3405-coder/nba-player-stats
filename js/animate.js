// Report animations: hero entrance, count-up headline numbers, scroll-reveal sections,
// and charts that replay their draw animation when scrolled into view.
(function () {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.documentElement.classList.add("anim");

  // count-up for the headline numbers ("769,773", "41.5%")
  document.querySelectorAll(".stat .num").forEach((el) => {
    const m = el.textContent.trim().match(/^([\d,]+(?:\.\d+)?)(.*)$/);
    if (!m) return;
    const end = parseFloat(m[1].replace(/,/g, ""));
    const dec = (m[1].split(".")[1] || "").length;
    const suffix = m[2];
    const t0 = performance.now(), dur = 1400;
    el.textContent = (0).toFixed(dec) + suffix;
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      const v = end * e;
      el.textContent = (dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US")) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // scroll-reveal sections, and replay each chart's animation as it comes into view
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      const canvas = en.target.querySelector("canvas");
      const chart = canvas && window.Chart && Chart.getChart(canvas);
      if (chart) { chart.reset(); chart.update(); }
      io.unobserve(en.target);
    });
  }, { threshold: 0.2 });
  document.querySelectorAll("section.finding").forEach((s) => io.observe(s));
})();
