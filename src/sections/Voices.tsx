import { ArrowLeft, ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { Marker, TLink } from "@/components/ui";
import { CONTACT, homeBySlug, YEARS } from "@/lib/data";
import { TESTIMONIALS } from "@/lib/content";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";
import { asset } from "@/lib/asset";

export function Voices() {
	const [i, setI] = useState(0);
	const [dir, setDir] = useState(1);
	const [paused, setPaused] = useState(false);
	const t = TESTIMONIALS[i];
	const home = homeBySlug.get(t.home);
	const step = (d: number) => {
		setDir(d);
		setI((v) => (v + d + TESTIMONIALS.length) % TESTIMONIALS.length);
	};
	useEffect(() => {
		if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const id = window.setTimeout(() => step(1), 9000);
		return () => window.clearTimeout(id);
	}, [i, paused]);

	return (
		<section aria-labelledby="voices-title" className="relative overflow-hidden bg-paper-2 py-[clamp(5rem,10vw,9rem)]">
			<div className="frame grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:gap-16">
				<div onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
					<Marker>In their words</Marker>
					<h2 id="voices-title" className="sr-only">
						What families and residents say
					</h2>
					<div className="relative mt-8 min-h-[22rem] sm:min-h-[19rem]">
						<AnimatePresence mode="popLayout" initial={false} custom={dir}>
							<motion.figure
								key={i}
								custom={dir}
								initial={{ opacity: 0, y: dir * 16, filter: "blur(6px)" }}
								animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.42, ease: EASE_OUT } }}
								exit={{ opacity: 0, y: dir * -10, filter: "blur(4px)", transition: { duration: 0.18 } }}
							>
								<blockquote className="font-display text-[clamp(1.7rem,3.3vw,3.1rem)] font-[560] leading-[1.12] tracking-[-0.025em] text-ink [font-variation-settings:'opsz'_48,'wdth'_96]">
									<span aria-hidden className="text-sun">“</span>
									{t.quote}
									<span aria-hidden className="text-sun">”</span>
								</blockquote>
								<figcaption className="type-body mt-7 text-stone">
									<span className="font-semibold text-ink">{t.who}</span>, {t.role.toLowerCase()}
									{home && (
										<>
											{" at "}
											<TLink href={`/homes/${home.slug}`} className="font-semibold text-ember underline decoration-ember/30 underline-offset-4 hover:decoration-ember">
												{home.name}
											</TLink>
										</>
									)}
								</figcaption>
							</motion.figure>
						</AnimatePresence>
					</div>
					<div className="mt-8 flex items-center gap-3">
						<button type="button" onClick={() => step(-1)} className="grid size-12 place-items-center rounded-full bg-paper text-ink shadow-[0_0_0_1px_rgb(43_35_33/0.1)] transition-[scale] duration-150 hover:bg-white active:scale-[0.96]">
							<ArrowLeft aria-hidden className="size-5" strokeWidth={2.25} />
							<span className="sr-only">Previous quote</span>
						</button>
						<button type="button" onClick={() => step(1)} className="grid size-12 place-items-center rounded-full bg-paper text-ink shadow-[0_0_0_1px_rgb(43_35_33/0.1)] transition-[scale] duration-150 hover:bg-white active:scale-[0.96]">
							<ArrowRight aria-hidden className="size-5" strokeWidth={2.25} />
							<span className="sr-only">Next quote</span>
						</button>
						<div className="ml-3 flex gap-1.5" aria-hidden>
							{TESTIMONIALS.map((q, n) => (
								<span key={q.who} className="relative h-1.5 w-8 overflow-hidden rounded-full bg-ink/15">
									<span
										className={cn(
											"absolute inset-0 origin-left rounded-full bg-ink transition-[scale] duration-300 ease-out-strong",
											n === i ? "scale-x-100" : "scale-x-0",
										)}
									/>
								</span>
							))}
						</div>
						<p className="sr-only" aria-live="polite">
							Quote {i + 1} of {TESTIMONIALS.length}
						</p>
					</div>
				</div>

				<Reveal className="flex flex-col gap-4 self-end" selector="[data-fact]" stagger={0.1}>
					<div data-fact className="rounded-[28px] bg-paper p-7 shadow-[0_0_0_1px_rgb(43_35_33/0.06)]">
						<ShieldCheck aria-hidden className="size-7 text-ember" strokeWidth={2} />
						<p className="type-h3 mt-4 text-ink">Most of our homes are rated Good by the Care Quality Commission.</p>
						<p className="type-small mt-3 text-stone">Every inspection report is public, including the ones we are working to improve.</p>
						<a href={CONTACT.cqc} target="_blank" rel="noreferrer" className="type-label mt-5 inline-flex items-center gap-1.5 text-ember hover:underline">
							Read our reports on the CQC website <ArrowUpRight aria-hidden className="size-4" strokeWidth={2.25} />
						</a>
					</div>
					<div data-fact className="grid grid-cols-2 gap-4">
						<div className="rounded-[28px] bg-paper p-6 shadow-[0_0_0_1px_rgb(43_35_33/0.06)]">
							<p className="type-num text-[3.2rem] text-ink">{YEARS}</p>
							<p className="type-small mt-2 text-stone">years of caring, run from Leicester since 1984</p>
						</div>
						<div className="flex flex-col justify-between rounded-[28px] bg-paper p-6 shadow-[0_0_0_1px_rgb(43_35_33/0.06)]">
							<img src={asset("/img/brand/dis.png")} alt="Disability Confident Committed employer" className="w-full max-w-[9rem]" loading="lazy" />
							<p className="type-small mt-3 text-stone">Disability Confident employer</p>
						</div>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
