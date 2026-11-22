import { useGSAP } from "@gsap/react";
import { type ElementType, type ReactNode, useRef } from "react";
import { EASE, gsap, SplitText } from "@/lib/scroll";

gsap.registerPlugin(useGSAP);

type Props = {
	as?: ElementType;
	children: ReactNode;
	className?: string;
	/** Seconds to wait after the trigger, for staging a heading before its paragraph. */
	delay?: number;
	/** Reveal immediately on mount instead of on scroll (hero copy). */
	immediate?: boolean;
	id?: string;
};

/**
 * Headings rise line by line out of a mask; under reduced motion they only fade.
 * The text is in the DOM from the first paint, so nothing depends on the animation.
 */
export function RevealText({ as: Tag = "h2", children, className, delay = 0, immediate = false, id }: Props) {
	const ref = useRef<HTMLElement>(null);
	useGSAP(
		() => {
			const el = ref.current;
			if (!el) return;
			const mm = gsap.matchMedia();
			mm.add("(prefers-reduced-motion: no-preference)", () => {
				const split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "reveal-line" });
				gsap.from(split.lines, {
					yPercent: 108,
					duration: 1.05,
					ease: EASE.enter,
					stagger: 0.085,
					delay,
					scrollTrigger: immediate ? undefined : { trigger: el, start: "top 88%", once: true },
				});
				return () => split.revert();
			});
			mm.add("(prefers-reduced-motion: reduce)", () => {
				gsap.from(el, { opacity: 0, duration: 0.4, delay, scrollTrigger: immediate ? undefined : { trigger: el, start: "top 90%", once: true } });
			});
		},
		{ scope: ref },
	);
	return (
		<Tag ref={ref} className={className} id={id}>
			{children}
		</Tag>
	);
}

/** Blocks (paragraphs, cards, rows) settle in: 24px of travel, a touch of blur, once. */
export function Reveal({
	as: Tag = "div",
	children,
	className,
	delay = 0,
	stagger = 0,
	selector,
	id,
}: Omit<Props, "immediate"> & { stagger?: number; selector?: string }) {
	const ref = useRef<HTMLElement>(null);
	useGSAP(
		() => {
			const el = ref.current;
			if (!el) return;
			const targets = selector ? el.querySelectorAll(selector) : el;
			const mm = gsap.matchMedia();
			mm.add("(prefers-reduced-motion: no-preference)", () => {
				gsap.from(targets, {
					y: 28,
					opacity: 0,
					filter: "blur(6px)",
					duration: 0.9,
					ease: EASE.enter,
					delay,
					stagger,
					clearProps: "filter",
					scrollTrigger: { trigger: el, start: "top 90%", once: true },
				});
			});
			mm.add("(prefers-reduced-motion: reduce)", () => {
				gsap.from(targets, { opacity: 0, duration: 0.4, scrollTrigger: { trigger: el, start: "top 92%", once: true } });
			});
		},
		{ scope: ref },
	);
	return (
		<Tag ref={ref} className={className} id={id}>
			{children}
		</Tag>
	);
}
