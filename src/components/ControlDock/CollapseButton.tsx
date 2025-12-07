import { ChevronDown, ChevronUp } from "lucide-solid";

interface Props {
	collapsed: () => boolean;
	onClick: () => void;
}

export const CollapseButton = (props: Props) => {
	return (
		<button
			type="button"
			onClick={props.onClick}
			class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(100%-2px)] px-4 aspect-2/1 transition-all cursor-pointer z-30 pointer-events-auto flex items-center justify-center border-b-0 rounded-t-xl hover:bg-white/[0.06]"
			style={{
				background: "rgba(255, 255, 255, 0.03)",
				"backdrop-filter": "blur(12px) saturate(120%)",
				"-webkit-backdrop-filter": "blur(12px) saturate(120%)",
				border: "1px solid rgba(255, 255, 255, 0.15)",
				"border-bottom": "none",
				"box-shadow":
					"0 -4px 16px rgba(0, 0, 0, 0.15), inset 0 0.5px 0 rgba(255, 255, 255, 0.25)",
			}}
			aria-label={props.collapsed() ? "Expand controls" : "Collapse controls"}
		>
			{props.collapsed() ? (
				<ChevronUp class="w-4 h-4 text-white/70" />
			) : (
				<ChevronDown class="w-4 h-4 text-white/70" />
			)}
		</button>
	);
};
