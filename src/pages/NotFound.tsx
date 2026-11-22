import { ButtonLink } from "@/components/ui";

export default function NotFound() {
	return (
		<section className="frame flex min-h-[80vh] flex-col items-start justify-center gap-6 pt-32">
			<h1 className="type-display">We could not find that page.</h1>
			<ButtonLink href="/">Back to the homepage</ButtonLink>
		</section>
	);
}
