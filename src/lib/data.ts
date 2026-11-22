import geoJson from "@/data/geo.json";
import homesJson from "@/data/homes.json";
import metaJson from "@/data/meta.json";
import momentsJson from "@/data/moments.json";
import { asset } from "@/lib/asset";

export type Home = {
	slug: string;
	name: string;
	url: string;
	phone: string | null;
	phoneTel: string | null;
	address: string;
	postcode: string | null;
	town: string;
	region: string;
	lat: number;
	lng: number;
	x: number;
	y: number;
	manager: string | null;
	capacity: number | null;
	careTypes: string[];
	amenities: string[];
	description: string[];
	thumb: string | null;
	brochure: string | null;
	photos: string[];
};

export type Moment = {
	id: string;
	month: string;
	heading: string;
	home: string | null;
	homeName: string;
	caption: string;
	post: string;
	src: string;
	srcSmall: string;
	w: number;
	h: number;
};

export type Geo = {
	lat0: number;
	lng0: number;
	k: number;
	land: [number, number][][];
	neighbour: [number, number][][];
};

// Town names the scraper could not separate from the street line.
const TOWN_FIXES: Record<string, string> = { "manor-house": "Alkborough", "brockshill-woodlands": "Oadby" };

export type HomeQuote = { quote: string; who: string; role: string };

/** The scrape ran amenities on into each page's testimonials; split them back apart. */
function splitAmenities(list: string[]): { amenities: string[]; quotes: HomeQuote[] } {
	const at = list.indexOf("Testimonials");
	if (at < 0) return { amenities: list, quotes: [] };
	const quotes: HomeQuote[] = [];
	let buffer: string[] = [];
	for (const line of list.slice(at + 1)) {
		const m = line.match(/^([^()]{1,48})\((.+)\)\s*$/);
		if (m && buffer.length) {
			quotes.push({ quote: buffer.join(" "), who: m[1].trim(), role: m[2].trim() });
			buffer = [];
		} else buffer.push(line);
	}
	return { amenities: list.slice(0, at), quotes };
}

export const homes: (Home & { quotes: HomeQuote[] })[] = (homesJson as Home[]).map((h) => {
	const { amenities, quotes } = splitAmenities(h.amenities);
	return { ...h, amenities, quotes, thumb: h.thumb ? asset(h.thumb) : null, town: TOWN_FIXES[h.slug] ?? h.town };
});
export const moments = (momentsJson as Moment[]).map((m) => ({ ...m, src: asset(m.src), srcSmall: asset(m.srcSmall) }));
export const geo = geoJson as Geo;
export const meta = metaJson as {
	stats: { homes: number; places: number; placesKnownFor: number; careTypes: number; regions: number; founded: number };
	careTypes: { name: string; count: number }[];
	regions: { name: string; count: number }[];
};

export const homeBySlug = new Map(homes.map((h) => [h.slug, h]));
export const momentById = new Map(moments.map((m) => [m.id, m]));

export const YEARS = new Date().getFullYear() - 1984;

export const CONTACT = {
	general: { label: "General enquiries", display: "0116 270 5678", tel: "+441162705678", email: "info@prime-life.co.uk" },
	sales: { label: "Finding a home", display: "0116 274 6404", tel: "+441162746404" },
	hr: { label: "Recruitment and HR", display: "0116 274 6412", tel: "+441162746412", email: "recruitment@prime-life.co.uk" },
	funding: { label: "Fees and funding helpline", display: "0800 046 3920", tel: "+448000463920" },
	hours: "Monday to Friday, 8:30am to 5pm",
	office: ["Caernarvon House", "121 Knighton Church Road", "Leicester LE2 3JN"],
	careers: "https://careers.prime-life.co.uk/",
	cqc: "https://www.cqc.org.uk/provider/1-102642921/services",
	facebook: "https://www.facebook.com/PrimeLifeUK",
	instagram: "https://www.instagram.com/primelifeuk/",
	linkedin: "https://www.linkedin.com/company/primelife-ltd/",
	x: "https://twitter.com/PrimelifeUK",
	live: (p: string) => `https://prime-life.co.uk${p}`,
};

/** Four plain-English families over the fifteen registered care types. */
export const CARE_FAMILIES: { id: string; title: string; line: string; types: string[]; photo: string }[] = [
	{
		id: "older",
		title: "Later life and dementia",
		line: "Residential, nursing and dementia care, short respite stays, and care at the end of life.",
		types: ["Elderly Care", "Dementia Care", "Nursing Care", "Palliative Care", "Respite Care"],
		photo: "m091",
	},
	{
		id: "ld",
		title: "Learning and physical disability",
		line: "Homes built around routines, independence and the people someone already loves.",
		types: ["Learning Disability", "Physical Disability", "Sensory Impairment", "Day Care"],
		photo: "m119",
	},
	{
		id: "mh",
		title: "Mental health",
		line: "Specialist care and rehabilitation, including for behaviour that is complex and challenging.",
		types: ["Mental Health Needs", "Mental Disability", "Rehabilitative Services"],
		photo: "m133",
	},
	{
		id: "home",
		title: "Back home, or a home of your own",
		line: "Reablement after a hospital stay, supported living flats and cottages, and care at home.",
		types: ["Reablement and Active Recovery", "Supported Living", "Domiciliary Care"],
		photo: "m046",
	},
];

export const homesWithAny = (types: string[]) => homes.filter((h) => h.careTypes.some((t) => types.includes(t)));
