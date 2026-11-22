// GitHub Pages has no rewrites: give every app route its own index.html so deep links return 200.
// Anything else still falls back to 404.html (a copy of the app, which shows its own not-found page).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const homes = JSON.parse(fs.readFileSync(path.join(root, "src/data/homes.json"), "utf8"));
const routes = ["homes", ...homes.map((h) => `homes/${h.slug}`)];
for (const r of routes) {
	fs.mkdirSync(path.join(dist, r), { recursive: true });
	fs.writeFileSync(path.join(dist, r, "index.html"), html);
}
fs.writeFileSync(path.join(dist, "404.html"), html);
console.log(`wrote ${routes.length} route pages and 404.html`);
