import { useGSAP } from "@gsap/react";
import { ArrowUpRight, Phone } from "lucide-react";
import { useRef } from "react";
import { Figure, Logo, TLink } from "@/components/ui";
import { CONTACT } from "@/lib/data";
import { gsap } from "@/lib/scroll";

const COMPANY = [
	{ label: "Privacy policy", href: CONTACT.live("/privacy-policy/") },
	{ label: "Modern slavery statement", href: CONTACT.live("/wp-content/uploads/brochures/modern-slavery.pdf") },
	{ label: "Gender pay data", href: CONTACT.live("/gender-pay-data/") },
	{ label: "Our CQC reports", href: CONTACT.cqc },
];
const SOCIAL = [
	{ label: "Facebook", href: CONTACT.facebook },
	{ label: "Instagram", href: CONTACT.instagram },
	{ label: "LinkedIn", href: CONTACT.linkedin },
	{ label: "X", href: CONTACT.x },
];

export function Footer() {
	const root = useRef<HTMLElement>(null);
	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add("(prefers-reduced-motion: no-preference)", () => {
				gsap.from("[data-mega] > *", {
					yPercent: 60,
					opacity: 0,
					duration: 1.1,
					ease: "power3.out",
					stagger: 0.08,
					scrollTrigger: { trigger: "[data-mega]", start: "top 92%", once: true },
				});
				gsap.fromTo("[data-figure]", { rotate: -8, y: 40 }, { rotate: 0, y: 0, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom bottom", scrub: true } });
			});
		},
		{ scope: root },
	);

	return (
		<footer ref={root} className="on-dark relative overflow-hidden bg-night text-paper">
			<div className="frame pt-[clamp(4rem,8vw,7rem)]">
				<div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
					<div>
						<Logo onDark className="h-[30px]" />
						<p className="type-small mt-5 max-w-xs text-night-mute">Care homes across England, run by one family business from Leicester since 1984.</p>
					</div>
					<div>
						<h2 className="type-label text-night-mute">Talk to us</h2>
						<ul className="mt-4 space-y-3">
							{[CONTACT.sales, CONTACT.general, CONTACT.hr, CONTACT.funding].map((c) => (
								<li key={c.tel}>
									<a href={`tel:${c.tel}`} className="group/tel inline-flex flex-col">
										<span className="type-small text-night-mute">{c.label}</span>
										<span className="inline-flex items-center gap-2 font-semibold text-paper group-hover/tel:text-sun">
											<Phone aria-hidden className="size-4 text-sun" strokeWidth={2.25} /> {c.display}
										</span>
									</a>
								</li>
							))}
						</ul>
						<p className="type-small mt-4 text-night-mute">{CONTACT.hours}</p>
					</div>
					<div>
						<h2 className="type-label text-night-mute">Head office</h2>
						<address className="type-small mt-4 not-italic text-paper/90">
							{CONTACT.office.map((l) => (
								<span key={l} className="block">
									{l}
								</span>
							))}
						</address>
						<a href={`mailto:${CONTACT.general.email}`} className="type-small mt-4 inline-block font-semibold text-paper underline decoration-paper/25 underline-offset-4 hover:decoration-sun">
							{CONTACT.general.email}
						</a>
						<div className="mt-6">
							<TLink href="/homes" className="type-label inline-flex items-center gap-1.5 text-sun hover:underline">
								Find a home
							</TLink>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-8 lg:grid-cols-1">
						<div>
							<h2 className="type-label text-night-mute">Company</h2>
							<ul className="mt-4 space-y-2">
								{COMPANY.map((l) => (
									<li key={l.label}>
										<a href={l.href} target="_blank" rel="noreferrer" className="type-small text-paper/90 hover:text-sun">
											{l.label}
										</a>
									</li>
								))}
							</ul>
						</div>
						<div>
							<h2 className="type-label text-night-mute">Follow us</h2>
							<ul className="mt-4 space-y-2">
								{SOCIAL.map((l) => (
									<li key={l.label}>
										<a href={l.href} target="_blank" rel="noreferrer" className="type-small inline-flex items-center gap-1 text-paper/90 hover:text-sun">
											{l.label} <ArrowUpRight aria-hidden className="size-3.5" />
										</a>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</div>

			<div className="frame relative mt-16 flex items-end justify-between gap-6 overflow-hidden">
				<p data-mega aria-hidden className="type-mega flex select-none gap-[0.2em] pb-[0.06em] text-paper">
					<span>Enjoy</span>
					<span className="text-sun">life.</span>
				</p>
				<span data-figure className="mb-[2%] hidden w-[clamp(4rem,9vw,9rem)] shrink-0 origin-bottom md:block">
					<Figure className="w-full text-sun" />
				</span>
			</div>

			<div className="frame flex flex-col gap-3 border-t border-paper/10 py-6 text-[0.875rem] text-night-mute md:flex-row md:items-center md:justify-between">
				<p>Prime Life Limited. Registered in England, company number 02779611. Caernarvon House, 121 Knighton Church Road, Leicester LE2 3JN.</p>
				<p>Concept redesign by PulpLabs. Not the live site.</p>
			</div>
		</footer>
	);
}
