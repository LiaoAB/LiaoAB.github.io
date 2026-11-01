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

## Local preview

Install dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

Then visit the URL printed by Vite (normally http://localhost:3000).

Create a production bundle with:

```bash
npm run check
npm run build
```

The output is written to `dist/`.

## Editing content

- Projects, roles, statistics, and skills live in `src/data/portfolio.json`
- Colors and layout live in `styles.css` (`:root` custom properties)
- Interactions are split across `src/js/navigation.js`, `src/js/animations.js`, and `src/js/particles.js`
