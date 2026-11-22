/**
 * The site can live at a sub-path (GitHub Pages serves it under /primelife-concept/).
 * Vite sets BASE_URL from `base`; every public file and every route goes through these.
 */
export const BASE = import.meta.env.BASE_URL;
const ROOT = BASE.replace(/\/$/, "");

/** A file in public/, given as "/img/...". */
export const asset = (p: string) => (p.startsWith("/") && !p.startsWith("//") ? BASE + p.slice(1) : p);

/** An in-app route ("/homes/x", "/#care") as a real URL. */
export const withBase = (path: string) => (path.startsWith("/") ? ROOT + path : path);

/** The router's base ("" at the domain root). */
export const ROUTER_BASE = ROOT;
