import { ArrowRight, ArrowUpRight } from "lucide-react";
import { type AnchorHTMLAttributes, type ButtonHTMLAttributes, forwardRef, type MouseEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { navigate } from "wouter/use-browser-location";
import { FIGURE_PATH, FIGURE_TRANSFORM, FIGURE_VIEWBOX } from "@/lib/figure";
import { cn } from "@/lib/utils";
import { asset, withBase } from "@/lib/asset";

/** Client-side navigation wrapped in a view transition, so shared photos morph between pages. */
export function go(to: string) {
	const run = () => {
		navigate(withBase(to));
		window.scrollTo(0, 0);
	};
	const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
	const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	if (doc.startViewTransition && !reduce) doc.startViewTransition(() => flushSync(run));
	else run();
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** An internal link. Modified clicks (new tab, etc.) fall through to the browser. */
export const TLink = forwardRef<HTMLAnchorElement, LinkProps>(function TLink({ href, onClick, ...rest }, ref) {
	const handle = (e: MouseEvent<HTMLAnchorElement>) => {
		onClick?.(e);
		if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		if (href.startsWith("#")) return;
		e.preventDefault();
		go(href);
	};
	return <a ref={ref} href={withBase(href)} onClick={handle} {...rest} />;
});

export function Logo({ className, onDark = false }: { className?: string; onDark?: boolean }) {
	return (
		<img
			src={asset("/img/brand/logo.svg")}
			alt="PrimeLife"
			width={168}
			height={30}
			className={cn("h-[30px] w-auto", onDark && "brightness-0 invert", className)}
			draggable={false}
		/>
	);
}

/** The person in the logo's "i": a head and two raised arms, traced from the wordmark. */
export function Figure({ className, title }: { className?: string; title?: string }) {
	return (
		<svg viewBox={FIGURE_VIEWBOX} className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
			<g transform={FIGURE_TRANSFORM}>
				<path d={FIGURE_PATH} fill="currentColor" />
			</g>
		</svg>
	);
}

type Variant = "primary" | "secondary" | "ghost" | "light" | "outline-light";
const variants: Record<Variant, string> = {
	primary: "bg-ember text-white hover:bg-ember-deep",
	secondary: "bg-ink text-paper hover:bg-stone",
	ghost: "bg-transparent text-ink shadow-[inset_0_0_0_1.5px_rgb(43_35_33/0.2)] hover:bg-hover",
	light: "bg-paper text-ink hover:bg-white",
	"outline-light": "bg-transparent text-paper shadow-[inset_0_0_0_1.5px_rgb(251_246_239/0.35)] hover:bg-hover-dark",
};
const sizes = { md: "h-12 px-5 gap-2 text-[1rem]", lg: "h-14 px-6 gap-2.5 text-[1.0625rem]" };

const base =
	"group/btn inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold whitespace-nowrap transition-[scale] duration-150 ease-out-strong enabled:active:scale-[0.96] [&:not([aria-disabled])]:active:scale-[0.96] disabled:opacity-50";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof sizes; icon?: ReactNode };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	{ variant = "primary", size = "md", className, children, icon, ...rest },
	ref,
) {
	return (
		<button ref={ref} className={cn(base, variants[variant], sizes[size], icon ? "pr-4" : "", className)} {...rest}>
			{children}
			{icon}
		</button>
	);
});

type ButtonLinkProps = LinkProps & { variant?: Variant; size?: keyof typeof sizes; external?: boolean; arrow?: boolean; icon?: ReactNode };

export function ButtonLink({ variant = "primary", size = "md", className, children, external, arrow = true, icon, href, ...rest }: ButtonLinkProps) {
	const cls = cn(base, variants[variant], sizes[size], arrow || icon ? "pr-[1.1rem]" : "", className);
	const glyph =
		icon ??
		(arrow ? (
			external ? (
				<ArrowUpRight aria-hidden className="size-[1.15em] transition-transform duration-150 motion-safe:group-hover/btn:translate-x-0.5 motion-safe:group-hover/btn:-translate-y-0.5" strokeWidth={2.25} />
			) : (
				<ArrowRight aria-hidden className="size-[1.15em] transition-transform duration-150 motion-safe:group-hover/btn:translate-x-0.5" strokeWidth={2.25} />
			)
		) : null);
	if (external || href.startsWith("tel:") || href.startsWith("mailto:") || href.startsWith("http")) {
		return (
			<a href={href} className={cls} {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})} {...rest}>
				{children}
				{glyph}
			</a>
		);
	}
	return (
		<TLink href={href} className={cls} {...rest}>
			{children}
			{glyph}
		</TLink>
	);
}

/** Small section marker: a sun dot and a short label, sentence case. */
export function Marker({ children, className, onDark = false }: { children: ReactNode; className?: string; onDark?: boolean }) {
	return (
		<p className={cn("type-label flex items-center gap-2.5", onDark ? "text-night-mute" : "text-stone", className)}>
			<span aria-hidden className="size-2 rounded-full bg-sun" />
			{children}
		</p>
	);
}
