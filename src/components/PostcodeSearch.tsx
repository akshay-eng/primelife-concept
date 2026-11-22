import { Loader2, MapPin, Search } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { finder, useFinder } from "@/lib/finder";
import { useLenis } from "@/lib/scroll";
import { cn } from "@/lib/utils";

/** Postcode or town search. Resolves the place, then hands over to the map finder. */
export function PostcodeSearch({
	className,
	scrollTo,
	size = "lg",
	onDark = false,
	autoFocus = false,
}: {
	className?: string;
	/** Selector to scroll to once a search starts (the map finder). */
	scrollTo?: string;
	size?: "md" | "lg";
	onDark?: boolean;
	autoFocus?: boolean;
}) {
	const id = useId();
	const status = useFinder((s) => s.status);
	const current = useFinder((s) => s.query);
	const [value, setValue] = useState(current);
	const lenis = useLenis();
	const [narrow] = useState(() => typeof window !== "undefined" && window.innerWidth < 480);

	const submit = (e: FormEvent) => {
		e.preventDefault();
		const q = value.trim();
		if (!q) return;
		void finder.search(q);
		if (scrollTo) {
			const target = document.querySelector(scrollTo);
			if (target) {
				if (lenis) lenis.scrollTo(target as HTMLElement, { offset: -24, duration: 1.4 });
				else target.scrollIntoView({ behavior: "smooth" });
			}
		}
	};

	const h = size === "lg" ? "h-[3.75rem]" : "h-14";
	return (
		<form role="search" onSubmit={submit} className={cn("relative w-full max-w-[34rem]", className)}>
			<label htmlFor={id} className="sr-only">
				Postcode or town
			</label>
			<div
				className={cn(
					"flex items-center gap-2 rounded-full pl-5 pr-1.5 transition-[box-shadow] duration-150",
					h,
					onDark
						? "bg-night-2 text-paper shadow-[inset_0_0_0_1.5px_rgb(251_246_239/0.16)] focus-within:shadow-[inset_0_0_0_2px_var(--color-sun)]"
						: "bg-white text-ink shadow-[0_0_0_1px_rgb(43_35_33/0.08),0_10px_30px_-12px_rgb(43_35_33/0.25)] focus-within:shadow-[0_0_0_2px_var(--color-ember),0_10px_30px_-12px_rgb(43_35_33/0.25)]",
				)}
			>
				<MapPin aria-hidden className={cn("size-5 shrink-0", onDark ? "text-sun" : "text-ember")} strokeWidth={2} />
				<input
					id={id}
					value={value}
					onChange={(e) => setValue(e.target.value)}
					placeholder={narrow ? "Postcode or town" : "Postcode or town, e.g. LE2"}
					autoComplete="postal-code"
					autoFocus={autoFocus}
					enterKeyHint="search"
					className={cn(
						"min-w-0 flex-1 bg-transparent text-[1.0625rem] outline-none placeholder:text-mute",
						onDark && "placeholder:text-night-mute",
					)}
				/>
				<button
					type="submit"
					className="inline-flex h-12 items-center gap-2 rounded-full bg-ember px-5 font-semibold text-white transition-[scale] duration-150 ease-out-strong hover:bg-ember-deep active:scale-[0.96]"
				>
					<span className="grid size-[1.15em] place-items-center">
						{status === "loading" ? (
							<Loader2 aria-hidden className="size-[1.15em] animate-spin" strokeWidth={2.25} />
						) : (
							<Search aria-hidden className="size-[1.15em]" strokeWidth={2.25} />
						)}
					</span>
					<span className="sm:hidden">Find</span>
					<span className="hidden sm:inline">Find homes</span>
				</button>
			</div>
			<p aria-live="polite" className="sr-only">
				{status === "loading" ? "Searching" : status === "not-found" ? "We could not find that place." : ""}
			</p>
		</form>
	);
}
