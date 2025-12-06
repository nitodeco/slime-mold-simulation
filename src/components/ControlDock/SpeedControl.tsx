interface SpeedControlProps {
	speed: () => number;
	onSpeedChange: (speed: number) => void;
}

export const SpeedControl = (props: SpeedControlProps) => {
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		props.onSpeedChange(Number.parseInt(target.value, 10));
	}

	return (
		<div class="flex items-center gap-3 bg-gray-900/40 px-3 py-2 border-2 border-gray-700/30 rounded-sm">
			<span class="text-gray-400 text-[10px] uppercase tracking-wider font-bold">
				Speed
			</span>
			<input
				type="range"
				min="0"
				max="100"
				value={props.speed()}
				onInput={handleInput}
				class="pixel-slider w-24 cursor-pointer"
			/>
		</div>
	);
};
