import { useSyncExternalStore } from "react";
import { type Place, resolvePlace } from "@/lib/geo";

export type FinderState = {
	query: string;
	place: Place | null;
	status: "idle" | "loading" | "found" | "not-found";
	/** A care family id from CARE_FAMILIES, or null for every home. */
	family: string | null;
	/** The home under the pointer in the list or on the map. */
	focus: string | null;
};

let state: FinderState = { query: "", place: null, status: "idle", family: null, focus: null };
const listeners = new Set<() => void>();
const emit = () => {
	for (const l of listeners) l();
};
const set = (patch: Partial<FinderState>) => {
	state = { ...state, ...patch };
	emit();
};

let inflight: AbortController | null = null;

export const finder = {
	get: () => state,
	subscribe(l: () => void) {
		listeners.add(l);
		return () => listeners.delete(l);
	},
	setFamily: (family: string | null) => set({ family }),
	setFocus: (focus: string | null) => {
		if (state.focus !== focus) set({ focus });
	},
	clear: () => set({ query: "", place: null, status: "idle" }),
	async search(query: string) {
		inflight?.abort();
		const controller = new AbortController();
		inflight = controller;
		set({ query, status: "loading" });
		try {
			const place = await resolvePlace(query, controller.signal);
			if (controller.signal.aborted) return;
			set({ place, status: place ? "found" : "not-found" });
		} catch {
			if (!controller.signal.aborted) set({ status: "not-found", place: null });
		}
	},
};

export function useFinder<T>(select: (s: FinderState) => T): T {
	return useSyncExternalStore(finder.subscribe, () => select(finder.get()));
}
