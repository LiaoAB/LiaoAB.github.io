import emojiArt from "../../assets/project-emoji.svg";
import reversiArt from "../../assets/project-reversi.svg";
import sheepArt from "../../assets/project-sheep.svg";
import ossArt from "../../assets/project-oss.svg";

const githubIcon = '<path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.54 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.21.65.8.54A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/>';
const externalIcon = '<path d="M14 3h7v7M21 3l-9 9M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>';
const arrowIcon = '<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
const projectArt = {
  "assets/project-emoji.svg": emojiArt,
  "assets/project-reversi.svg": reversiArt,
  "assets/project-sheep.svg": sheepArt,
  "assets/project-oss.svg": ossArt
};

const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

const createIcon = (markup, className = "") => {
  const svg = createElement("svg", className);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = markup;
  return svg;
};

function renderStats(stats = []) {
  const container = document.querySelector("#statsGrid");
  if (!container) return;
  container.replaceChildren();

  stats.forEach((stat) => {
    const card = createElement("div", "stat glass");
    const number = createElement("span", "stat-num", "0");
    number.dataset.count = stat.count;
    if (stat.suffix) number.dataset.suffix = stat.suffix;
    if (stat.plain) number.dataset.plain = "true";
    card.append(number, createElement("span", "stat-label", stat.label));
    container.append(card);
  });
}

function renderProjectLink(link) {
  const anchor = createElement("a");
  anchor.href = link.url;
  anchor.target = "_blank";
  anchor.rel = "noopener";
  anchor.setAttribute("aria-label", link.label);
  anchor.append(createIcon(link.type === "github" ? githubIcon : externalIcon));
  return anchor;
}

function renderProject(project) {
  const article = createElement("article", `project glass tilt reveal${project.featured ? " project-featured" : ""}`);
  article.dataset.projectId = project.id;
  article.append(createElement("div", "project-glow"));

  const art = createElement("div", "project-art");
  const image = createElement("img");
  image.src = projectArt[project.art] || project.art;
  image.alt = "";
  image.width = 800;
  image.height = 600;
  image.loading = "lazy";
  art.append(image);

  const body = createElement("div", "project-body");
  const top = createElement("div", "project-top");
  if (project.featured) {
    const icon = createElement("span", `project-icon ${project.iconClass || ""}`);
    icon.append(createIcon(project.iconSvg || externalIcon));
    top.append(icon);
  } else {
    top.append(createElement("span", "project-kind", project.kind));
  }

  const links = createElement("div", "project-links");
  project.links.forEach((link) => links.append(renderProjectLink(link)));
  top.append(links);
  body.append(top);

  if (project.featured) body.append(createElement("span", "featured-tag", project.kind));
  body.append(createElement("h3", "", project.title));
  body.append(createElement("p", "project-desc", project.description));

  const highlights = createElement("ul", "project-highlights");
  project.highlights.forEach((highlight) => highlights.append(createElement("li", "", highlight)));
  body.append(highlights);

  const tags = createElement("ul", "tags");
  project.tags.forEach((tag) => tags.append(createElement("li", "", tag)));
  body.append(tags);

  const foot = createElement("div", "project-foot");
  const status = createElement("span", "project-status");
  status.append(createElement("span", "status-dot"), document.createTextNode(project.status));
  foot.append(status, createElement("span", "project-year", project.year));
  body.append(foot);

  if (project.featured) {
    article.append(body, art);
  } else {
    article.append(art, body);
  }
  return article;
}

function renderProjects(projects = []) {
  const container = document.querySelector("#projectsGrid");
  if (!container) return;
  container.replaceChildren();
  projects.forEach((project) => container.append(renderProject(project)));
}

function renderSkillGroup(group, index) {
  const card = createElement("div", "skill-card glass reveal");
  const heading = createElement("h3");
  heading.append(createElement("span", "skill-icon", String(index + 1).padStart(2, "0")), document.createTextNode(` ${group.title}`));
  card.append(heading);

  if (group.levels) {
    const bars = createElement("div", "skill-bars");
    group.levels.forEach((skill) => {
      const row = createElement("div", "skill-row");
      const meta = createElement("div", "skill-meta");
      meta.append(createElement("span", "", skill.name), createElement("span", "skill-pct", `${skill.pct}%`));
      const bar = createElement("div", "bar");
      const fill = createElement("span");
      fill.dataset.width = skill.pct;
      bar.append(fill);
      row.append(meta, bar);
      bars.append(row);
    });
    card.append(bars);
  } else {
    const list = createElement("ul", "chip-list");
    group.items.forEach((item) => list.append(createElement("li", "", item)));
    card.append(list, createElement("p", "skill-note", group.note));
  }
  return card;
}

function renderSkills(skills = {}) {
  const container = document.querySelector("#skillsGrid");
  if (!container) return;
  container.replaceChildren();

  const groups = [
    { key: "languages", title: "Languages", levels: skills.languages },
    { key: "frontend", title: "Frontend", items: skills.frontend, note: "Building interfaces that feel fast, accessible, and effortless." },
    { key: "backend", title: "Backend & Tools", items: skills.backend, note: "Services, APIs, and the tooling that keeps them shipping." },
    { key: "ai", title: "AI & Data", items: skills.ai, note: "From training models to turning raw data into decisions." }
  ];

  groups.forEach((group, index) => {
    if (group.levels || group.items) container.append(renderSkillGroup(group, index));
  });
}

export function renderPortfolio(portfolio) {
  renderStats(portfolio.stats);
  renderProjects(portfolio.projects);
  renderSkills(portfolio.skills);
}

export { arrowIcon, githubIcon };
