import { Menu, Phone, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { FluidHoverHighlight } from "@/components/fluid-hover-highlight";
import { FluidItem } from "@/components/FluidItem";
import { ButtonLink, Logo, TLink } from "@/components/ui";
import { useFluidHover } from "@/hooks/use-fluid-hover";
import { CONTACT } from "@/lib/data";
import { useLenis } from "@/lib/scroll";
import { spring } from "@/lib/springs";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";

const NAV = [
	{ label: "Our homes", href: "/homes" },
	{ label: "Care", href: "/#care" },
	{ label: "Life here", href: "/#life" },
	{ label: "Careers", href: "/#careers" },
	{ label: "Funding", href: "/#funding" },
	{ label: "News", href: "/#news" },
];

function useScrollDirection() {
	const [state, setState] = useState({ scrolled: false, hidden: false });
	useEffect(() => {
		let last = window.scrollY;
		const onScroll = () => {
			const y = window.scrollY;
			const delta = y - last;
			if (Math.abs(delta) < 4) return;
			setState({ scrolled: y > 24, hidden: y > 320 && delta > 0 });
			last = y;
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	return state;
}

export function Header() {
	const [location] = useLocation();
	const { scrolled, hidden } = useScrollDirection();
	const [open, setOpen] = useState(false);
	const navRef = useRef<HTMLUListElement>(null);
	const hover = useFluidHover(navRef, { axis: "x" });
	const lenis = useLenis();

	useEffect(() => {
		if (open) lenis?.stop();
		else lenis?.start();
	}, [open, lenis]);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open]);

	const onNav = (href: string) => (e: React.MouseEvent) => {
		setOpen(false);
		const [path, hash] = href.split("#");
		if (hash && (path === "/" || path === "") && location === "/") {
			e.preventDefault();
			const el = document.getElementById(hash);
			if (!el) return;
			if (lenis) lenis.scrollTo(el, { offset: -72, duration: 1.3 });
			else el.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<>
			<a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[80] rounded-full bg-ink px-5 py-3 font-semibold text-paper">
				Skip to content
			</a>
			<header
				className={cn(
					"fixed inset-x-0 top-0 z-50 transition-[translate,opacity] duration-[260ms] ease-out-strong motion-reduce:transition-opacity",
					hidden && !open ? "-translate-y-[120%] motion-reduce:translate-y-0 motion-reduce:pointer-events-none motion-reduce:opacity-0" : "translate-y-0",
				)}
			>
				<div className="frame pt-3">
					<div
						className={cn(
							"flex h-[64px] items-center justify-between gap-4 rounded-full pl-5 pr-2 transition-[background-color,box-shadow,backdrop-filter] duration-200",
							scrolled ? "bg-paper/85 shadow-[0_0_0_1px_rgb(43_35_33/0.06),0_10px_30px_-14px_rgb(43_35_33/0.25)] backdrop-blur-xl" : "bg-transparent",
						)}
					>
						<TLink href="/" aria-label="PrimeLife home" className="shrink-0 rounded-md">
							<Logo className="h-[26px] lg:h-[28px]" />
						</TLink>

						<nav aria-label="Main" className="hidden lg:block">
							<ul ref={navRef} {...hover.handlers} className="relative flex items-center">
								<FluidHoverHighlight hover={hover} className="rounded-full" />
								{NAV.map((item, i) => (
									<FluidItem key={item.href} index={i} register={hover.registerItem} className="relative">
										<TLink
											href={item.href}
											onClick={onNav(item.href)}
											aria-current={location === item.href ? "page" : undefined}
											className="relative z-[1] block rounded-full px-4 py-2.5 text-[1rem] font-semibold text-ink"
										>
											{item.label}
										</TLink>
									</FluidItem>
								))}
							</ul>
						</nav>

						<div className="flex items-center gap-2">
							<a
								href={`tel:${CONTACT.sales.tel}`}
								className="hidden items-center gap-2 rounded-full px-3 py-2 text-[1rem] font-semibold text-ink hover:bg-hover xl:inline-flex"
							>
								<Phone aria-hidden className="size-4 text-ember" strokeWidth={2.25} />
								{CONTACT.sales.display}
							</a>
							<ButtonLink href="/homes" className="hidden sm:inline-flex">
								Find a home
							</ButtonLink>
							<button
								type="button"
								onClick={() => setOpen((v) => !v)}
								aria-expanded={open}
								aria-controls="mobile-menu"
								className="grid size-12 place-items-center rounded-full bg-ink text-paper transition-[scale] duration-150 active:scale-[0.96] lg:hidden"
							>
								<span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
								<span className="grid size-5 [&>*]:col-start-1 [&>*]:row-start-1">
									<motion.span initial={false} animate={open ? HIDDEN : SHOWN} transition={spring.fast} className="flex">
										<Menu aria-hidden className="size-5" strokeWidth={2.25} />
									</motion.span>
									<motion.span initial={false} animate={open ? SHOWN : HIDDEN} transition={spring.fast} className="flex">
										<X aria-hidden className="size-5" strokeWidth={2.25} />
									</motion.span>
								</span>
							</button>
						</div>
					</div>
				</div>
			</header>

			<AnimatePresence>
				{open && (
					<motion.div
						id="mobile-menu"
						key="menu"
						className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-paper pt-24 lg:hidden"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1, transition: { duration: 0.2 } }}
						exit={{ opacity: 0, transition: { duration: 0.14 } }}
					>
						<nav aria-label="Mobile" className="frame">
							<ul className="flex flex-col">
								{NAV.map((item, i) => (
									<motion.li
										key={item.href}
										initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
										animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { delay: 0.04 + i * 0.035, duration: 0.3, ease: EASE_OUT } }}
										className="border-b border-ink/10"
									>
										<TLink href={item.href} onClick={onNav(item.href)} className="type-h2 block py-4">
											{item.label}
										</TLink>
									</motion.li>
								))}
							</ul>
							<div className="mt-8 flex flex-col gap-3 pb-10">
								<ButtonLink href={`tel:${CONTACT.sales.tel}`} size="lg" arrow={false} icon={<Phone aria-hidden className="size-5" />}>
									Call {CONTACT.sales.display}
								</ButtonLink>
								<p className="type-small text-mute">{CONTACT.hours}</p>
							</div>
						</nav>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}

const SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };
const HIDDEN = { opacity: 0, scale: 0.25, filter: "blur(4px)" };
