import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { FluidHoverHighlight } from "@/components/fluid-hover-highlight";
import { FluidItem } from "@/components/FluidItem";
import { RevealText } from "@/components/Reveal";
import { Marker, TLink } from "@/components/ui";
import { useFluidHover } from "@/hooks/use-fluid-hover";
import { CONTACT, homeBySlug, type Moment, moments } from "@/lib/data";
import { gsap, ScrollTrigger } from "@/lib/scroll";
import { spring } from "@/lib/springs";
import { cn } from "@/lib/utils";

/** Homes with a current CQC rating below Good, or warning notices, are left out of the showcase. */
export const NOT_FEATURED = new Set([
	"charnwood-oaks",
	"holmes-house",
	"white-acres",
	"cherry-tree-lodge",
	"clarence-house",
	"kirklees",
	"loran-house",
	"river-meadows",
	"st-oggs",
	"tanworth-court",
]);

const MONTHS = ["October 2026", "September 2026", "August 2026", "July 2026"];
/** Halloween costumes and props read badly out of context on a care home's front page. */
const SKIP = new Set(["m006", "m009", "m012", "m014", "m026"]);

function pickFor(month: string) {
	return moments.filter((m) => m.month === month && m.home && !NOT_FEATURED.has(m.home) && !SKIP.has(m.id) && m.caption.length > 40).slice(0, 12);
}

function MomentCard({ m, i }: { m: Moment; i: number }) {
	const home = m.home ? homeBySlug.get(m.home) : null;
	const portrait = m.h > m.w;
	return (
		<figure
			data-card
			className={cn(
				"group/card relative flex shrink-0 snap-start flex-col",
				portrait ? "w-[min(72vw,20rem)] lg:w-[calc(var(--card-h)*0.75)]" : "w-[min(86vw,29rem)] lg:w-[calc(var(--card-h)*1.333)]",
				i % 2 === 1 && "lg:mt-[4svh]",
			)}
		>
			<div className={cn("relative overflow-hidden rounded-[26px] bg-paper-3", portrait ? "aspect-[3/4]" : "aspect-[4/3]")}>
				<img
					data-parallax
					src={m.src}
					srcSet={`${m.srcSmall} 560w, ${m.src} 1400w`}
					sizes="(min-width: 1024px) 36vw, 80vw"
					alt={`${m.homeName}: ${m.caption}`}
					loading="lazy"
					decoding="async"
					width={m.w}
					height={m.h}
					className="img-outline absolute inset-[-6%] h-[112%] w-[112%] max-w-none object-cover"
				/>
			</div>
			<figcaption className="mt-4 pr-4">
				<p className="type-label text-ember">
					{home ? (
						<TLink href={`/homes/${home.slug}`} className="hover:underline">
							{m.homeName}, {home.town}
						</TLink>
					) : (
						m.homeName
					)}
				</p>
				<p className="type-small mt-1.5 line-clamp-3 text-stone">{m.caption}</p>
			</figcaption>
		</figure>
	);
}

export function Moments() {
	const section = useRef<HTMLElement>(null);
	const track = useRef<HTMLDivElement>(null);
	const tabsRef = useRef<HTMLDivElement>(null);
	const hover = useFluidHover(tabsRef, { axis: "x" });
	const [month, setMonth] = useState("August 2026");
	const picks = useMemo(() => pickFor(month), [month]);

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
				const el = track.current;
				if (!el) return;
				const distance = () => Math.max(0, el.scrollWidth - window.innerWidth + 64);
				const tween = gsap.to(el, {
					x: () => -distance(),
					ease: "none",
					scrollTrigger: {
						trigger: section.current,
						start: "top top",
						end: () => `+=${distance()}`,
						pin: true,
						scrub: 0.6,
						invalidateOnRefresh: true,
						anticipatePin: 1,
					},
				});
				// Each photo drifts inside its frame against the direction of travel.
				for (const img of el.querySelectorAll<HTMLElement>("[data-parallax]")) {
					gsap.fromTo(
						img,
						{ xPercent: -4 },
						{ xPercent: 4, ease: "none", scrollTrigger: { trigger: img, containerAnimation: tween, start: "left right", end: "right left", scrub: true } },
					);
				}
				for (const card of el.querySelectorAll<HTMLElement>("[data-card]")) {
					gsap.from(card, {
						opacity: 0,
						y: 40,
						duration: 0.9,
						ease: "power3.out",
						scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 92%", once: true },
					});
				}
			});
		},
		{ scope: section, dependencies: [month], revertOnUpdate: true },
	);

	const selectMonth = (m: string) => {
		setMonth(m);
		requestAnimationFrame(() => ScrollTrigger.refresh());
	};

	return (
		<section ref={section} id="life" aria-labelledby="life-title" className="relative overflow-hidden bg-paper lg:h-svh [--card-h:clamp(16rem,47svh,33rem)]">
			<div className="flex h-full flex-col justify-center py-[clamp(4rem,8vw,7rem)] lg:py-0">
				<div className="frame flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
					<div className="max-w-2xl">
						<Marker>Enjoying life at PrimeLife</Marker>
						<RevealText id="life-title" className="type-h2 mt-5 text-ink">
							Every month, every home sends us its best days.
						</RevealText>
						<p className="type-body mt-4 max-w-xl text-stone">
							Days out, birthdays, visiting alpacas and Friday bingo. A few of this year's, in their own words. There are hundreds more on{" "}
							<a href={CONTACT.facebook} target="_blank" rel="noreferrer" className="font-semibold text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ember">
								our Facebook page <ArrowUpRight aria-hidden className="inline size-4" />
							</a>
							.
						</p>
					</div>
					<div ref={tabsRef} {...hover.handlers} role="tablist" aria-label="Month" className="relative flex w-fit max-w-full shrink-0 gap-1 overflow-x-auto rounded-full bg-paper-2 p-1.5 [scrollbar-width:none]">
						<FluidHoverHighlight hover={hover} className="rounded-full" />
						{MONTHS.map((m, i) => {
							const selected = m === month;
							return (
								<FluidItem
									as="button"
									key={m}
									index={i}
									register={hover.registerItem}
									type="button"
									role="tab"
									aria-selected={selected}
									onClick={() => selectMonth(m)}
									className={cn("relative h-11 shrink-0 rounded-full px-4 text-[0.95rem] font-semibold", selected ? "text-paper" : "text-ink")}
								>
									{selected && <motion.span layoutId="month-pill" transition={spring.moderate} className="absolute inset-0 rounded-full bg-ink" />}
									<span className="relative">{m.split(" ")[0]}</span>
								</FluidItem>
							);
						})}
					</div>
				</div>
				<div className="mt-10 snap-x snap-mandatory scroll-pl-[clamp(1.1rem,3.2vw,3rem)] overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:none] lg:mt-[5svh] lg:snap-none lg:overflow-visible lg:pb-0">
					<div ref={track} key={month} className="flex w-max items-start gap-5 pl-[clamp(1.1rem,3.2vw,3rem)] pr-16 lg:gap-7">
						{picks.map((m, i) => (
							<MomentCard key={m.id} m={m} i={i} />
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
