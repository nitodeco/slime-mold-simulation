interface ColorControlProps {
	color: () => string;
	onColorChange: (color: string) => void;
}

export const ColorControl = (props: ColorControlProps) => {
	return (
		<div class="flex items-center gap-3 bg-gray-900/40 px-3 py-2 border-2 border-gray-700/30 rounded-sm">
			<span class="text-gray-400 text-[10px] uppercase tracking-wider font-bold">
				Color
			</span>
			<input
				type="color"
				value={props.color()}
				onInput={(event) => props.onColorChange(event.currentTarget.value)}
				class="w-8 h-8 cursor-pointer bg-transparent border-none"
			/>
		</div>
	);
};
