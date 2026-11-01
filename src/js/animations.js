const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

const getMotionPreference = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initTypewriter(roles) {
  const typeElement = $("#typewriter");
  if (!typeElement || !roles?.length) return;
  if (getMotionPreference()) {
    typeElement.textContent = roles[0];
    return;
  }

  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;
  const tick = () => {
    const current = roles[roleIndex];
    charIndex += deleting ? -1 : 1;
    typeElement.textContent = current.slice(0, charIndex);
    let delay = deleting ? 38 : 76;
    if (!deleting && charIndex === current.length) {
      deleting = true;
      delay = 1700;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      delay = 480;
    }
    window.setTimeout(tick, delay);
  };
  window.setTimeout(tick, 700);
}

function initReveal() {
  const elements = $$(".reveal");
  if (!elements.length) return;
  if (!("IntersectionObserver" in window) || getMotionPreference()) {
    elements.forEach((element) => element.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in-view");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
  elements.forEach((element) => observer.observe(element));
}

function initCounters() {
  const stats = $(".stats");
  const counters = $$('[data-count]');
  if (!stats || !counters.length) return;

  const animate = (element) => {
    const target = Number(element.dataset.count) || 0;
    const suffix = element.dataset.suffix || "";
    const plain = element.dataset.plain === "true";
    if (getMotionPreference()) {
      element.textContent = plain ? String(target) : `${target.toLocaleString("en-US")}${suffix}`;
      return;
    }
    const start = performance.now();
    const frame = (now) => {
      const progress = Math.min(1, (now - start) / 1500);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      element.textContent = plain ? String(value) : `${value.toLocaleString("en-US")}${suffix}`;
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  if (!("IntersectionObserver" in window)) {
    counters.forEach(animate);
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      counters.forEach(animate);
      currentObserver.disconnect();
    });
  }, { threshold: 0.35 });
  observer.observe(stats);
}

function initSkillBars() {
  const bars = $$('.bar span[data-width]');
  if (!bars.length) return;
  const reveal = (bar) => { bar.style.width = `${bar.dataset.width}%`; };
  if (getMotionPreference() || !("IntersectionObserver" in window)) {
    bars.forEach(reveal);
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.5 });
  bars.forEach((bar) => {
    bar.style.width = "0%";
    observer.observe(bar);
  });
}

function initTilt() {
  if (getMotionPreference() || !window.matchMedia("(pointer: fine)").matches) return;
  $$(".tilt").forEach((card) => {
    const strength = 6;
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      card.style.transform = `perspective(900px) rotateX(${((0.5 - py) * strength * 2).toFixed(2)}deg) rotateY(${((px - 0.5) * strength * 2).toFixed(2)}deg) translateY(-4px)`;
      card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    });
    card.addEventListener("mouseleave", () => { card.style.transform = ""; });
  });
}

function initSpotlight() {
  const spotlight = $("#spotlight");
  if (!spotlight || getMotionPreference() || !window.matchMedia("(pointer: fine)").matches) return;

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let running = true;
  let rafId = 0;
  const update = () => {
    if (!running) { rafId = 0; return; }
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;
    spotlight.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
    rafId = requestAnimationFrame(update);
  };
  const observerTarget = $("#top") || spotlight;
  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting && !document.hidden;
      if (running && !rafId) rafId = requestAnimationFrame(update);
    }, { threshold: 0.01 })
    : null;
  observer?.observe(observerTarget);
  const onMove = (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    spotlight.style.opacity = "1";
  };
  const onVisibility = () => {
    running = !document.hidden;
    if (running && !rafId) rafId = requestAnimationFrame(update);
  };
  window.addEventListener("mousemove", onMove, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  rafId = requestAnimationFrame(update);
}

function initEffectVisibility() {
  const target = $("#top");
  if (!target || !("IntersectionObserver" in window)) return;
  const update = (visible) => document.documentElement.classList.toggle("effects-paused", !visible || document.hidden);
  const observer = new IntersectionObserver(([entry]) => update(entry.isIntersecting), { threshold: 0.01 });
  observer.observe(target);
  document.addEventListener("visibilitychange", () => update(!document.hidden));
}

export function initAnimations(roles) {
  initTypewriter(roles);
  initReveal();
  initCounters();
  initSkillBars();
  initTilt();
  initSpotlight();
  initEffectVisibility();
}
