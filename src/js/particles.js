const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initParticles() {
  const canvas = document.querySelector("#particles");
  if (!canvas || prefersReducedMotion()) return () => {};

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let rafId = 0;
  let inViewport = true;
  let pageVisible = !document.hidden;
  const pointer = { x: -9999, y: -9999 };
  const palette = ["34, 211, 238", "167, 139, 250", "244, 114, 182"];

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(80, Math.max(26, Math.floor((width * height) / 22000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.24,
      vy: (Math.random() - 0.5) * 0.24,
      r: Math.random() * 1.6 + 0.5,
      c: palette[Math.floor(Math.random() * palette.length)],
      a: Math.random() * 0.45 + 0.2
    }));
  };

  const draw = () => {
    if (!inViewport || !pageVisible) {
      rafId = 0;
      return;
    }

    ctx.clearRect(0, 0, width, height);
    const linkDist = 120;
    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < -20) particle.x = width + 20;
      if (particle.x > width + 20) particle.x = -20;
      if (particle.y < -20) particle.y = height + 20;
      if (particle.y > height + 20) particle.y = -20;

      const dxp = particle.x - pointer.x;
      const dyp = particle.y - pointer.y;
      const pointerDistance = Math.hypot(dxp, dyp);
      if (pointerDistance < 150 && pointerDistance > 0.01) {
        particle.x += (dxp / pointerDistance) * 0.18;
        particle.y += (dyp / pointerDistance) * 0.18;
      }

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${particle.c}, ${particle.a})`;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j += 1) {
        const other = particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.hypot(dx, dy);
        if (distance < linkDist) {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(${particle.c}, ${(1 - distance / linkDist) * 0.13})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }
    rafId = requestAnimationFrame(draw);
  };

  const syncAnimation = () => {
    if (inViewport && pageVisible && !rafId) rafId = requestAnimationFrame(draw);
    if ((!inViewport || !pageVisible) && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  const visibilityTarget = document.querySelector("#top") || canvas;
  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      syncAnimation();
    }, { threshold: 0.01 })
    : null;
  observer?.observe(visibilityTarget);

  const onPointerMove = (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  };
  const onPointerLeave = () => {
    pointer.x = -9999;
    pointer.y = -9999;
  };
  const onVisibilityChange = () => {
    pageVisible = !document.hidden;
    syncAnimation();
  };
  let resizeTimer;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 150);
  };

  window.addEventListener("mousemove", onPointerMove, { passive: true });
  window.addEventListener("mouseout", onPointerLeave);
  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVisibilityChange);
  resize();
  syncAnimation();

  return () => {
    observer?.disconnect();
    cancelAnimationFrame(rafId);
    clearTimeout(resizeTimer);
    window.removeEventListener("mousemove", onPointerMove);
    window.removeEventListener("mouseout", onPointerLeave);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
