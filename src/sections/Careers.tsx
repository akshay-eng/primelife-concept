import { Mail, Phone } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Reveal, RevealText } from "@/components/Reveal";
import { ButtonLink, Marker } from "@/components/ui";
import { CONTACT, momentById } from "@/lib/data";
import { hasWebGL } from "@/three/useFrameloopInView";

const CrowdScene = lazy(() => import("@/three/CrowdScene"));

export function Careers() {
	const [webgl] = useState(() => hasWebGL());
	const team = momentById.get("m131");
	return (
		<section id="careers" aria-labelledby="careers-title" className="on-dark relative overflow-hidden bg-night text-paper">
			<div className="relative h-[46svh] min-h-[320px] w-full lg:h-[62svh]">
				{webgl && (
					<Suspense fallback={null}>
						<CrowdScene />
					</Suspense>
				)}
				<div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,rgba(30,26,25,0)_0%,#1e1a19_100%)]" />
				<div className="frame pointer-events-none absolute inset-x-0 top-0 pt-[clamp(4rem,8vw,7rem)]">
					<Marker onDark>Working at PrimeLife</Marker>
				</div>
			</div>

			<div className="frame relative -mt-10 grid gap-12 pb-[clamp(5rem,10vw,9rem)] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
				<div>
					<RevealText id="careers-title" className="type-display text-paper">
						The people <span className="text-sun">are</span> the place.
					</RevealText>
					<Reveal as="p" className="type-lead mt-7 max-w-2xl text-paper/80" delay={0.1}>
						Around 2,800 of us work across 63 homes: carers and nurses, cooks and housekeepers, activity coordinators and managers. This February
						we hold the first Pride of PrimeLife Awards, to thank the people residents talk about most.
					</Reveal>
					<Reveal className="mt-9 flex flex-wrap gap-3" delay={0.2}>
						<ButtonLink href={CONTACT.careers} external size="lg">
							See current vacancies
						</ButtonLink>
						<ButtonLink href={`tel:${CONTACT.hr.tel}`} variant="outline-light" size="lg" arrow={false} icon={<Phone aria-hidden className="size-5" />}>
							{CONTACT.hr.display}
						</ButtonLink>
					</Reveal>
					<p className="type-small mt-5 flex items-center gap-2 text-night-mute">
						<Mail aria-hidden className="size-4" />
						<a href={`mailto:${CONTACT.hr.email}`} className="underline decoration-paper/25 underline-offset-4 hover:decoration-sun">
							{CONTACT.hr.email}
						</a>
					</p>
				</div>

				<Reveal as="figure" className="self-end" delay={0.15}>
					{team && (
						<div className="overflow-hidden rounded-[28px]">
							<img src={team.src} srcSet={`${team.srcSmall} 560w, ${team.src} 1400w`} sizes="(min-width: 1024px) 38vw, 92vw" alt="Staff at Springhill holding up letters spelling Good, after their CQC rating" loading="lazy" className="aspect-[4/3] w-full object-cover" />
						</div>
					)}
					<blockquote className="mt-6 font-display text-[clamp(1.5rem,2.2vw,2rem)] font-[560] leading-[1.15] tracking-[-0.02em] text-paper">
						“It feels like a big family.”
					</blockquote>
					<figcaption className="type-small mt-3 text-night-mute">Natalie, bank care assistant. Above: the Springhill team, July 2026, after their Good rating.</figcaption>
				</Reveal>
			</div>
		</section>
	);
}
