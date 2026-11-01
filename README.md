# LiaoAB.github.io

My personal website — a dark neon aurora single-page portfolio.

Live at **https://liaoab.github.io**

## Stack

- Vanilla HTML, CSS, and modular ES Modules
- Vite for local development and production builds
- GitHub Pages / Vercel compatible static output

## Features

- Animated aurora gradients and a particle network
- Custom cursor spotlight
- Typewriter hero, scroll reveals, and animated counters
- Interactive project cards with 3D tilt
- Fully responsive and reduced-motion friendly

## Site structure

- `/` — personal portfolio
- `/nz2027/` — standalone 2027NZ travel planner and PWA

Both pages are published together, while the travel planner keeps its own assets,
service worker, manifest, and local-storage namespace.

## Local preview

Install dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

Then visit the URL printed by Vite (normally http://localhost:3000).

Validate the site and build both pages with:

```bash
npm run check:site
npm run build
```

The deployment bundle is written to `dist/`: the personal page is at the root and
the 2027NZ app is at `dist/nz2027/`.

The GitHub Pages root serves the personal page. The Vercel project publishes
`dist/nz2027/` as its root, so `nz2027.vercel.app` opens the travel planner directly.

Use `npm run build:portfolio` when you only want to build the personal portfolio.

## Editing content

- Projects, roles, statistics, and skills live in `src/data/portfolio.json`
- Colors and layout live in `styles.css` (`:root` custom properties)
- Interactions are split across `src/js/navigation.js`, `src/js/animations.js`, and `src/js/particles.js`

## 2027NZ Google Doc sync

The `/nz2027/` planner can sync content from the configured Google Doc. The document must be shared as
“Anyone with the link — Viewer”. Its current Chinese itinerary/table format is parsed automatically;
it can also contain JSON matching
[`docs/nz2027-google-doc-format.md`](docs/nz2027-google-doc-format.md).

GitHub Actions checks the document every 30 minutes, validates it, and commits changes to
`nz2027/remote-content.json`. The app keeps its embedded itinerary as a fallback when the document is
unavailable. Run `npm run sync:nz2027` locally to test a public document export.
