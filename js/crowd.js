// Finding 08 animation: builds the cheering/yelling crowd (the shot itself is pure CSS).
(function () {
  const g = document.querySelector(".crowd-svg .fans");
  if (!g) return;
  const ns = "http://www.w3.org/2000/svg";
  const skins = ["#8a5a3c", "#c68b59", "#f1c27d", "#5c3a24", "#e0ac69"];
  const shirts = ["#ff7a1a", "#2bb8a7", "#ffc53d", "#5b8def", "#ed174c", "#f4f6fb"];
  const hair = ["#17120f", "#4a2c17", "#c9a15b", "#2a2a2a"];
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(ns, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n); return n;
  };

  const fan = (cx, cy, r) => {
    const f = el("g", { class: "fan" }, g);
    f.style.animationDelay = (-rnd() * 0.55).toFixed(2) + "s";
    const shirt = pick(shirts), skin = pick(skins);
    el("rect", { x: cx - r * 1.25, y: cy + r * 0.9, width: r * 2.5, height: 90, rx: r * 0.8, fill: shirt }, f);
    [["fan-arm fan-arm-l", -1], ["fan-arm fan-arm-r", 1]].forEach(([cls, s]) => {
      const a = el("rect", { class: cls, x: cx + s * r * 1.15 - 3.5, y: cy + r * 1.1 - 28, width: 7, height: 30, rx: 3.5, fill: skin }, f);
      a.style.animationDelay = (-rnd() * 0.55).toFixed(2) + "s";
    });
    el("circle", { cx, cy, r, fill: skin }, f);
    el("path", { d: "M" + (cx - r) + " " + cy + " Q" + (cx - r) + " " + (cy - r * 1.15) + " " + cx + " " + (cy - r * 1.15) + " Q" + (cx + r) + " " + (cy - r * 1.15) + " " + (cx + r) + " " + cy + " Q" + cx + " " + (cy - r * 0.55) + " " + (cx - r) + " " + cy + " Z", fill: pick(hair) }, f);
    el("path", { d: "M" + (cx - r * 0.65) + " " + (cy - r * 0.22) + " l" + r * 0.4 + " " + r * 0.14 + " M" + (cx + r * 0.65) + " " + (cy - r * 0.22) + " l" + (-r * 0.4) + " " + r * 0.14, stroke: "#17120f", "stroke-width": 1.6, "stroke-linecap": "round", fill: "none" }, f);
    el("circle", { cx: cx - r * 0.33, cy: cy + r * 0.05, r: 1.5, fill: "#17120f" }, f);
    el("circle", { cx: cx + r * 0.33, cy: cy + r * 0.05, r: 1.5, fill: "#17120f" }, f);
    const m = el("ellipse", { class: "fan-mouth", cx, cy: cy + r * 0.52, rx: r * 0.34, ry: r * 0.3, fill: "#3a0d0d" }, f);
    m.style.animationDelay = (-rnd() * 0.4).toFixed(2) + "s";
  };

  for (let i = 0; i < 7; i++) fan(26 + i * 48 + (rnd() * 6 - 3), 262 + (rnd() * 6 - 3), 12);   // back row
  for (let i = 0; i < 6; i++) fan(50 + i * 48 + (rnd() * 6 - 3), 312 + (rnd() * 4 - 2), 15);   // front row
})();
