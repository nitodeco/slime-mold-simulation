interface Props {
	collapsed: () => boolean;
	onClick: () => void;
}

export const CollapseButton = (props: Props) => {
	return (
		<button
			type="button"
			onClick={props.onClick}
			class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(100%-2px)] px-3 aspect-2/1 hover:bg-gray-700 border-2 border-gray-600 hover:border-gray-500 transition-colors cursor-pointer bg-gray-800 z-30 pointer-events-auto flex items-center justify-center border-b-0 rounded-t-sm"
			aria-label={props.collapsed() ? "Expand controls" : "Collapse controls"}
		>
			<i
				class={`w-4 h-3 ${
					props.collapsed() ? "hn hn-chevron-up" : "hn hn-chevron-down"
				}`}
			/>
		</button>
	);
};
