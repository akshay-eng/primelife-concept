import { useGSAP } from "@gsap/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, FileText, Mail, MapPin, Phone } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Reveal, RevealText } from "@/components/Reveal";
import { ButtonLink, Marker, TLink } from "@/components/ui";
import { CONTACT, homeBySlug, homes, momentById, moments } from "@/lib/data";
import { FEATURED, TESTIMONIALS } from "@/lib/content";
import { nearest } from "@/lib/geo";
import { EASE, gsap, prefersReducedMotion } from "@/lib/scroll";
import { NOT_FEATURED } from "@/sections/Moments";
import type { MapControl } from "@/three/MapScene";
import { hasWebGL } from "@/three/useFrameloopInView";
import NotFound from "./NotFound";
import { asset } from "@/lib/asset";

const MapScene = lazy(() => import("@/three/MapScene"));

export default function HomeDetail({ slug }: { slug: string }) {
	const home = homeBySlug.get(slug);
	const root = useRef<HTMLDivElement>(null);
	const mapBox = useRef<HTMLDivElement>(null);
	const [webgl] = useState(() => hasWebGL());

	const own = useMemo(() => moments.filter((m) => m.home === slug), [slug]);
	const featured = FEATURED.find((f) => f.slug === slug);
	const heroSrc = featured
		? featured.photo.startsWith("/")
			? asset(featured.photo)
			: momentById.get(featured.photo)?.src
		: (own.find((m) => m.w > m.h)?.src ?? home?.thumb ?? own[0]?.src);
	const curated = TESTIMONIALS.find((t) => t.home === slug);
	const quote = curated ?? (home?.quotes[0] ? { ...home.quotes[0], role: home.quotes[0].role } : undefined);
	const close = useMemo(() => (home ? nearest(home, homes.filter((h) => h.slug !== slug), 3) : []), [home, slug]);

	const control = useRef<MapControl>({
		camera: home ? { target: [home.x, 0, -home.y], distance: 3.6, tilt: 0.84 } : { target: [0, 0, 0], distance: 7, tilt: 0.9 },
		highlight: new Set([slug]),
		focus: slug,
		place: null,
		nearest: [],
		reduced: prefersReducedMotion(),
	});

	useEffect(() => {
		if (home) document.title = `${home.name}, ${home.town} | PrimeLife`;
		return () => {
			document.title = "PrimeLife | Care homes across England since 1984";
		};
	}, [home]);

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add("(prefers-reduced-motion: no-preference)", () => {
				gsap.from("[data-in]", { y: 20, opacity: 0, filter: "blur(6px)", duration: 0.9, ease: EASE.enter, stagger: 0.08, delay: 0.15, clearProps: "filter" });
			});
		},
		{ scope: root, dependencies: [slug] },
	);

	if (!home) return <NotFound />;
	const showcase = !NOT_FEATURED.has(slug);
	const visitMail = `mailto:${CONTACT.general.email}?subject=${encodeURIComponent(`Arranging a visit to ${home.name}`)}`;

	return (
		<div ref={root} className="pt-[84px]">
			<section className="frame">
				<TLink href="/homes" className="type-label inline-flex items-center gap-2 rounded-full py-2 text-stone hover:text-ink">
					<ArrowLeft aria-hidden className="size-4" strokeWidth={2.25} /> All homes
				</TLink>
				<div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-14">
					<div className="flex flex-col justify-end">
						<div data-in>
							<Marker>
								{home.town}, {home.region}
							</Marker>
						</div>
						<h1 data-in className="type-display mt-5 text-ink">
							{home.name}
						</h1>
						<p data-in className="type-lead mt-6 max-w-xl text-stone">
							{home.description[0]}
						</p>
						<dl data-in className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
							{home.capacity && (
								<div>
									<dt className="type-label text-mute">Places</dt>
									<dd className="type-num mt-1 text-[2.6rem] text-ink">{home.capacity}</dd>
								</div>
							)}
							<div>
								<dt className="type-label text-mute">Kinds of care</dt>
								<dd className="type-num mt-1 text-[2.6rem] text-ink">{home.careTypes.length}</dd>
							</div>
							{home.manager && (
								<div className="col-span-2 sm:col-span-1">
									<dt className="type-label text-mute">Home manager</dt>
									<dd className="type-h3 mt-2 text-[1.35rem] text-ink">{home.manager}</dd>
								</div>
							)}
						</dl>
						<div data-in className="mt-9 flex flex-wrap gap-3">
							{home.phoneTel && (
								<ButtonLink href={`tel:${home.phoneTel}`} size="lg" arrow={false} icon={<Phone aria-hidden className="size-5" />}>
									Call {home.phone}
								</ButtonLink>
							)}
							<ButtonLink href={visitMail} variant="ghost" size="lg" arrow={false} icon={<Mail aria-hidden className="size-5" />}>
								Arrange a visit
							</ButtonLink>
						</div>
						<p data-in className="type-small mt-5 flex items-start gap-2 text-stone">
							<MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-ember" /> {home.address}
						</p>
					</div>
					<div className="relative aspect-[4/3] overflow-hidden rounded-[32px] bg-paper-3 lg:aspect-auto lg:min-h-[34rem]">
						{heroSrc && <img src={heroSrc} alt={`${home.name}`} className="absolute inset-0 size-full object-cover" style={{ viewTransitionName: "home-photo" }} />}
					</div>
				</div>
			</section>

			<section className="frame mt-[clamp(4rem,8vw,7rem)] grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
				<div>
					{home.description.length > 1 && (
						<>
							<RevealText className="type-h2 mb-6 text-ink">About {home.name}</RevealText>
							<Reveal className="mb-12 space-y-4" selector="p" stagger={0.06}>
								{home.description.slice(1).map((d) => (
									<p key={d.slice(0, 40)} className="type-body max-w-2xl text-stone">
										{d}
									</p>
								))}
							</Reveal>
						</>
					)}
					<h3 className="type-h3 text-ink">Care at this home</h3>
					<ul className="mt-5 flex flex-wrap gap-2">
						{home.careTypes.map((t) => (
							<li key={t} className="type-label rounded-full bg-paper-2 px-4 py-2.5 text-ink">
								{t}
							</li>
						))}
					</ul>
					{home.amenities.length > 0 && (
						<>
							<h3 className="type-h3 mt-12 text-ink">Around the home</h3>
							<ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
								{home.amenities.map((a) => (
									<li key={a} className="type-body flex items-start gap-3 text-stone">
										<Check aria-hidden className="mt-1 size-5 shrink-0 text-ember" strokeWidth={2.25} /> {a}
									</li>
								))}
							</ul>
						</>
					)}
					<div className="mt-12 flex flex-wrap gap-4">
						{home.brochure && (
							<a href={home.brochure} target="_blank" rel="noreferrer" className="type-label inline-flex items-center gap-2 rounded-full bg-paper-2 px-5 py-3 text-ink hover:bg-paper-3">
								<FileText aria-hidden className="size-4" /> Download the brochure (PDF)
							</a>
						)}
						<a href={home.url} target="_blank" rel="noreferrer" className="type-label inline-flex items-center gap-2 rounded-full px-2 py-3 text-ember hover:underline">
							This home on prime-life.co.uk <ArrowUpRight aria-hidden className="size-4" />
						</a>
					</div>
				</div>

				<aside className="flex flex-col gap-5">
					<div ref={mapBox} className="relative aspect-square overflow-hidden rounded-[28px] bg-[#f4ece1] shadow-[0_0_0_1px_rgb(43_35_33/0.06)]">
						{webgl && (
							<Suspense fallback={null}>
								<MapScene control={control} onHover={() => {}} onSelect={() => {}} eventSource={mapBox} place={null} nearest={[]} />
							</Suspense>
						)}
					</div>
					{quote && (
						<figure className="rounded-[28px] bg-paper-2 p-7">
							<blockquote className="line-clamp-[9] font-display text-[1.35rem] font-[560] leading-[1.22] tracking-[-0.02em] text-ink">“{quote.quote}”</blockquote>
							<figcaption className="type-small mt-4 text-stone">
								{quote.who}, {quote.role.toLowerCase()}
							</figcaption>
						</figure>
					)}
				</aside>
			</section>

			{showcase && own.length > 0 && (
				<section className="mt-[clamp(4rem,8vw,7rem)] bg-paper-2 py-[clamp(4rem,8vw,7rem)]">
					<div className="frame">
						<Marker>Enjoying life at {home.name}</Marker>
						<RevealText className="type-h2 mt-5 text-ink">Recent days at the home.</RevealText>
						<Reveal className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" selector="figure" stagger={0.08}>
							{own.slice(0, 4).map((m) => (
								<figure key={m.id}>
									<div className="aspect-[3/4] overflow-hidden rounded-[24px] bg-paper-3">
										<img src={m.srcSmall} alt={m.caption} loading="lazy" className="img-outline size-full object-cover" />
									</div>
									<figcaption className="mt-3">
										<p className="type-label text-ember">{m.month}</p>
										<p className="type-small mt-1 line-clamp-3 text-stone">{m.caption}</p>
									</figcaption>
								</figure>
							))}
						</Reveal>
					</div>
				</section>
			)}

			<section className="frame py-[clamp(4rem,8vw,7rem)]">
				<h2 className="type-h3 text-ink">Nearby PrimeLife homes</h2>
				<ul className="mt-6 grid gap-4 md:grid-cols-3">
					{close.map(({ home: h, miles }) => (
						<li key={h.slug}>
							<TLink href={`/homes/${h.slug}`} className="group/near flex items-center gap-4 rounded-[24px] bg-paper-2 p-4 hover:bg-paper-3">
								<div className="size-16 shrink-0 overflow-hidden rounded-[14px] bg-paper-3">{h.thumb && <img src={h.thumb} alt="" className="size-full object-cover" />}</div>
								<div className="min-w-0 flex-1">
									<p className="type-label truncate text-ink">{h.name}</p>
									<p className="type-small text-mute">
										{h.town} · {miles.toFixed(miles < 10 ? 1 : 0)} miles
									</p>
								</div>
								<ArrowRight aria-hidden className="size-5 text-stone transition-transform duration-150 motion-safe:group-hover/near:translate-x-0.5" />
							</TLink>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}
