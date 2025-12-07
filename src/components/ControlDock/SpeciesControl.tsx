import { createSignal, For, Show } from "solid-js";
import {
	COLOR_PRESETS,
	type ColorPreset,
	type ColorPresetName,
	getColorPreset,
	type SpeciesConfig,
} from "../../core/slime";
import type { SpeciesLockedSettings } from "../../utils/storage";
import { LockButton } from "../LockButton";
import { Popover } from "../Popover";

const presetEntries = Object.entries(COLOR_PRESETS) as [
	ColorPresetName,
	ColorPreset,
][];

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
				class="glass-slider w-full cursor-pointer"
			/>
		</div>
	);
};

interface SpeciesControlProps {
	index: number;
	config: SpeciesConfig;
	lockedSettings: SpeciesLockedSettings;
	onChange: (
		index: number,
		key: keyof SpeciesConfig,
		value: SpeciesConfig[keyof SpeciesConfig],
	) => void;
	onToggleLock: (key: keyof SpeciesLockedSettings) => void;
}

export const SpeciesControl = (props: SpeciesControlProps) => {
	return (
		<div class="flex flex-col gap-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
					<LockButton
						locked={props.lockedSettings.colorPreset}
						onToggle={() => props.onToggleLock("colorPreset")}
					/>
					Color Palette
				</div>
				<Popover
					trigger={({ toggle }) => {
						const currentPreset = getColorPreset(props.config.colorPreset);
						return (
							<button
								type="button"
								onClick={toggle}
								class="w-24 h-7 rounded-xl cursor-pointer transition-all hover:scale-105"
								style={{
									"background-image": `linear-gradient(90deg, ${currentPreset.low}, ${currentPreset.mid}, ${currentPreset.high})`,
									border: "1px solid rgba(255, 255, 255, 0.2)",
									"box-shadow":
										"0 3px 10px rgba(0, 0, 0, 0.2), inset 0 0.5px 0 rgba(255, 255, 255, 0.25)",
								}}
								aria-label="Select palette"
							/>
						);
					}}
				>
					{({ close }) => (
						<div class="preset-list flex flex-col gap-2 min-w-[120px] max-h-[250px] overflow-y-auto">
							<For each={presetEntries}>
								{([presetName, presetColors]) => {
									const isActive = props.config.colorPreset === presetName;

									return (
										<button
											type="button"
											onClick={() => {
												props.onChange(props.index, "colorPreset", presetName);
												close();
											}}
											class={`flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 transition-all w-full text-left cursor-pointer ${
												isActive ? "bg-white/15" : ""
											}`}
										>
											<div
												class={`w-8 h-6 rounded-lg border backdrop-blur-sm ${
													isActive ? "border-white/40" : "border-white/20"
												}`}
												style={{
													"background-image": `linear-gradient(90deg, ${presetColors.low}, ${presetColors.mid}, ${presetColors.high})`,
												}}
											/>
											<span
												class={`text-xs uppercase font-bold tracking-wider ${
													isActive ? "text-white" : "text-gray-300"
												}`}
											>
												{presetName}
											</span>
										</button>
									);
								}}
							</For>
						</div>
					)}
				</Popover>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<SliderControl
					label="Sensor Angle"
					displayValue={`${Math.round((props.config.sensorAngle * 180) / Math.PI)}°`}
					value={(props.config.sensorAngle * 180) / Math.PI}
					min={0}
					max={180}
					onChange={(value) =>
						props.onChange(props.index, "sensorAngle", (value * Math.PI) / 180)
					}
					locked={props.lockedSettings.sensorAngle}
					onToggleLock={() => props.onToggleLock("sensorAngle")}
				/>

				<SliderControl
					label="Turn Angle"
					displayValue={`${Math.round((props.config.turnAngle * 180) / Math.PI)}°`}
					value={(props.config.turnAngle * 180) / Math.PI}
					min={0}
					max={180}
					onChange={(value) =>
						props.onChange(props.index, "turnAngle", (value * Math.PI) / 180)
					}
					locked={props.lockedSettings.turnAngle}
					onToggleLock={() => props.onToggleLock("turnAngle")}
				/>

				<SliderControl
					label="Sensor Dist"
					displayValue={`${props.config.sensorDist}px`}
					value={props.config.sensorDist}
					min={1}
					max={64}
					onChange={(value) => props.onChange(props.index, "sensorDist", value)}
					locked={props.lockedSettings.sensorDist}
					onToggleLock={() => props.onToggleLock("sensorDist")}
				/>

				<SliderControl
					label="Deposit"
					displayValue={String(props.config.depositAmount)}
					value={props.config.depositAmount}
					min={1}
					max={255}
					onChange={(value) =>
						props.onChange(props.index, "depositAmount", value)
					}
					locked={props.lockedSettings.depositAmount}
					onToggleLock={() => props.onToggleLock("depositAmount")}
				/>

				<SliderControl
					label="Speed"
					displayValue={props.config.agentSpeed.toFixed(1)}
					value={props.config.agentSpeed}
					min={0.1}
					max={5}
					step={0.1}
					onChange={(value) => props.onChange(props.index, "agentSpeed", value)}
					locked={props.lockedSettings.agentSpeed}
					onToggleLock={() => props.onToggleLock("agentSpeed")}
				/>

				<SliderControl
					label="Population"
					displayValue={`${props.config.agentCount}%`}
					value={props.config.agentCount}
					min={0}
					max={100}
					step={5}
					onChange={(value) => props.onChange(props.index, "agentCount", value)}
					locked={props.lockedSettings.agentCount}
					onToggleLock={() => props.onToggleLock("agentCount")}
				/>
			</div>
		</div>
	);
};

interface SpeciesTabsProps {
	configs: [SpeciesConfig, SpeciesConfig, SpeciesConfig];
	lockedSettings: [
		SpeciesLockedSettings,
		SpeciesLockedSettings,
		SpeciesLockedSettings,
	];
	onChange: (
		index: number,
		key: keyof SpeciesConfig,
		value: SpeciesConfig[keyof SpeciesConfig],
	) => void;
	onToggleLock: (
		speciesIndex: number,
		key: keyof SpeciesLockedSettings,
	) => void;
}

export const SpeciesTabs = (props: SpeciesTabsProps) => {
	const [activeTab, setActiveTab] = createSignal(0);

	return (
		<div class="glass-panel-subtle flex flex-col gap-4 p-3 rounded-xl">
			<div class="flex gap-1 border-b border-white/10 pb-2">
				<For each={[0, 1, 2]}>
					{(index) => {
						const preset = getColorPreset(props.configs[index].colorPreset);
						return (
							<button
								type="button"
								onClick={() => setActiveTab(index)}
								class={`flex-1 py-1.5 px-2 text-[10px] uppercase font-medium tracking-wider rounded-xl transition-all ${
									activeTab() === index
										? "glass-button text-white"
										: "text-gray-400 hover:text-gray-200 hover:bg-white/5"
								}`}
							>
								<div class="flex items-center justify-center gap-2">
									<div
										class="w-2 h-2 rounded-full"
										style={{ background: preset.mid }}
									/>
									Species {index + 1}
								</div>
							</button>
						);
					}}
				</For>
			</div>

			<SpeciesControl
				index={activeTab()}
				config={props.configs[activeTab()]}
				lockedSettings={props.lockedSettings[activeTab()]}
				onChange={props.onChange}
				onToggleLock={(key) => props.onToggleLock(activeTab(), key)}
			/>
		</div>
	);
};
