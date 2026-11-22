import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

gsap.registerPlugin(ScrollTrigger, SplitText);

/** The one curve for movement on screen, and the one for entrances (motion skill). */
export const EASE = {
	enter: "power3.out",
	move: "expo.inOut",
	css: { enter: "cubic-bezier(0.23, 1, 0.32, 1)", move: "cubic-bezier(0.77, 0, 0.175, 1)" },
} as const;

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

export const prefersReducedMotion = () =>
	typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Shared scroll velocity (px per frame, smoothed) for anything that wants to lean into a fling. */
export const scrollState = { velocity: 0, progress: 0 };

export function SmoothScroll({ children }: { children: ReactNode }) {
	const [lenis, setLenis] = useState<Lenis | null>(null);

	useEffect(() => {
		if (prefersReducedMotion()) {
			const onScroll = () => ScrollTrigger.update();
			window.addEventListener("scroll", onScroll, { passive: true });
			return () => window.removeEventListener("scroll", onScroll);
		}
		const instance = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true, anchors: { offset: -88 } });
		instance.on("scroll", (l: Lenis) => {
			scrollState.velocity = l.velocity;
			scrollState.progress = l.progress;
			ScrollTrigger.update();
		});
		const tick = (time: number) => instance.raf(time * 1000);
		gsap.ticker.add(tick);
		gsap.ticker.lagSmoothing(0);
		setLenis(instance);
		return () => {
			gsap.ticker.remove(tick);
			instance.destroy();
			setLenis(null);
		};
	}, []);

	return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

export { gsap, ScrollTrigger, SplitText };
