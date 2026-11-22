import { type Home, geo, homes } from "@/lib/data";

export type Place = { label: string; lat: number; lng: number };

const R_MILES = 3958.8;
const rad = (d: number) => (d * Math.PI) / 180;

export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
	const dLat = rad(b.lat - a.lat);
	const dLng = rad(b.lng - a.lng);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
	return 2 * R_MILES * Math.asin(Math.sqrt(h));
}

/** Same projection as scripts/build-data.mjs, so a searched place lands on the 3D map. */
export function project(lat: number, lng: number): [number, number] {
	return [(lng - geo.lng0) * geo.k * 1.112, (lat - geo.lat0) * 1.112];
}

export function nearest(place: { lat: number; lng: number }, pool: Home[] = homes, n = 6) {
	return pool
		.map((h) => ({ home: h, miles: milesBetween(place, h) }))
		.sort((a, b) => a.miles - b.miles)
		.slice(0, n);
}

const POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const OUTCODE = /^[A-Z]{1,2}\d[A-Z\d]?$/i;

/**
 * Resolve what someone typed into a place. Postcodes and outcodes go to postcodes.io
 * (free, CORS-enabled); anything else is tried as a town there, then against our own homes.
 */
export async function resolvePlace(query: string, signal?: AbortSignal): Promise<Place | null> {
	const q = query.trim();
	if (!q) return null;
	const api = "https://api.postcodes.io";
	try {
		if (POSTCODE.test(q)) {
			const r = await fetch(`${api}/postcodes/${encodeURIComponent(q)}`, { signal });
			if (r.ok) {
				const { result } = await r.json();
				return { label: result.postcode, lat: result.latitude, lng: result.longitude };
			}
		} else if (OUTCODE.test(q)) {
			const r = await fetch(`${api}/outcodes/${encodeURIComponent(q)}`, { signal });
			if (r.ok) {
				const { result } = await r.json();
				return { label: result.outcode, lat: result.latitude, lng: result.longitude };
			}
		} else {
			const r = await fetch(`${api}/places?q=${encodeURIComponent(q)}&limit=5`, { signal });
			if (r.ok) {
				const { result } = await r.json();
				const best = (result ?? []).find((p: { local_type: string }) => /City|Town|Village|Suburban Area|Hamlet/.test(p.local_type)) ?? result?.[0];
				if (best) return { label: best.name_1, lat: best.latitude, lng: best.longitude };
			}
		}
	} catch (e) {
		if ((e as Error).name === "AbortError") throw e;
		// Offline or blocked: fall through to our own list of towns.
	}
	const local = homes.find((h) => h.town.toLowerCase() === q.toLowerCase() || h.name.toLowerCase().includes(q.toLowerCase()));
	return local ? { label: local.town, lat: local.lat, lng: local.lng } : null;
}
