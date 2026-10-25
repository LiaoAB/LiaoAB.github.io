/* ============================================================
   LiaoAB — Personal site interactions
   ============================================================ */

(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Footer year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Nav scroll state + progress ---------- */
  const nav = $("#nav");
  const scrollBar = $("#scrollBar");
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    nav?.classList.toggle("scrolled", y > 24);
    if (scrollBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollBar.style.width = `${max > 0 ? Math.min(100, (y / max) * 100) : 0}%`;
    }
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const menuToggle = $("#menuToggle");
  const navLinks = $("#navLinks");

  const closeMenu = () => {
    navLinks?.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  };

  menuToggle?.addEventListener("click", () => {
    const open = navLinks?.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(Boolean(open)));
  });

  $$("#navLinks a").forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("click", (e) => {
    if (!navLinks?.classList.contains("open")) return;
    if (!navLinks.contains(e.target) && !menuToggle?.contains(e.target)) closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- Active section highlighting ---------- */
  const sections = $$("section[id]");
  const navAnchors = $$("#navLinks a");

  if ("IntersectionObserver" in window && sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navAnchors.forEach((a) => {
            a.classList.toggle("active", a.getAttribute("href") === `#${id}`);
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ---------- Typewriter ---------- */
  const typeEl = $("#typewriter");
  const roles = [
    "Software Engineer",
    "AI & Data Enthusiast",
    "Python Developer",
    "Open Source Contributor"
  ];

  if (typeEl) {
    if (reduceMotion) {
      typeEl.textContent = roles[0];
    } else {
      let roleIndex = 0;
      let charIndex = 0;
      let deleting = false;

      const tick = () => {
        const current = roles[roleIndex];
        charIndex += deleting ? -1 : 1;
        typeEl.textContent = current.slice(0, charIndex);

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
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------- Animated counters ---------- */
  const statsEl = $(".stats");
  const counters = $$("[data-count]");

  const animateCount = (el) => {
    const target = Number(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || "";
    const plain = el.dataset.plain === "true";
    const duration = 1500;
    const start = performance.now();

    const frame = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = plain ? String(value) : value.toLocaleString("en-US") + suffix;
      if (progress < 1) requestAnimationFrame(frame);
    };

    if (reduceMotion) {
      el.textContent = plain ? String(target) : target.toLocaleString("en-US") + suffix;
    } else {
      requestAnimationFrame(frame);
    }
  };

  if (statsEl && "IntersectionObserver" in window) {
    const statObserver = new IntersectionObserver(
      (entries, observer) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          counters.forEach(animateCount);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    statObserver.observe(statsEl);
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- Skill bars ---------- */
  const bars = $$(".bar span[data-width]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    bars.forEach((bar) => { bar.style.width = "0%"; });
    const barObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const bar = entry.target;
          bar.style.width = `${bar.dataset.width}%`;
          observer.unobserve(bar);
        });
      },
      { threshold: 0.5 }
    );
    bars.forEach((bar) => barObserver.observe(bar));
  } else {
    bars.forEach((bar) => { bar.style.width = `${bar.dataset.width}%`; });
  }

  /* ---------- Project card tilt + glow ---------- */
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  if (finePointer && !reduceMotion) {
    $$(".tilt").forEach((card) => {
      const strength = 6;

      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rx = (0.5 - py) * strength * 2;
        const ry = (px - 0.5) * strength * 2;

        card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-4px)`;
        card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ---------- Cursor spotlight ---------- */
  const spotlight = $("#spotlight");
  if (spotlight && finePointer && !reduceMotion) {
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;

    window.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
      spotlight.style.opacity = "1";
    }, { passive: true });

    const follow = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      spotlight.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(follow);
    };
    follow();
  }

  /* ---------- Particle network ---------- */
  const canvas = $("#particles");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let rafId = 0;
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
      ctx.clearRect(0, 0, width, height);

      const linkDist = 120;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        const dxp = p.x - pointer.x;
        const dyp = p.y - pointer.y;
        const distP = Math.hypot(dxp, dyp);
        if (distP < 150 && distP > 0.01) {
          p.x += (dxp / distP) * 0.18;
          p.y += (dyp / distP) * 0.18;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c}, ${p.a})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${p.c}, ${(1 - dist / linkDist) * 0.13})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    window.addEventListener("mousemove", (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    }, { passive: true });

    window.addEventListener("mouseout", () => {
      pointer.x = -9999;
      pointer.y = -9999;
    });

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(draw);
      }
    });

    resize();
    draw();
  }
})();
