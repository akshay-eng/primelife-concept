import { MotionConfig } from "motion/react";
import { lazy, Suspense, useEffect } from "react";
import { Route, Router, Switch, useLocation } from "wouter";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ScrollTrigger, SmoothScroll, useLenis } from "@/lib/scroll";
import { HomePage } from "@/pages/HomePage";
import { ROUTER_BASE } from "@/lib/asset";

const HomesPage = lazy(() => import("@/pages/HomesPage"));
const HomeDetail = lazy(() => import("@/pages/HomeDetail"));
const NotFound = lazy(() => import("@/pages/NotFound"));

/** On a route change: jump to the top (or the hash target) and rebuild scroll triggers. */
function RouteEffects() {
	const [location] = useLocation();
	const lenis = useLenis();
	useEffect(() => {
		const hash = window.location.hash.slice(1);
		const frame = requestAnimationFrame(() => {
			const target = hash ? document.getElementById(hash) : null;
			if (target) {
				if (lenis) lenis.scrollTo(target, { offset: -72, immediate: true });
				else target.scrollIntoView();
			} else {
				if (lenis) lenis.scrollTo(0, { immediate: true });
				else window.scrollTo(0, 0);
			}
			ScrollTrigger.refresh();
		});
		return () => cancelAnimationFrame(frame);
	}, [location, lenis]);
	return null;
}

export function App() {
	return (
		<MotionConfig reducedMotion="user">
			<Router base={ROUTER_BASE}>
			<SmoothScroll>
				<RouteEffects />
				<Header />
				<main id="main" tabIndex={-1} className="outline-none">
					<Suspense fallback={<div className="h-screen" />}>
						<Switch>
							<Route path="/" component={HomePage} />
							<Route path="/homes" component={HomesPage} />
							<Route path="/homes/:slug">{(params) => <HomeDetail slug={params.slug} />}</Route>
							<Route component={NotFound} />
						</Switch>
					</Suspense>
				</main>
				<Footer />
			</SmoothScroll>
			</Router>
		</MotionConfig>
	);
}
