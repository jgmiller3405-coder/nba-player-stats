// Hero basketball: a real 3D ball (three.js). Still until you grab it. Drag to turn it in any direction;
// it keeps spinning briefly after you let go. Falls back to the flat SVG ball if WebGL/three.js is unavailable.
(function () {
  const wrap = document.querySelector(".ball-wrap");
  const svg = document.querySelector(".ball");
  if (!wrap || !svg || !window.THREE) return;

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const canvas = renderer.domElement;
  canvas.className = "ball-canvas";
  wrap.insertBefore(canvas, svg);
  svg.style.display = "none";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.z = 4.6;

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(-2, 3, 4);
  scene.add(key);

  // pebbled leather texture
  const tex = document.createElement("canvas");
  tex.width = tex.height = 512;
  const g = tex.getContext("2d");
  g.fillStyle = "#e8630f"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = Math.random() < 0.5 ? "rgba(90,30,0,.16)" : "rgba(255,170,90,.14)";
    g.beginPath(); g.arc(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 1.4, 0, 6.283); g.fill();
  }
  const map = new THREE.CanvasTexture(tex);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3, 2);

  const ball = new THREE.Group();
  ball.add(new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 48),
    new THREE.MeshPhongMaterial({ map, bumpMap: map, bumpScale: 0.6, shininess: 18, specular: 0x553322 })
  ));

  // seams: two great circles plus the two curved side channels
  const seamMat = new THREE.MeshPhongMaterial({ color: 0x1d0d03, shininess: 4 });
  const seam = (radius, pos, rot) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.02, 10, 96), seamMat);
    m.position.copy(pos); m.rotation.set(rot[0], rot[1], rot[2]);
    ball.add(m);
  };
  const o = new THREE.Vector3();
  seam(1.002, o, [0, 0, 0]);                 // equator
  seam(1.002, o, [0, Math.PI / 2, 0]);       // meridian
  const x = 0.55, r = Math.sqrt(1 - x * x) * 1.002;
  seam(r, new THREE.Vector3(x, 0, 0), [0, Math.PI / 2, 0]);
  seam(r, new THREE.Vector3(-x, 0, 0), [0, Math.PI / 2, 0]);
  ball.rotation.set(0.35, -0.5, 0.15);
  scene.add(ball);

  const draw = () => renderer.render(scene, camera);
  const size = () => {
    const w = wrap.clientWidth || 200, h = wrap.clientHeight || 200;
    renderer.setSize(w, h, false); draw();
  };
  size();
  addEventListener("resize", size);

  // drag to rotate (screen-space axes), then coast
  const spin = (dx, dy) => {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(dy, dx, 0, "XYZ"));
    ball.quaternion.premultiply(q);
  };
  let last = null, vx = 0, vy = 0, raf = null, dragging = false;
  wrap.addEventListener("pointerdown", (e) => {
    dragging = true; vx = vy = 0; cancelAnimationFrame(raf);
    last = [e.clientX, e.clientY];
    wrap.setPointerCapture(e.pointerId);
    wrap.classList.add("grabbing");
  });
  wrap.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    vx = (e.clientX - last[0]) * 0.012; vy = (e.clientY - last[1]) * 0.012;
    last = [e.clientX, e.clientY];
    spin(vx, vy); draw();
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove("grabbing");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const coast = () => {
      vx *= 0.95; vy *= 0.95;
      if (Math.abs(vx) + Math.abs(vy) < 0.002) return;
      spin(vx, vy); draw();
      raf = requestAnimationFrame(coast);
    };
    raf = requestAnimationFrame(coast);
  };
  wrap.addEventListener("pointerup", release);
  wrap.addEventListener("pointercancel", release);
})();
