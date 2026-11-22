import { ArrowUpRight, Phone, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Reveal, RevealText } from "@/components/Reveal";
import { ButtonLink, Marker } from "@/components/ui";
import { CONTACT } from "@/lib/data";
import { FUNDING } from "@/lib/content";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";

export function Funding() {
	const [open, setOpen] = useState<number | null>(0);
	return (
		<section id="funding" aria-labelledby="funding-title" className="bg-paper py-[clamp(5rem,10vw,9rem)]">
			<div className="frame grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
				<div>
					<Marker>Fees and funding</Marker>
					<RevealText id="funding-title" className="type-h2 mt-5 text-ink">
						Paying for care, explained plainly.
					</RevealText>
					<Reveal className="mt-8 rounded-[28px] bg-sun-soft/60 p-7 shadow-[0_0_0_1px_rgb(201_64_15/0.12)]" delay={0.1}>
						<p className="type-label text-ember">Free funding helpline</p>
						<a href={`tel:${CONTACT.funding.tel}`} className="type-num mt-3 block text-[clamp(2.4rem,4vw,3.4rem)] text-ink hover:text-ember">
							{CONTACT.funding.display}
						</a>
						<p className="type-small mt-3 text-stone">{CONTACT.hours}. Our advisers can talk you through council funding, NHS Continuing Healthcare and top-ups.</p>
						<div className="mt-6 flex flex-wrap gap-3">
							<ButtonLink href={`tel:${CONTACT.funding.tel}`} arrow={false} icon={<Phone aria-hidden className="size-[18px]" />}>
								Call the helpline
							</ButtonLink>
							<ButtonLink href={CONTACT.live("/request-a-brochure/")} external variant="ghost">
								Request a brochure
							</ButtonLink>
						</div>
					</Reveal>
				</div>

				<ul className="self-start border-t border-ink/12">
					{FUNDING.map((f, i) => {
						const isOpen = open === i;
						return (
							<li key={f.q} className="border-b border-ink/12">
								<h3>
									<button
										type="button"
										aria-expanded={isOpen}
										aria-controls={`fund-${i}`}
										onClick={() => setOpen(isOpen ? null : i)}
										className="flex w-full items-center justify-between gap-6 rounded-[18px] py-6 text-left hover:text-ember"
									>
										<span className="type-h3 text-[clamp(1.3rem,1.8vw,1.7rem)]">{f.q}</span>
										<span
											className={cn(
												"grid size-11 shrink-0 place-items-center rounded-full shadow-[inset_0_0_0_1.5px_rgb(43_35_33/0.16)] transition-transform duration-200 ease-out-strong",
												isOpen && "rotate-45",
											)}
										>
											<Plus aria-hidden className="size-5" strokeWidth={2.25} />
										</span>
									</button>
								</h3>
								<AnimatePresence initial={false}>
									{isOpen && (
										<motion.div
											id={`fund-${i}`}
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: "auto", opacity: 1, transition: { duration: 0.26, ease: EASE_OUT } }}
											exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } }}
											className="overflow-hidden"
										>
											<p className="type-body max-w-2xl pb-7 pr-14 text-stone">{f.a}</p>
										</motion.div>
									)}
								</AnimatePresence>
							</li>
						);
					})}
					<li className="pt-6">
						<a href={CONTACT.live("/funding/")} target="_blank" rel="noreferrer" className="type-label inline-flex items-center gap-1.5 text-ember hover:underline">
							More about funding <ArrowUpRight aria-hidden className="size-4" strokeWidth={2.25} />
						</a>
					</li>
				</ul>
			</div>
		</section>
	);
}
