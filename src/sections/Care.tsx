import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useRef, useState } from "react";
import { FluidHoverHighlight } from "@/components/fluid-hover-highlight";
import { FluidItem } from "@/components/FluidItem";
import { Reveal, RevealText } from "@/components/Reveal";
import { Marker } from "@/components/ui";
import { useFluidHover } from "@/hooks/use-fluid-hover";
import { CARE_FAMILIES, homesWithAny, momentById } from "@/lib/data";
import { finder } from "@/lib/finder";
import { useLenis } from "@/lib/scroll";
import { EASE_OUT } from "@/lib/motion";

export function Care() {
	const listRef = useRef<HTMLUListElement>(null);
	const hover = useFluidHover(listRef, { axis: "y" });
	const lenis = useLenis();
	const [open, setOpen] = useState<string | null>(null);
	// The preview photo trails the pointer on a soft spring; it only exists for fine pointers.
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	const sx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 });
	const sy = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 });
	const active = hover.activeIndex !== null ? CARE_FAMILIES[hover.activeIndex] : null;
	const photo = active ? momentById.get(active.photo) : null;

	const showOnMap = (id: string) => {
		finder.setFamily(id);
		const el = document.getElementById("find");
		if (el) {
			if (lenis) lenis.scrollTo(el, { duration: 1.4 });
			else el.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<section id="care" aria-labelledby="care-title" className="relative bg-paper py-[clamp(5rem,10vw,9rem)]">
			<div className="frame grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
				<div className="lg:sticky lg:top-28 lg:self-start">
					<Marker>Care we provide</Marker>
					<RevealText id="care-title" className="type-h2 mt-5 text-ink">
						Care that fits the person.
					</RevealText>
					<Reveal as="p" className="type-body mt-5 max-w-md text-stone" delay={0.15}>
						Fifteen kinds of registered care, from a week of respite to a home for life. Every home's page says exactly which it offers, and who
						manages it.
					</Reveal>
				</div>

				<div
					className="relative"
					onPointerMove={(e) => {
						const r = e.currentTarget.getBoundingClientRect();
						x.set(e.clientX - r.left);
						y.set(e.clientY - r.top);
					}}
				>
					<ul ref={listRef} {...hover.handlers} className="relative border-t border-ink/12">
						<FluidHoverHighlight hover={hover} className="rounded-[24px]" />
						{CARE_FAMILIES.map((f, i) => {
							const count = homesWithAny(f.types).length;
							const isOpen = open === f.id;
							return (
								<FluidItem key={f.id} index={i} register={hover.registerItem} className="relative border-b border-ink/12">
									<button
										type="button"
										aria-expanded={isOpen}
										aria-controls={`care-${f.id}`}
										onClick={() => setOpen(isOpen ? null : f.id)}
										className="relative z-[1] grid w-full grid-cols-[auto_1fr_auto] items-baseline gap-x-5 px-2 py-7 text-left sm:gap-x-8 sm:px-5 lg:py-9"
									>
										<span className="type-label w-8 text-stone">0{i + 1}</span>
										<span>
											<span className="type-h3 block text-[clamp(1.6rem,3vw,2.75rem)] text-ink">{f.title}</span>
											<span className="type-body mt-2 block max-w-xl text-stone">{f.line}</span>
										</span>
										<span className="type-label hidden whitespace-nowrap text-ember sm:block">{count} homes</span>
									</button>
									<AnimatePresence initial={false}>
										{isOpen && (
											<motion.div
												id={`care-${f.id}`}
												key="panel"
												initial={{ height: 0, opacity: 0 }}
												animate={{ height: "auto", opacity: 1, transition: { duration: 0.26, ease: EASE_OUT } }}
												exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } }}
												className="relative z-[1] overflow-hidden"
											>
												<div className="flex flex-col gap-5 px-2 pb-8 pl-[3.25rem] sm:px-5 sm:pl-[4.75rem]">
													<ul className="flex flex-wrap gap-2">
														{f.types.map((t) => (
															<li key={t} className="type-label rounded-full bg-paper-2 px-3.5 py-2 text-ink">
																{t} <span className="text-mute">· {homesWithAny([t]).length}</span>
															</li>
														))}
													</ul>
													<button
														type="button"
														onClick={() => showOnMap(f.id)}
														className="type-label inline-flex w-fit items-center gap-2 rounded-full bg-ink px-5 py-3 text-paper transition-[scale] duration-150 active:scale-[0.96]"
													>
														Show these {count} homes on the map <ArrowRight aria-hidden className="size-4" strokeWidth={2.25} />
													</button>
												</div>
											</motion.div>
										)}
									</AnimatePresence>
								</FluidItem>
							);
						})}
					</ul>

					<AnimatePresence>
						{photo && (
							<motion.div
								key="preview"
								aria-hidden
								style={{ x: sx, y: sy }}
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1, transition: { duration: 0.2, ease: EASE_OUT } }}
								exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
								className="pointer-events-none absolute left-0 top-0 z-10 hidden [@media(hover:hover)]:block"
							>
								<div className="-translate-x-1/2 -translate-y-[115%] overflow-hidden rounded-[22px] shadow-[0_30px_60px_-24px_rgb(43_35_33/0.5)]">
									<AnimatePresence mode="popLayout" initial={false}>
										<motion.img
											key={photo.id}
											src={photo.srcSmall}
											alt=""
											initial={{ opacity: 0, filter: "blur(6px)" }}
											animate={{ opacity: 1, filter: "blur(0px)", transition: { duration: 0.2 } }}
											exit={{ opacity: 0, transition: { duration: 0.12 } }}
											className="img-outline h-56 w-44 object-cover"
										/>
									</AnimatePresence>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</section>
	);
}
