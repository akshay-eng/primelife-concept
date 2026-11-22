import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { RevealText } from "@/components/Reveal";
import { ButtonLink, Marker, TLink } from "@/components/ui";
import { homeBySlug, momentById } from "@/lib/data";
import { FEATURED } from "@/lib/content";
import { gsap } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/asset";

export const photoSrc = (p: string) => (p.startsWith("/") ? asset(p) : (momentById.get(p)?.src ?? ""));

/** A src and srcset for a featured photo: splash images have a 900px copy, moments a 560px one. */
export function photoSet(p: string) {
	if (p.startsWith("/")) return { src: asset(p), srcSet: `${asset(p.replace(/\.webp$/, "-sm.webp"))} 900w, ${asset(p)} 1920w` };
	const m = momentById.get(p);
	return m ? { src: m.src, srcSet: `${m.srcSmall} 560w, ${m.src} 1400w` } : { src: "", srcSet: undefined };
}

const LAYOUT = ["lg:col-span-7 lg:row-span-2", "lg:col-span-5", "lg:col-span-5", "lg:col-span-6", "lg:col-span-6"];

export function Featured() {
	const root = useRef<HTMLElement>(null);
	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add("(prefers-reduced-motion: no-preference)", () => {
				for (const card of gsap.utils.toArray<HTMLElement>("[data-feature]")) {
					const img = card.querySelector("img");
					gsap.fromTo(
						card,
						{ clipPath: "inset(8% 6% 8% 6% round 40px)" },
						{ clipPath: "inset(0% 0% 0% 0% round 28px)", ease: "power3.out", duration: 1.2, scrollTrigger: { trigger: card, start: "top 88%", once: true } },
					);
					if (img) gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true } });
				}
			});
		},
		{ scope: root },
	);

	return (
		<section ref={root} aria-labelledby="featured-title" className="bg-paper py-[clamp(5rem,10vw,9rem)]">
			<div className="frame">
				<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
					<div className="max-w-2xl">
						<Marker>A few of our homes</Marker>
						<RevealText id="featured-title" className="type-h2 mt-5 text-ink">
							Every one is different, and each has a story.
						</RevealText>
					</div>
					<ButtonLink href="/homes" variant="ghost">
						All 63 homes
					</ButtonLink>
				</div>

				<ul className="mt-12 grid auto-rows-[minmax(20rem,auto)] gap-4 lg:grid-cols-12 lg:gap-5">
					{FEATURED.map((f, i) => {
						const home = homeBySlug.get(f.slug);
						if (!home) return null;
						return (
							<li key={f.slug} data-feature className={cn("group/feature relative min-h-[22rem] overflow-hidden rounded-[28px] bg-ink", LAYOUT[i])}>
								<TLink
									href={`/homes/${f.slug}`}
									onClick={(e) => {
										const img = e.currentTarget.querySelector("img");
										if (img) img.style.viewTransitionName = "home-photo";
									}}
									className="absolute inset-0 flex flex-col justify-end rounded-[28px] p-6 text-paper sm:p-8"
								>
									<img
										{...photoSet(f.photo)}
										sizes={i === 0 ? "(min-width: 1024px) 56vw, 92vw" : "(min-width: 1024px) 42vw, 92vw"}
										alt=""
										loading="lazy"
										decoding="async"
										className="absolute inset-[-7%] h-[114%] w-[114%] max-w-none object-cover transition-[scale] duration-300 ease-out-strong motion-safe:group-hover/feature:scale-[1.03]"
									/>
									<span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(30,26,25,0)_35%,rgba(30,26,25,0.82)_100%)]" />
									<span className="relative">
										<span className="type-label block text-sun-soft">{f.kicker}</span>
										<span className={cn("mt-2 block font-display font-[650] leading-[1.02] tracking-[-0.03em]", i === 0 ? "text-[clamp(2rem,3.6vw,3.4rem)]" : "text-[clamp(1.5rem,2.2vw,2.1rem)]")}>
											{f.title}
										</span>
										<span className={cn("type-small mt-3 block max-w-lg text-paper/85", i > 0 && "line-clamp-2")}>{f.line}</span>
										<span className="type-label mt-5 inline-flex items-center gap-2">
											Visit {home.name}
											<ArrowRight aria-hidden className="size-4 transition-transform duration-150 motion-safe:group-hover/feature:translate-x-1" strokeWidth={2.25} />
										</span>
									</span>
								</TLink>
							</li>
						);
					})}
				</ul>
			</div>
		</section>
	);
}
