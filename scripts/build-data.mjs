// Builds src/data/*.json and public/img/* from the scraped material in ../raw.
// Raw inputs are data only: nothing in ../raw is executed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const raw = path.resolve(root, "../raw");
const dataOut = path.join(root, "src/data");
const imgOut = path.join(root, "public/img");
for (const d of [dataOut, `${imgOut}/homes`, `${imgOut}/moments`, `${imgOut}/splash`, `${imgOut}/brand`]) {
	fs.mkdirSync(d, { recursive: true });
}

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const norm = (s) =>
	s
		.toLowerCase()
		.replace(/\bthe\b/g, "")
		.replace(/[^a-z]/g, "");

// ---------- Regions ----------
const REGION_BY_AREA = {
	LE: "Leicestershire & Rutland",
	DN: "Lincolnshire",
	LN: "Lincolnshire",
	PE: "Lincolnshire",
	NR: "Norfolk",
	NG: "Nottinghamshire & Derbyshire",
	DE: "Nottinghamshire & Derbyshire",
	B: "Warwickshire & West Midlands",
	CV: "Warwickshire & West Midlands",
	HU: "East Yorkshire",
	BB: "Lancashire",
	WN: "Lancashire",
	BS: "Bristol",
};

// ---------- Homes ----------
/** UK grouping: 011x and 01x1 cities are 4-3-4, 02x is 3-4-4, the rest 5-6. */
function formatUkPhone(raw) {
	const d = raw.replace(/\D/g, "");
	if (d.length !== 11) return d.replace(/^(\d{5})(\d+)$/, "$1 $2");
	if (/^01\d1/.test(d) || /^011/.test(d)) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
	if (/^02/.test(d)) return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`;
	return `${d.slice(0, 5)} ${d.slice(5)}`;
}
const rawHomes = readJson(path.join(raw, "homes/homes.json"));
const cleanAddress = (a) =>
	(a ?? "")
		.replace(/\\r\\n|\r\n|\n/g, ", ")
		.replace(/\s+,/g, ",")
		.replace(/,\s*,/g, ",")
		.replace(/\s{2,}/g, " ")
		.replace(/\.$/, "")
		.trim();

function capacityOf(text) {
	const patterns = [
		/(\d+)[\s-]bed\b/i,
		/for (?:up to )?(\d+) (?:clients|residents|people|service users)/i,
		/accommodation (?:for|to) (\d+) clients/i,
		/(\d+) places/i,
		/provides? (?:services )?(?:to|for) (\d+) clients/i,
	];
	for (const p of patterns) {
		const m = text.match(p);
		if (m) return Number(m[1]);
	}
	return null;
}

const homes = rawHomes.map((h) => {
	const address = cleanAddress(h.address);
	const pc = address.toUpperCase().match(/\b([A-Z]{1,2})(\d[\dA-Z]?)\s*(\d[A-Z]{2})\b/);
	const postcode = pc ? `${pc[1]}${pc[2]} ${pc[3]}` : null;
	const area = pc ? pc[1] : null;
	// Descriptions whose first lines repeat the multi-line address get those lines dropped.
	const addrParts = new Set(address.split(",").map((s) => norm(s)));
	const description = h.description
		.map((d) => d.replace(/ /g, " ").replace(/\s{2,}/g, " ").trim())
		.filter((d) => d && !addrParts.has(norm(d.replace(/,$/, ""))) && norm(d) !== norm(h.name));
	const text = description.join(" ");
	const town = (() => {
		const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
		const withoutPc = parts.filter((p) => !/\b[A-Z]{1,2}\d[\dA-Z]?\s*\d[A-Z]{2}\b/.test(p.toUpperCase()) || p.split(" ").length > 2);
		const skip = /^(leicestershire|lincolnshire|north lincolnshire|north east lincolnshire|nottinghamshire|norfolk|warwickshire|lancashire|east riding)$/i;
		const candidates = withoutPc.filter((p) => !skip.test(p) && !/\d/.test(p));
		const t = candidates.at(-1) ?? parts[0];
		return t.replace(/\s+[A-Z]{1,2}\d[\dA-Z]?\s*\d[A-Z]{2}$/i, "").trim();
	})();
	return {
		slug: h.slug,
		name: h.name.replace(/\s+/g, " ").trim(),
		url: h.url,
		phone: h.phone ? formatUkPhone(h.phone) : null,
		phoneTel: h.phone ? `+44${h.phone.replace(/^0/, "")}` : null,
		address,
		postcode,
		town,
		region: (area && REGION_BY_AREA[area]) || "Other",
		lat: h.lat,
		lng: h.lng,
		manager: h.manager ? h.manager.replace(/\s+/g, " ").trim() : null,
		capacity: capacityOf(text),
		careTypes: h.care_types,
		amenities: h.amenities,
		description,
		thumb: h.thumb && !h.thumb_error ? `/img/homes/${h.slug}.webp` : null,
		brochure: h.brochure ? `https://prime-life.co.uk/wp-content/uploads/brochures/${h.brochure}` : null,
		photos: [],
	};
});

// ---------- Moments (monthly "Enjoying Life" posts) ----------
const { moments: rawMoments, awards } = readJson(path.join(raw, "moments.json"));
const mediaDir = path.join(raw, "assets/media");
const mediaIndex = new Map(readJson(path.join(mediaDir, "index.json")).map((m) => [m.file, m]));

// Each photo sits just before its home's heading, so the parser attached it to the previous entry.
const shifted = rawMoments.map((m, i) => {
	const prev = rawMoments[i - 1];
	const images = prev && prev.month === m.month ? prev.images : [];
	return { ...m, images };
});

function localMedia(src) {
	const rel = src.split("/uploads/")[1];
	if (!rel) return null;
	const original = rel.replace(/-\d+x\d+(\.\w+)$/, "$1");
	const file = original.replace("/", "-").replace("/", "__");
	return mediaIndex.has(file) ? file : null;
}

function homeFor(heading) {
	const n = norm(heading);
	if (!n) return null;
	return (
		homes.find((h) => norm(h.name) === n) ??
		homes.find((h) => norm(h.name).startsWith(n) || n.startsWith(norm(h.name))) ??
		homes.find((h) => norm(h.slug).startsWith(n))
	);
}

const cleanCaption = (t) =>
	t
		.replace(/Find (?:them|us) on Facebook here\s*!?/gi, "")
		.replace(/\s+([!.,])/g, "$1")
		.replace(/\s{2,}/g, " ")
		.trim();

const moments = [];
let idx = 0;
for (const m of shifted) {
	const home = homeFor(m.home);
	const caption = cleanCaption(m.text);
	const file = m.images.map(localMedia).find(Boolean);
	if (!file) continue;
	const id = `m${String(++idx).padStart(3, "0")}`;
	const meta = mediaIndex.get(file);
	moments.push({
		id,
		month: m.month,
		heading: m.home,
		home: home?.slug ?? null,
		homeName: home?.name ?? m.home,
		caption,
		post: m.post,
		src: `/img/moments/${id}.webp`,
		srcSmall: `/img/moments/${id}-sm.webp`,
		w: meta.w,
		h: meta.h,
		file,
	});
}

async function toWebp(input, output, width, quality = 78) {
	if (fs.existsSync(output)) return;
	await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(output);
}

for (const m of moments) {
	const input = path.join(mediaDir, m.file);
	await toWebp(input, path.join(imgOut, "moments", `${m.id}.webp`), 1400);
	await toWebp(input, path.join(imgOut, "moments", `${m.id}-sm.webp`), 560, 72);
	const meta = await sharp(path.join(imgOut, "moments", `${m.id}.webp`)).metadata();
	m.w = meta.width;
	m.h = meta.height;
	delete m.file;
	const home = homes.find((h) => h.slug === m.home);
	if (home && home.photos.length < 4) home.photos.push(m.id);
}

for (const h of rawHomes) {
	if (!h.thumb || h.thumb_error) continue;
	await toWebp(path.join(raw, "homes/thumbs", h.thumb), path.join(imgOut, "homes", `${h.slug}.webp`), 640, 82);
}

// ---------- Splash photos and brand ----------
const splashDir = path.join(raw, "assets/splash");
const splash = {
	"rutland-lady": "rutland-lady-final.jpg",
	"peaker-park-people": "peaker-park-people.jpg",
	"old-rectory": "the-old-rectory-full.jpg",
	"visit-hands": "Rishi-Three.jpg",
	"visit-team": "Rishi-Two.jpg",
};
for (const [name, file] of Object.entries(splash)) {
	await toWebp(path.join(splashDir, file), path.join(imgOut, "splash", `${name}.webp`), 1920, 80);
	await toWebp(path.join(splashDir, file), path.join(imgOut, "splash", `${name}-sm.webp`), 900, 74);
}
fs.copyFileSync(path.join(raw, "logo.svg"), path.join(imgOut, "brand/logo.svg"));
for (const f of ["PrimeLife40.png", "dis.png", "favicon.ico"]) {
	fs.copyFileSync(path.join(raw, "assets/brand", f), path.join(imgOut, "brand", f));
}

// ---------- Great Britain outline, projected to a flat plane ----------
// Equirectangular with cos(lat0) correction; units are roughly 100 km.
const LAT0 = 53.2;
const LNG0 = -1.6;
const K = Math.cos((LAT0 * Math.PI) / 180);
const project = ([lng, lat]) => [+((lng - LNG0) * K * 1.112).toFixed(4), +((lat - LAT0) * 1.112).toFixed(4)];
const gbr = readJson(path.join(raw, "geo/GBR.json"));
const irl = readJson(path.join(raw, "geo/IRL.json"));
const polys = (f) => (f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates]);
const keep = (f, min) => polys(f).filter((p) => p[0].length >= min).map((p) => p[0].map(project));
const geo = {
	lat0: LAT0,
	lng0: LNG0,
	k: K,
	land: keep(gbr, 18),
	neighbour: keep(irl, 50),
};
for (const h of homes) {
	[h.x, h.y] = project([h.lng, h.lat]);
}

// ---------- Write ----------
const careTypes = [...new Set(homes.flatMap((h) => h.careTypes))]
	.map((name) => ({ name, count: homes.filter((h) => h.careTypes.includes(name)).length }))
	.sort((a, b) => b.count - a.count);
const regions = [...new Set(homes.map((h) => h.region))]
	.map((name) => ({ name, count: homes.filter((h) => h.region === name).length }))
	.sort((a, b) => b.count - a.count);
const stats = {
	homes: homes.length,
	places: homes.reduce((s, h) => s + (h.capacity ?? 0), 0),
	placesKnownFor: homes.filter((h) => h.capacity).length,
	careTypes: careTypes.length,
	regions: regions.length,
	founded: 1984,
};

fs.writeFileSync(path.join(dataOut, "homes.json"), JSON.stringify(homes, null, 1));
fs.writeFileSync(path.join(dataOut, "moments.json"), JSON.stringify(moments, null, 1));
fs.writeFileSync(path.join(dataOut, "geo.json"), JSON.stringify(geo));
fs.writeFileSync(path.join(dataOut, "meta.json"), JSON.stringify({ stats, careTypes, regions, awards }, null, 1));
console.log(JSON.stringify(stats), "moments:", moments.length);
console.log("regions:", regions.map((r) => `${r.name} ${r.count}`).join(" | "));
console.log("unmatched moments:", moments.filter((m) => !m.home).map((m) => m.heading).join(", "));
console.log("no capacity:", homes.filter((h) => !h.capacity).map((h) => h.slug).join(", "));
console.log("towns:", homes.map((h) => `${h.slug}=${h.town}`).join(" "));
