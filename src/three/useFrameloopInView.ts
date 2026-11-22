import { useEffect, useRef, useState } from "react";

/** Render a canvas only while it is on screen (and the tab is visible), so offscreen scenes cost nothing. */
export function useFrameloopInView<T extends HTMLElement>(rootMargin = "120px") {
	const ref = useRef<T>(null);
	const [visible, setVisible] = useState(true);
	const [tabVisible, setTabVisible] = useState(true);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin });
		io.observe(el);
		const onVis = () => setTabVisible(document.visibilityState === "visible");
		document.addEventListener("visibilitychange", onVis);
		return () => {
			io.disconnect();
			document.removeEventListener("visibilitychange", onVis);
		};
	}, [rootMargin]);
	return { ref, frameloop: visible && tabVisible ? ("always" as const) : ("never" as const) };
}

export function hasWebGL() {
	try {
		const c = document.createElement("canvas");
		return !!(c.getContext("webgl2") || c.getContext("webgl"));
	} catch {
		return false;
	}
}
