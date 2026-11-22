import { ArrowUpRight } from "lucide-react";
import { Reveal, RevealText } from "@/components/Reveal";
import { ButtonLink, Marker } from "@/components/ui";
import { CONTACT, momentById } from "@/lib/data";
import { asset } from "@/lib/asset";

const POSTS = [
	{
		title: "The first Pride of PrimeLife Awards",
		date: "19 November 2026",
		line: "This February we will honour the people who make PrimeLife what it is. Nominations are in, and nominees' stories follow over the coming weeks.",
		href: "https://prime-life.co.uk/pride-of-prime-life-awards/",
		img: asset("/img/news/pride-awards.webp"),
	},
	{
		title: "Enjoying life at PrimeLife: October",
		date: "5 November 2026",
		line: "Blackpool Illuminations, a five-day trip to Butlins, Black History Month at our Leicester homes, and a great many pumpkins.",
		href: "https://prime-life.co.uk/enjoying-life-at-prime-life-october-2026/",
		img: momentById.get("m004")?.srcSmall ?? "",
	},
	{
		title: "Enjoying life at PrimeLife: September",
		date: "7 October 2026",
		line: "A family reunited after years apart, llamas joining the cuddle-therapy team at Springhill, and £400 raised for Macmillan at head office.",
		href: "https://prime-life.co.uk/enjoying-life-at-prime-life-september-2026/",
		img: momentById.get("m065")?.srcSmall ?? "",
	},
];

export function News() {
	return (
		<section id="news" aria-labelledby="news-title" className="bg-paper-2 py-[clamp(5rem,10vw,9rem)]">
			<div className="frame">
				<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
					<div className="max-w-2xl">
						<Marker>News</Marker>
						<RevealText id="news-title" className="type-h2 mt-5 text-ink">
							From our homes this autumn.
						</RevealText>
					</div>
					<ButtonLink href={CONTACT.live("/posts/")} external variant="ghost">
						All news
					</ButtonLink>
				</div>
				<Reveal as="ul" className="mt-12 grid gap-5 md:grid-cols-3" selector="li" stagger={0.08}>
					{POSTS.map((p) => (
						<li key={p.href}>
							<a href={p.href} target="_blank" rel="noreferrer" className="group/post flex h-full flex-col rounded-[28px] bg-paper p-3 shadow-[0_0_0_1px_rgb(43_35_33/0.06)] hover:shadow-[0_0_0_1px_rgb(43_35_33/0.1),0_24px_50px_-28px_rgb(43_35_33/0.45)]">
								<div className="aspect-[4/3] overflow-hidden rounded-[20px] bg-paper-3">
									<img src={p.img} alt="" loading="lazy" className="img-outline size-full object-cover transition-[scale] duration-300 ease-out-strong motion-safe:group-hover/post:scale-[1.03]" />
								</div>
								<div className="flex flex-1 flex-col px-4 pb-5 pt-5">
									<p className="type-label text-mute">{p.date}</p>
									<h3 className="type-h3 mt-2 text-[1.45rem] text-ink">{p.title}</h3>
									<p className="type-small mt-3 flex-1 text-stone">{p.line}</p>
									<span className="type-label mt-5 inline-flex items-center gap-1.5 text-ember">
										Read on our news page
										<ArrowUpRight aria-hidden className="size-4 transition-transform duration-150 motion-safe:group-hover/post:-translate-y-0.5 motion-safe:group-hover/post:translate-x-0.5" strokeWidth={2.25} />
									</span>
								</div>
							</a>
						</li>
					))}
				</Reveal>
			</div>
		</section>
	);
}
