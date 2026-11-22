import { type ElementType, type ReactNode, useRef } from "react";
import { useRegisterFluidHoverItem } from "@/hooks/use-fluid-hover";

/** One click target in a fluid hover list. Renders `as` (default li) and registers itself. */
export function FluidItem({
	as: Tag = "li",
	index,
	register,
	className,
	children,
	...rest
}: {
	as?: ElementType;
	index: number;
	register: (index: number, el: HTMLElement | null) => void;
	className?: string;
	children: ReactNode;
} & Record<string, unknown>) {
	const ref = useRef<HTMLElement>(null);
	useRegisterFluidHoverItem(register, index, ref);
	return (
		<Tag ref={ref} className={className} {...rest}>
			{children}
		</Tag>
	);
}
