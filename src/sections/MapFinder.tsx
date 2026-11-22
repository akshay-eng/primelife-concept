import { useGSAP } from "@gsap/react";
import { ArrowRight, Phone, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FluidHoverHighlight } from "@/components/fluid-hover-highlight";
import { FluidItem } from "@/components/FluidItem";
import { PostcodeSearch } from "@/components/PostcodeSearch";
import { RevealText } from "@/components/Reveal";
import { go, Marker, TLink } from "@/components/ui";
import { useFluidHover } from "@/hooks/use-fluid-hover";
import { CARE_FAMILIES, type Home, homeBySlug, homes, meta } from "@/lib/data";
import { REGION_STORY } from "@/lib/content";
import { finder, useFinder } from "@/lib/finder";
import { EASE_OUT } from "@/lib/motion";
import { nearest } from "@/lib/geo";
import { prefersReducedMotion, ScrollTrigger } from "@/lib/scroll";
import { spring } from "@/lib/springs";
import { useMedia } from "@/lib/useMedia";
import { cn } from "@/lib/utils";
import type { MapControl } from "@/three/MapScene";
import { hasWebGL } from "@/three/useFrameloopInView";

const MapScene = lazy(() => import("@/three/MapScene"));

function familyOf(id: string | null) {
	return CARE_FAMILIES.find((f) => f.id === id) ?? null;
}

export function useFilteredHomes() {
	const family = useFinder((s) => s.family);
	const place = useFinder((s) => s.place);
	return useMemo(() => {
		const fam = familyOf(family);
		const pool = fam ? homes.filter((h) => h.careTypes.some((t) => fam.types.includes(t))) : homes;
		const results = place
			? nearest(place, pool, pool.length)
			: [...pool].sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name)).map((home) => ({ home, miles: null as number | null }));
		return { pool, results, highlight: fam ? new Set(pool.map((h) => h.slug)) : null };
	}, [family, place]);
}

/** Care family chips: one selection at a time, with a pill that glides to the chosen chip. */
function FamilyChips() {
	const family = useFinder((s) => s.family);
	const options = [{ id: null, title: "All care" }, ...CARE_FAMILIES.map((f) => ({ id: f.id, title: f.title }))];
	return (
		<div role="radiogroup" aria-label="Type of care" className="flex flex-wrap gap-2">
			{options.map((o) => {
				const selected = family === o.id;
				return (
					<button
						key={o.id ?? "all"}
						type="button"
						role="radio"
						aria-checked={selected}
						onClick={() => finder.setFamily(o.id)}
						className={cn(
							"relative isolate h-11 rounded-full px-4 text-[0.95rem] font-semibold transition-[scale] duration-150 active:scale-[0.96]",
							selected ? "text-paper" : "text-ink shadow-[inset_0_0_0_1.5px_rgb(43_35_33/0.16)] hover:bg-hover",
						)}
					>
						{selected && <motion.span layoutId="family-pill" transition={spring.moderate} className="absolute inset-0 -z-10 rounded-full bg-ink" />}
						{o.title}
					</button>
				);
			})}
		</div>
	);
}

function ResultRow({ home, miles }: { home: Home; miles: number | null }) {
	return (
		<div className="relative z-[1] flex items-center gap-4 px-3 py-3.5 sm:px-4">
			<div className="size-16 shrink-0 overflow-hidden rounded-[14px] bg-paper-3">
				{home.thumb && <img src={home.thumb} alt="" loading="lazy" className="img-outline size-full object-cover" />}
			</div>
			<div className="min-w-0 flex-1">
				<TLink
					href={`/homes/${home.slug}`}
					onClick={(e) => {
						const img = e.currentTarget.closest("li")?.querySelector("img");
						if (img) img.style.viewTransitionName = "home-photo";
					}}
					className="type-label block truncate rounded-md text-[1.05rem] text-ink after:absolute after:inset-0 after:rounded-[20px] after:content-['']"
				>
					{home.name}
				</TLink>
				<p className="type-small truncate text-mute">
					{home.town}
					{miles !== null
						? ` · ${miles < 1 ? "under a mile" : `${miles.toFixed(miles < 10 ? 1 : 0)} miles`}`
						: home.region !== home.town
							? ` · ${home.region}`
							: ""}
				</p>
			</div>
			{home.phoneTel && (
				<a
					href={`tel:${home.phoneTel}`}
					className="relative z-[2] grid size-11 shrink-0 place-items-center rounded-full text-ember shadow-[inset_0_0_0_1.5px_rgb(201_64_15/0.28)] hover:bg-sun-soft"
				>
					<Phone aria-hidden className="size-[18px]" strokeWidth={2.25} />
					<span className="sr-only">
						Call {home.name} on {home.phone}
					</span>
				</a>
			)}
			<ArrowRight aria-hidden className="hidden size-5 shrink-0 text-stone sm:block" strokeWidth={2} />
		</div>
	);
}

function Results({ limit }: { limit: number }) {
	const { results, pool } = useFilteredHomes();
	const place = useFinder((s) => s.place);
	const status = useFinder((s) => s.status);
	const query = useFinder((s) => s.query);
	const listRef = useRef<HTMLUListElement>(null);
	const hover = useFluidHover(listRef, { axis: "y" });
	const shown = results.slice(0, limit);
	// A new search or filter re-deals the list with a short stagger; the first render does not animate.
	const family = useFinder((s) => s.family);
	const resultKey = `${place?.label ?? "all"}|${family ?? "any"}`;
	const firstKey = useRef(resultKey);
	useEffect(() => {
		const i = hover.activeIndex;
		finder.setFocus(i !== null && shown[i] ? shown[i].home.slug : null);
	}, [hover.activeIndex, shown]);

	return (
		<div className="mt-6">
			<div className="flex min-h-8 items-center justify-between gap-3">
				<p aria-live="polite" className="type-label text-stone">
					{status === "not-found"
						? `We could not find "${query}". Try a full postcode.`
						: place
							? `Nearest to ${place.label}`
							: `${pool.length} homes`}
				</p>
				{place && (
					<button type="button" onClick={finder.clear} className="type-label inline-flex items-center gap-1 rounded-full px-2 py-1 text-ember hover:bg-hover">
						<X aria-hidden className="size-4" strokeWidth={2.25} /> Clear
					</button>
				)}
			</div>
			<ul ref={listRef} {...hover.handlers} className="relative -mx-3 mt-2 sm:-mx-4">
				<FluidHoverHighlight hover={hover} className="rounded-[20px]" />
				{shown.map(({ home, miles }, i) => (
					<FluidItem key={home.slug} index={i} register={hover.registerItem} className="relative">
						<motion.div
							key={resultKey}
							initial={resultKey === firstKey.current ? false : { opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE_OUT, delay: Math.min(i, 8) * 0.03 } }}
						>
							<ResultRow home={home} miles={miles} />
						</motion.div>
					</FluidItem>
				))}
			</ul>
			{results.length > limit && (
				<TLink href="/homes" className="type-label mt-4 inline-flex items-center gap-2 rounded-full px-1 py-2 text-ember hover:underline">
					See all {results.length} homes <ArrowRight aria-hidden className="size-4" strokeWidth={2.25} />
				</TLink>
			)}
		</div>
	);
}

/**
 * The 3D map with the region story (home page) or just the finder (homes page).
 * Desktop: the map column is sticky beside the story and the finder.
 * Phones: the map is a sticky panel at the top of the same column, so the text scrolls beneath it.
 */
export function MapFinder({ story = true, limit = 7, title }: { story?: boolean; limit?: number; title?: string }) {
	const section = useRef<HTMLElement>(null);
	const mapBox = useRef<HTMLDivElement>(null);
	const [webgl] = useState(() => hasWebGL());
	const [step, setStep] = useState(0);
	const desktop = useMedia("(min-width: 1024px)");
	const { highlight, results } = useFilteredHomes();
	const place = useFinder((s) => s.place);
	const focus = useFinder((s) => s.focus);
	const near = useMemo(() => (place ? results.slice(0, 3).map((r) => r.home.slug) : []), [place, results]);

	const control = useRef<MapControl>({
		camera: REGION_STORY[0].camera,
		highlight: null,
		focus: null,
		place: null,
		nearest: [],
		reduced: prefersReducedMotion(),
	});
	control.current.highlight = highlight;
	control.current.focus = focus;
	control.current.place = place;
	control.current.nearest = near;
	control.current.camera = REGION_STORY[story ? step : 0].camera;

	// While the story plays, light up the homes in the region being told.
	if (story && !highlight && step > 0) {
		const region = REGION_STORY[step].id;
		const set =
			region === "further"
				? new Set(homes.filter((h) => !["Leicestershire & Rutland", "Lincolnshire"].includes(h.region)).map((h) => h.slug))
				: new Set(homes.filter((h) => h.region === region).map((h) => h.slug));
		control.current.highlight = set;
	}

	useGSAP(
		() => {
			if (!story) return;
			const steps = stepsIn(section.current);
			steps.forEach((el, i) => {
				ScrollTrigger.create({
					trigger: el,
					start: "top 60%",
					end: "bottom 40%",
					onToggle: (self) => self.isActive && setStep(i),
				});
			});
			ScrollTrigger.create({
				trigger: section.current?.querySelector("[data-finder]") ?? undefined,
				start: "top 65%",
				onEnter: () => setStep(0),
			});
		},
		{ scope: section, dependencies: [story, desktop], revertOnUpdate: true },
	);

	const onHover = useCallback((slug: string | null) => finder.setFocus(slug), []);
	const onSelect = useCallback((slug: string) => go(`/homes/${slug}`), []);
	const focusHome = focus ? homeBySlug.get(focus) : null;

	const mapPanel = (
		<div ref={mapBox} className="relative h-full overflow-hidden rounded-[28px] bg-[#f4ece1] shadow-[0_0_0_1px_rgb(43_35_33/0.06)] lg:rounded-[32px]">
			{webgl ? (
				<Suspense fallback={null}>
					<MapScene control={control} onHover={onHover} onSelect={onSelect} eventSource={mapBox} place={place} nearest={near} />
				</Suspense>
			) : (
				<div className="grid h-full place-items-center p-8 text-center text-stone">The map needs WebGL. Every home is listed beside it.</div>
			)}
			<div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-3 lg:p-5">
				<AnimatePresence mode="popLayout" initial={false}>
					{focusHome ? (
						<motion.p
							key={focusHome.slug}
							initial={{ opacity: 0, filter: "blur(4px)" }}
							animate={{ opacity: 1, filter: "blur(0px)", transition: { duration: 0.18 } }}
							exit={{ opacity: 0, transition: { duration: 0.1 } }}
							className="type-label rounded-full bg-paper/90 px-4 py-2 text-ink backdrop-blur"
						>
							{focusHome.name}, {focusHome.town}
						</motion.p>
					) : (
						<motion.p
							key="legend"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1, transition: { duration: 0.18 } }}
							exit={{ opacity: 0, transition: { duration: 0.1 } }}
							className="type-label flex items-center gap-2 rounded-full bg-paper/90 px-3.5 py-2 text-[0.875rem] text-stone backdrop-blur lg:px-4 lg:text-[0.9375rem]"
						>
							<span aria-hidden className="size-2.5 shrink-0 rounded-[3px] bg-sun" /> {desktop ? "A PrimeLife home. Hover or tap one to see it." : "A PrimeLife home. Tap one to see it."}
						</motion.p>
					)}
				</AnimatePresence>
			</div>
		</div>
	);

	return (
		<section
			ref={section}
			id="find"
			aria-labelledby="find-title"
			className={cn("relative bg-paper-2", story ? "py-[clamp(4.5rem,10vw,9rem)]" : "pb-[clamp(4rem,8vw,7rem)] pt-8 lg:pt-10")}
		>
			<div className="frame grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
				<div className="min-w-0">
					<header className="max-w-xl">
						<Marker>Our homes</Marker>
						<RevealText id="find-title" className="type-h2 mt-5 text-ink">
							{title ?? `${meta.stats.homes} homes. One family business.`}
						</RevealText>
					</header>

					{/* Phones: the map rides along at the top while the story and the results scroll beneath it. */}
					{!desktop && (
						<div className="sticky top-0 z-10 -mx-[clamp(1.1rem,3.2vw,3rem)] mt-6 bg-paper-2 px-[clamp(1.1rem,3.2vw,3rem)] pb-2 pt-3">
							<div className="h-[40svh] min-h-[260px]">{mapPanel}</div>
							<div aria-hidden className="pointer-events-none absolute inset-x-0 top-full h-8 bg-[linear-gradient(180deg,var(--color-paper-2),rgba(244,236,225,0))]" />
						</div>
					)}

					{story && (
						<ol className="lg:mt-6">
							{REGION_STORY.map((s, i) => (
								<li key={s.id} data-step className="flex min-h-[50svh] items-center py-6 lg:min-h-[78vh] lg:py-8">
									<div
										className={cn(
											"max-w-md transition-[opacity,translate] duration-500 ease-out-strong",
											step === i ? "translate-y-0 opacity-100" : "translate-y-2 opacity-35",
										)}
									>
										<p className="type-num text-[clamp(3rem,6vw,5.5rem)] text-sun">
											{s.id === "all"
												? homes.length
												: s.id === "further"
													? homes.filter((h) => !["Leicestershire & Rutland", "Lincolnshire"].includes(h.region)).length
													: homes.filter((h) => h.region === s.id).length}
										</p>
										<h3 className="type-h3 mt-3 text-ink">{s.title}</h3>
										<p className="type-body mt-3 text-stone">{s.body}</p>
									</div>
								</li>
							))}
						</ol>
					)}

					<div id="finder" data-finder className={cn("scroll-mt-[calc(40svh+2rem)] lg:scroll-mt-28", story ? "pt-4" : "mt-6")}>
						{story && <h3 className="type-h3 text-ink">Find a home near someone you love</h3>}
						<p className={cn("type-body text-stone", story && "mt-2")}>Search by postcode or town. We'll show the nearest homes and how far they are.</p>
						<div className="mt-6">
							<PostcodeSearch size="md" />
						</div>
						<div className="mt-5">
							<FamilyChips />
						</div>
						<Results limit={limit} />
					</div>
				</div>

				{desktop && (
					<div>
						<div className="sticky top-0 h-svh py-6">{mapPanel}</div>
					</div>
				)}
			</div>
		</section>
	);
}

function stepsIn(root: HTMLElement | null) {
	return root ? Array.from(root.querySelectorAll<HTMLElement>("[data-step]")) : [];
}
