import { useEffect } from "react";
import { finder } from "@/lib/finder";
import { MapFinder } from "@/sections/MapFinder";

export default function HomesPage() {
	useEffect(() => {
		document.title = "Find a care home | PrimeLife";
		const near = new URLSearchParams(window.location.search).get("near");
		if (near) void finder.search(near);
		return () => {
			document.title = "PrimeLife | Care homes across England since 1984";
		};
	}, []);
	return (
		<div className="pt-[76px]">
			<MapFinder story={false} limit={63} title="Find a PrimeLife home near you." />
		</div>
	);
}
