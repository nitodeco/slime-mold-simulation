import type { JSX } from "solid-js";

interface Props {
	onClick: () => void;
	children: JSX.Element;
	variant?: "default" | "play" | "stop" | "accent";
	class?: string;
	"aria-label"?: string;
}

export const Button = (props: Props) => {
	const baseClasses =
		"glass-button px-3 py-1.5 text-gray-100 cursor-pointer rounded-xl";

	const variantClasses = {
		default: "",
		play: "!bg-gradient-to-br !from-green-500/25 !to-green-600/15 !border-green-400/25 hover:!border-green-400/40 text-green-100",
		stop: "!bg-gradient-to-br !from-red-500/25 !to-red-600/15 !border-red-400/25 hover:!border-red-400/40 text-red-100",
		accent:
			"!bg-gradient-to-br !from-cyan-500/25 !to-cyan-600/15 !border-cyan-400/25 hover:!border-cyan-400/40 text-cyan-100",
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
