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
		<div class="glass-panel-subtle flex items-center gap-3 px-3 py-2 rounded-xl">
			<span class="text-gray-200 text-[10px] uppercase tracking-wider font-medium">
				Speed
			</span>
			<input
				type="range"
				min="0"
				max="100"
				value={props.speed()}
				onInput={handleInput}
				class="glass-slider w-24 cursor-pointer"
			/>
		</div>
	);
};
