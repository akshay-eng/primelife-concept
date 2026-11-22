import { Care } from "@/sections/Care";
import { Careers } from "@/sections/Careers";
import { Featured } from "@/sections/Featured";
import { Funding } from "@/sections/Funding";
import { Hero } from "@/sections/Hero";
import { MapFinder } from "@/sections/MapFinder";
import { Moments } from "@/sections/Moments";
import { News } from "@/sections/News";
import { Voices } from "@/sections/Voices";

export function HomePage() {
	return (
		<>
			<Hero />
			<Moments />
			<Care />
			<MapFinder />
			<Featured />
			<Voices />
			<Careers />
			<Funding />
			<News />
		</>
	);
}
