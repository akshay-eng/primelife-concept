import { useGSAP } from "@gsap/react";
import { ArrowRight, Phone } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { lazy, Suspense, useCallback, useMemo, useRef, useState } from "react";
import { PostcodeSearch } from "@/components/PostcodeSearch";
import { go, Marker } from "@/components/ui";
import { CONTACT, homeBySlug, momentById, YEARS } from "@/lib/data";
import { HERO_PHOTOS } from "@/lib/content";
import { EASE, gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import type { HeroControl } from "@/three/HeroScene";
import { hasWebGL } from "@/three/useFrameloopInView";
import { EASE_OUT } from "@/lib/motion";

const HeroScene = lazy(() => import("@/three/HeroScene"));

const LEAD =
	"Residential, nursing and dementia care, and support for adults with learning disabilities and mental-health needs, in 63 homes run by one family business from Leicester.";

const FACTS = [
	{ n: "63", label: "homes across England" },
	{ n: "2,800", label: "carers and staff" },
	{ n: String(YEARS), label: `years, since 1984` },
];

export function Hero() {
	const section = useRef<HTMLElement>(null);
	const card = useRef<HTMLDivElement>(null);
	const [webgl] = useState(() => hasWebGL());
	const [ready, setReady] = useState(false);
	const [hovered, setHovered] = useState(-1);
	const armed = useRef(-1);
	const control = useRef<HeroControl>({ exit: 0, hovered: -1, reduced: prefersReducedMotion() });
	const photos = useMemo(() => HERO_PHOTOS.map((id) => momentById.get(id)).filter((m) => m !== undefined), []);
	const active = hovered >= 0 ? photos[hovered] : null;
	const activeHome = active?.home ? homeBySlug.get(active.home) : null;

	const onHover = useCallback((i: number) => {
		control.current.hovered = i;
		if (i < 0) armed.current = -1;
		setHovered(i);
	}, []);
	// Touch: the first tap on a photo shows its caption, a second tap on the same photo opens the home.
	const onSelect = useCallback(
		(i: number, pointerType: string) => {
			if (pointerType !== "mouse" && armed.current !== i) {
				armed.current = i;
				onHover(i);
				return;
			}
			const m = photos[i];
			if (m?.home) go(`/homes/${m.home}`);
		},
		[photos, onHover],
	);
	const onReady = useCallback(() => setReady(true), []);

	useGSAP(
		() => {
			ScrollTrigger.create({
				trigger: section.current,
				start: "top top",
				end: "bottom top",
				onUpdate: (self) => {
					control.current.exit = self.progress;
				},
			});
			const mm = gsap.matchMedia();
			mm.add("(prefers-reduced-motion: no-preference)", () => {
				gsap.from("[data-hero-in]", { y: 22, opacity: 0, filter: "blur(6px)", duration: 1, ease: EASE.enter, stagger: 0.1, delay: 0.45, clearProps: "filter" });
				gsap.from(card.current, { scale: 0.97, opacity: 0, duration: 1.1, ease: EASE.enter });
				// The card eases back and rounds off as the page moves on.
				gsap.to(card.current, {
					scale: 0.94,
					ease: "none",
					scrollTrigger: { trigger: section.current, start: "top top", end: "bottom top", scrub: true },
				});
			});
		},
		{ scope: section },
	);

	return (
		<section ref={section} aria-labelledby="hero-title" className="relative pt-[84px]">
			<div className="frame">
				<div
					ref={card}
					className={cn(
						"grain relative isolate flex flex-col overflow-hidden rounded-[40px] md:block md:h-[calc(100svh-96px)] md:min-h-[660px]",
						hovered >= 0 && "cursor-pointer",
					)}
					style={{
						background:
							"radial-gradient(60% 55% at 50% 46%, #ffe7d8 0%, rgba(255,231,216,0) 70%), radial-gradient(40% 45% at 88% 96%, rgba(241,89,42,0.20) 0%, rgba(241,89,42,0) 70%), radial-gradient(45% 40% at 6% 4%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%), linear-gradient(180deg, #f5e9dc 0%, #f1e2d1 100%)",
					}}
				>
					<h1 id="hero-title" className={webgl ? "sr-only" : "type-mega px-6 pt-24 text-ink md:absolute md:left-8 md:top-28"}>
						Enjoy <span className="text-sun">life.</span>
						<span className="sr-only"> PrimeLife care homes across England since 1984.</span>
					</h1>

					{webgl && (
						<div className="relative h-[58svh] min-h-[380px] md:absolute md:inset-0 md:h-auto">
							<Suspense fallback={null}>
								<HeroScene photos={photos} control={control} onHover={onHover} onSelect={onSelect} onReady={onReady} eventSource={card} />
							</Suspense>
							<div
								aria-hidden
								className={cn(
									"pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-500",
									ready ? "opacity-0" : "opacity-100",
								)}
							>
								<span className="type-mega text-ink/10">Enjoy</span>
							</div>
						</div>
					)}

					{/* Soft scrims so the copy stays legible over passing photos */}
					<div
						aria-hidden
						className="pointer-events-none absolute left-0 top-0 hidden h-[52%] w-[48%] md:block"
						style={{ background: "radial-gradient(90% 85% at 0% 0%, rgba(245,233,220,0.97) 0%, rgba(245,233,220,0.86) 45%, rgba(245,233,220,0) 80%)" }}
					/>
					<div
						aria-hidden
						className="pointer-events-none absolute bottom-0 right-0 hidden h-[64%] w-[30%] md:block"
						style={{ background: "radial-gradient(90% 75% at 100% 100%, rgba(241,226,209,0.95) 0%, rgba(241,226,209,0.8) 40%, rgba(241,226,209,0) 80%)" }}
					/>

					{/* Top row: who we are (desktop), and a note on the photos */}
					<div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-6 p-5 md:p-8">
						<div className="max-w-[24rem] xl:max-w-[27rem]">
							<div data-hero-in>
								<Marker>Care homes across England since 1984</Marker>
							</div>
							<p data-hero-in className="type-lead mt-5 hidden text-ink md:block">
								{LEAD}
							</p>
						</div>
						<p data-hero-in className="type-label hidden max-w-[15rem] text-right text-stone lg:block">
							The photos are this year's days out and days in, sent by our homes each month.
						</p>
					</div>

					{/* Hover caption for the photo under the pointer */}
					<div aria-live="polite" className="pointer-events-none absolute inset-x-0 top-[calc(58svh-6.75rem)] flex justify-center px-4 md:top-20 md:px-0">
						<AnimatePresence mode="popLayout">
							{active && (
								<motion.div
									key={active.id}
									initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
									animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.22, ease: EASE_OUT } }}
									exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.12 } }}
									className="max-w-[22rem] rounded-[20px] bg-ink/90 px-4 py-3 text-paper shadow-[0_20px_50px_-20px_rgb(0_0_0/0.5)] backdrop-blur-md md:rounded-[22px] md:px-5 md:py-4"
								>
									<p className="type-label text-sun">
										{active.homeName}
										{activeHome ? `, ${activeHome.town}` : ""} · {active.month}
									</p>
									<p className="type-small mt-1 line-clamp-2 text-paper/90 md:line-clamp-3">{active.caption}</p>
									{active.home && (
										<p className="type-label mt-2 inline-flex items-center gap-1.5 text-paper">
											<span className="md:hidden">Tap again to visit</span>
											<span className="hidden md:inline">Visit this home</span>
											<ArrowRight aria-hidden className="size-4" strokeWidth={2.25} />
										</p>
									)}
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					{/* Bottom row: what we do, the search, and three facts */}
					<div className="pointer-events-none relative flex flex-col gap-8 p-5 pb-7 md:absolute md:inset-x-0 md:bottom-0 md:flex-row md:items-end md:justify-between md:p-8 lg:pr-10">
						<div className="pointer-events-auto max-w-[35rem]">
							<p data-hero-in className="type-lead mb-6 text-ink md:hidden">
								{LEAD}
							</p>
							<div data-hero-in>
								<PostcodeSearch scrollTo="#finder" />
							</div>
							<p
								data-hero-in
								className="type-small mt-3 inline-flex flex-wrap items-center gap-x-2 rounded-full bg-paper/75 px-4 py-2 text-stone backdrop-blur-md md:shadow-[0_0_0_1px_rgb(43_35_33/0.06)]"
							>
								<span>Or call</span>
								<a href={`tel:${CONTACT.sales.tel}`} className="inline-flex items-center gap-1.5 font-semibold text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ember">
									<Phone aria-hidden className="size-4 text-ember" strokeWidth={2.25} />
									{CONTACT.sales.display}
								</a>
								<span className="text-mute">{CONTACT.hours}</span>
							</p>
						</div>
						<dl data-hero-in className="pointer-events-auto grid grid-cols-3 gap-4 md:flex md:flex-col md:items-end md:gap-5 md:text-right">
							{FACTS.map((f) => (
								<div key={f.label} className="flex flex-col md:items-end">
									<dt className="sr-only">{f.label}</dt>
									<dd className="type-num text-[clamp(2.4rem,4.2vw,4.25rem)] text-ink">{f.n}</dd>
									<dd className="type-label mt-1.5 text-stone">{f.label}</dd>
								</div>
							))}
						</dl>
					</div>
				</div>
			</div>
		</section>
	);
}
