// Homepage copy. Facts come from prime-life.co.uk, CQC and Companies House (see ../../research/company.md).

/** Photos for the hero ring, all from homes rated Good or not yet rated. */
export const HERO_PHOTOS = [
	"m131",
	"m004",
	"m028",
	"m063",
	"m065",
	"m091",
	"m096",
	"m105",
	"m119",
	"m122",
	"m133",
	"m135",
	"m137",
	"m138",
];

export const FEATURED = [
	{
		slug: "peaker-park-care-village",
		kicker: "Market Harborough",
		title: "A care village of 137 rooms",
		line: "Three homes on one site, opened in 2011, with its own bar, cinema lounge and Deaf Charter. Listed in the Knight Frank luxury care home guide.",
		photo: "/img/splash/peaker-park-people.webp",
	},
	{
		slug: "seacroft-court",
		kicker: "Skegness",
		title: "On the seafront, with an award-winning chef",
		line: "49 en-suite rooms on Seacroft Esplanade. Its chef, Ian Johnstone, was named Chef of the Year at the 2025 Lincolnshire Care Home Awards.",
		photo: "m096",
	},
	{
		slug: "rutland-care-village-cottages",
		kicker: "Oakham",
		title: "Cottages, a care home and Brambles",
		line: "Nursing and residential care beside 24 extra-care cottages, with Brambles, a social hall for families, at its heart.",
		photo: "/img/splash/rutland-lady.webp",
	},
	{
		slug: "st-michaels",
		kicker: "Waddington, Lincoln",
		title: "Where a Prime Minister came to tea",
		line: "In December 2023, Rishi Sunak visited a St Michaels resident who had met every Prime Minister before him.",
		photo: "/img/splash/visit-team.webp",
	},
	{
		slug: "phoenix-park-care-village",
		kicker: "Scunthorpe",
		title: "Three care centres, designed together",
		line: "A National Healthcare Design Awards finalist, with nursing and residential care for 77 people across three buildings.",
		photo: "m093",
	},
];

export const TESTIMONIALS = [
	{
		quote:
			"I was hugely impressed by the space, light, style and comfort of the home and the attitude and quality of the staff. Three weeks of superb, respectful, attentive and kind care has been wonderful for my 90 year old mother.",
		who: "Maggie H",
		role: "Daughter of a resident",
		home: "peaker-park-care-village",
	},
	{
		quote: "We live in London and visit the home unannounced. On every visit we have found the home clean, our mother is very well cared for in a safe and caring environment.",
		who: "Kensworth D",
		role: "Son of a resident",
		home: "st-georges",
	},
	{
		quote: "Before I came here I didn't have many friends. We all go on holiday with the staff twice a year, and the staff make sure we have a good time.",
		who: "Sally H",
		role: "Resident",
		home: "southfield-house",
	},
	{
		quote: "They provide my Father with excellent care and have made the difficult decision of moving my Father into care a much easier decision.",
		who: "Martin S",
		role: "Son of a resident",
		home: "mill-house",
	},
	{
		quote: "The care and support is second to none and nothing is too much trouble for the staff. They are all like family and it is most definitely home from home.",
		who: "Coral D",
		role: "Sister of a resident",
		home: "tamar-house",
	},
];

export const REGION_STORY = [
	{
		id: "all",
		title: "63 homes, and most of them an easy drive from Leicester",
		body: "We have run care homes from our office in Knighton, Leicester, since 1984. Every home on the map is ours, and every manager is named on its page.",
		camera: { target: [-0.3, 0, 0.35], distance: 7.2, tilt: 0.95 },
	},
	{
		id: "Leicestershire & Rutland",
		title: "Leicestershire and Rutland",
		body: "Twenty homes, from Stoneygate and Oadby to Shepshed, Market Harborough and Oakham. This is where PrimeLife began.",
		camera: { target: [0.28, 0, 0.6], distance: 3.3, tilt: 0.82 },
	},
	{
		id: "Lincolnshire",
		title: "Lincolnshire, from the Humber to the sea",
		body: "Twenty-one homes in Lincoln, Louth, Horncastle, Scunthorpe, Grimsby and on the Skegness seafront.",
		camera: { target: [0.82, 0, -0.18], distance: 3.4, tilt: 0.82 },
	},
	{
		id: "further",
		title: "And further afield",
		body: "Norfolk's north coast, Nottinghamshire, Derbyshire, Warwickshire and Solihull, Hull and the East Riding, Lancashire and Bristol.",
		camera: { target: [-0.2, 0, 0.35], distance: 6.2, tilt: 0.9 },
	},
] as const;

export const FUNDING = [
	{
		q: "Who pays for care?",
		a: "Most people's care is funded in one of three ways: by their local council after a needs and financial assessment, by the NHS through Continuing Healthcare when the need is mainly a health need, or privately. Many people combine them.",
	},
	{
		q: "What is NHS Continuing Healthcare?",
		a: "A package of care arranged and paid for by the NHS for people with a primary health need. Our social care professionals can help with the assessment and the paperwork.",
	},
	{
		q: "Can I choose a home if the council is paying?",
		a: "Yes. You can ask for a preferred home. If it costs more than the council's rate, a relative or friend can usually agree to pay the difference as a top-up.",
	},
	{
		q: "Who can I talk to?",
		a: "Our fees and funding helpline is free to call on 0800 046 3920, Monday to Friday. Whatever your means, we will try to find a place that works.",
	},
];
