/* REINA — hero particle field: a soft constellation of creative "sparks" that react to the pointer. */
(function () {
  "use strict";
  const c = document.querySelector("[data-hero-canvas]");
  if (!c || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = c.getContext("2d");
  const colors = ["#ff5a1f", "#ffc53d", "#7a5af8", "#0fa3a3", "#ffffff"];
  let w, h, dpr, pts = [], mouse = { x: -9999, y: -9999 }, raf;
  const N = () => Math.min(110, Math.floor((w * h) / 14000));
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = c.clientWidth; h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pts = Array.from({ length: N() }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: 1 + Math.random() * 2.2, c: colors[(Math.random() * colors.length) | 0], o: .35 + Math.random() * .5 }));
  }
  function frame() {
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 160 * 160) { const f = (1 - Math.sqrt(d2) / 160) * .6; p.vx += (dx / Math.sqrt(d2 || 1)) * f; p.vy += (dy / Math.sqrt(d2 || 1)) * f; }
      p.vx *= .98; p.vy *= .98; p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10; if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
      if (d2 < 130 * 130) { ctx.strokeStyle = `rgba(255,255,255,${(1 - Math.sqrt(d2) / 130) * .14})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
    for (const p of pts) { ctx.globalAlpha = p.o; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }
  const hero = c.closest(".hero") || c.parentElement;
  hero.addEventListener("pointermove", (e) => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(frame); });
  const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) raf = requestAnimationFrame(frame); else cancelAnimationFrame(raf); });
  resize(); io.observe(c);
})();
