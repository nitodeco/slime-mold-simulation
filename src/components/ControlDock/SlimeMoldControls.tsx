import { Show } from "solid-js";
import type { SlimeConfig, SpeciesConfig } from "../../core/slime";
import type { LockedSettings } from "../../utils/storage";
import { LockButton } from "../LockButton";

interface SliderControlProps {
	label: string;
	displayValue: string;
	value: number;
	min: number;
	max: number;
	step?: number;
	onChange: (value: number) => void;
	locked?: boolean;
	onToggleLock?: () => void;
}

const SliderControl = (props: SliderControlProps) => {
	return (
		<div class="flex flex-col gap-1">
			<div class="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-gray-400">
				<div class="flex items-center gap-1">
					<Show when={props.onToggleLock !== undefined}>
						<LockButton
							locked={props.locked ?? false}
							onToggle={() => props.onToggleLock?.()}
						/>
					</Show>
					<span>{props.label}</span>
				</div>
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
	lockedSettings: () => LockedSettings;
	onSlimeConfigChange: (
		key: keyof SlimeConfig,
		value: SlimeConfig[keyof SlimeConfig] | SpeciesConfig[keyof SpeciesConfig],
	) => void;
	onToggleLock: (key: keyof Omit<LockedSettings, "species">) => void;
}

export const SlimeMoldControls = (props: SlimeMoldControlsProps) => {
	const config = () => props.slimeConfig();
	const locked = () => props.lockedSettings();

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
				locked={locked().decayRate}
				onToggleLock={() => props.onToggleLock("decayRate")}
			/>

			<SliderControl
				label="Diffuse Weight"
				displayValue={config().diffuseWeight.toFixed(2)}
				value={config().diffuseWeight}
				min={0}
				max={1}
				step={0.05}
				onChange={(value) => props.onSlimeConfigChange("diffuseWeight", value)}
				locked={locked().diffuseWeight}
				onToggleLock={() => props.onToggleLock("diffuseWeight")}
			/>

			<SliderControl
				label="Total Agents"
				displayValue={`${config().agentCount}%`}
				value={config().agentCount}
				min={0.5}
				max={20}
				step={0.5}
				onChange={(value) => props.onSlimeConfigChange("agentCount", value)}
				locked={locked().agentCount}
				onToggleLock={() => props.onToggleLock("agentCount")}
			/>
		</div>
	);
};
