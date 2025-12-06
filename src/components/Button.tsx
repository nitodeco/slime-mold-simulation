import type { JSX } from "solid-js";

interface Props {
	onClick: () => void;
	children: JSX.Element;
	variant?: "default" | "play" | "stop";
	class?: string;
	"aria-label"?: string;
}

export const Button = (props: Props) => {
	const baseClasses =
		"px-3 py-1 border-2 border-gray-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer";

	const variantClasses = {
		default: "bg-gray-700 text-gray-200 hover:bg-gray-600",
		play: "bg-green-900/50 text-green-200 hover:bg-green-900/70",
		stop: "bg-red-900/50 text-red-200 hover:bg-red-900/70",
	};

	const variant = props.variant ?? "default";
	const classes = `${baseClasses} ${variantClasses[variant]} ${props.class ?? ""}`;

	return (
		<button
			type="button"
			onClick={props.onClick}
			class={classes}
			aria-label={props["aria-label"]}
		>
			{props.children}
		</button>
	);
};
