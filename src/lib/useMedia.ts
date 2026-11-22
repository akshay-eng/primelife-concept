import { useSyncExternalStore } from "react";

/** Subscribe to a media query. Reads synchronously on the first render, so layout never flips after mount. */
export function useMedia(query: string) {
	return useSyncExternalStore(
		(cb) => {
			const mq = window.matchMedia(query);
			mq.addEventListener("change", cb);
			return () => mq.removeEventListener("change", cb);
		},
		() => window.matchMedia(query).matches,
		() => false,
	);
}
