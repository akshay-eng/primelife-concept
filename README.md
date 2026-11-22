# PrimeLife concept

A concept redesign of [prime-life.co.uk](https://prime-life.co.uk) by PulpLabs. It is not the live site and is not affiliated with PrimeLife.

The content is PrimeLife's own: photos, home details, testimonials and copy taken from their public website.

Live preview: https://akshay-eng.github.io/primelife-concept/

## Run it

```bash
npm install --ignore-scripts
npm run dev       # http://127.0.0.1:5320
npm run build     # BASE_PATH=/primelife-concept/ for GitHub Pages
```

Stack: Vite, React 19, Tailwind 4, three.js through React Three Fiber and drei, GSAP ScrollTrigger, Lenis and Motion.

`scripts/build-data.mjs` regenerates `src/data` and `public/img` from the scraped material, which is not in this repository.
