// Navigation & Scroll State Module

export function initNavigation() {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Footer year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Nav scroll state + progress
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

  // Mobile menu
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

  // Active section highlighting
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
}
