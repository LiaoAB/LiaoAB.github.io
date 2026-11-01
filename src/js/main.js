import portfolio from "../data/portfolio.json";
import { renderPortfolio } from "./content.js";
import { initAnimations } from "./animations.js";
import { initNavigation } from "./navigation.js";
import { initParticles } from "./particles.js";

function init() {
  renderPortfolio(portfolio);
  initNavigation();
  initAnimations(portfolio.roles);
  initParticles();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
