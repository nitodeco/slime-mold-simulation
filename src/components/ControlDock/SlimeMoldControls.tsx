import type { SlimeConfig, SpeciesConfig } from "../../core/slime";

interface SliderControlProps {
	label: string;
	displayValue: string;
	value: number;
	min: number;
	max: number;
	step?: number;
	onChange: (value: number) => void;
}

const SliderControl = (props: SliderControlProps) => {
	return (
		<div class="flex flex-col gap-1">
			<div class="flex justify-between text-[10px] uppercase tracking-wider font-bold text-gray-400">
				<span>{props.label}</span>
				<span>{props.displayValue}</span>
			</div>
			<input
				type="range"
				min={props.min}
				max={props.max}
				step={props.step}
				value={props.value}
				onInput={(event) =>
					props.onChange(Number.parseFloat(event.currentTarget.value))
				}
				class="pixel-slider w-full cursor-pointer"
			/>
		</div>
	);
};

interface SlimeMoldControlsProps {
	slimeConfig: () => SlimeConfig;
	onSlimeConfigChange: (
		key: keyof SlimeConfig,
		value: SlimeConfig[keyof SlimeConfig] | SpeciesConfig[keyof SpeciesConfig],
	) => void;
}

export const SlimeMoldControls = (props: SlimeMoldControlsProps) => {
	const config = () => props.slimeConfig();

	return (
		<div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4">
			<SliderControl
				label="Decay Rate"
				displayValue={config().decayRate.toFixed(1)}
				value={config().decayRate}
				min={0.1}
				max={20}
				step={0.1}
				onChange={(value) => props.onSlimeConfigChange("decayRate", value)}
			/>

			<SliderControl
				label="Diffuse Weight"
				displayValue={config().diffuseWeight.toFixed(2)}
				value={config().diffuseWeight}
				min={0}
				max={1}
				step={0.05}
				onChange={(value) => props.onSlimeConfigChange("diffuseWeight", value)}
			/>

			<SliderControl
				label="Total Agents"
				displayValue={`${config().agentCount}%`}
				value={config().agentCount}
				min={0.5}
				max={20}
				step={0.5}
				onChange={(value) => props.onSlimeConfigChange("agentCount", value)}
			/>
		</div>
	);
};
