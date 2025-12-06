import type { SlimeConfig } from "../../core/slime";

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
	onSlimeConfigChange: (key: keyof SlimeConfig, value: number | string) => void;
}

export const SlimeMoldControls = (props: SlimeMoldControlsProps) => {
	const config = () => props.slimeConfig();

	return (
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-gray-700">
			<SliderControl
				label="Sensor Angle"
				displayValue={`${Math.round((config().sensorAngle * 180) / Math.PI)}°`}
				value={(config().sensorAngle * 180) / Math.PI}
				min={0}
				max={180}
				onChange={(value) =>
					props.onSlimeConfigChange("sensorAngle", (value * Math.PI) / 180)
				}
			/>

			<SliderControl
				label="Turn Angle"
				displayValue={`${Math.round((config().turnAngle * 180) / Math.PI)}°`}
				value={(config().turnAngle * 180) / Math.PI}
				min={0}
				max={180}
				onChange={(value) =>
					props.onSlimeConfigChange("turnAngle", (value * Math.PI) / 180)
				}
			/>

			<SliderControl
				label="Sensor Dist"
				displayValue={`${config().sensorDist}px`}
				value={config().sensorDist}
				min={1}
				max={64}
				onChange={(value) => props.onSlimeConfigChange("sensorDist", value)}
			/>

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
				label="Deposit Amount"
				displayValue={String(config().depositAmount)}
				value={config().depositAmount}
				min={1}
				max={255}
				onChange={(value) => props.onSlimeConfigChange("depositAmount", value)}
			/>

			<SliderControl
				label="Agent Speed"
				displayValue={config().agentSpeed.toFixed(1)}
				value={config().agentSpeed}
				min={0.1}
				max={5}
				step={0.1}
				onChange={(value) => props.onSlimeConfigChange("agentSpeed", value)}
			/>

			<SliderControl
				label="Agent Count"
				displayValue={`${config().agentCount}%`}
				value={config().agentCount}
				min={0.5}
				max={20}
				step={0.5}
				onChange={(value) => props.onSlimeConfigChange("agentCount", value)}
			/>

			<SliderControl
				label="Vortex Radius"
				displayValue={`${config().vortexRadius}px`}
				value={config().vortexRadius}
				min={10}
				max={100}
				step={1}
				onChange={(value) => props.onSlimeConfigChange("vortexRadius", value)}
			/>
		</div>
	);
};
