import { createEffect, createSignal, onMount } from "solid-js";
import type {
	SlimeConfig,
	SpawnPattern,
	SpeciesConfig,
} from "../../core/slime";
import type {
	LockedSettings,
	SpeciesLockedSettings,
} from "../../utils/storage";
import { Button } from "../Button";
import { CollapseButton } from "./CollapseButton";
import { ExportControl } from "./ExportControl";
import { InteractionMatrix } from "./InteractionMatrix";
import { PlaybackControls } from "./PlaybackControls";
import { SlimeMoldControls } from "./SlimeMoldControls";
import { SpawnPatternControl } from "./SpawnPatternControl";
import { SpeciesTabs } from "./SpeciesControl";
import { SpeedControl } from "./SpeedControl";

interface Props {
	running: () => boolean;
	speed: () => number;
	slimeConfig: () => SlimeConfig;
	lockedSettings: () => LockedSettings;
	useWebGPU: () => boolean;
	viewportWidth: number;
	viewportHeight: number;
	isExporting: () => boolean;
	isRecording: () => boolean;
	onPlayPause: () => void;
	onClear: () => void;
	onSpeedChange: (speed: number) => void;
	onSlimeConfigChange: (
		key: keyof SlimeConfig,
		value: SlimeConfig[keyof SlimeConfig] | SpeciesConfig[keyof SpeciesConfig],
		speciesIndex?: number,
		speciesKey?: keyof SpeciesConfig,
		interactionRow?: number,
		interactionCol?: number,
	) => void;
	onRandomize: () => void;
	onToggleSimulationMode: () => void;
	onExport: (width: number, height: number) => void;
	onToggleRecording: () => void;
	onToggleLock: (key: keyof Omit<LockedSettings, "species">) => void;
	onToggleSpeciesLock: (
		speciesIndex: number,
		key: keyof SpeciesLockedSettings,
	) => void;
}

const STORAGE_KEY = "controldock-collapsed";

export const ControlDock = (props: Props) => {
	const [collapsed, setCollapsed] = createSignal(false);

	onMount(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored !== null) {
			setCollapsed(stored === "true");
		}
	});

	createEffect(() => {
		localStorage.setItem(STORAGE_KEY, String(collapsed()));
	});

	function handleToggle() {
		setCollapsed(!collapsed());
	}

	return (
		<div class="absolute bottom-0 left-0 w-full z-10 flex justify-center pointer-events-none px-4">
			<div class="relative w-full max-w-[95vw] md:max-w-6xl">
				<CollapseButton collapsed={collapsed} onClick={handleToggle} />
				<div
					class={`relative pointer-events-auto bg-gray-800/95 border-2 border-gray-600 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)] pt-2 pb-4 px-4 flex flex-col gap-3 w-full rounded-sm`}
				>
					<div class="flex flex-row flex-wrap items-center justify-center gap-2 md:gap-4 shrink-0 z-20 relative">
						<PlaybackControls
							running={props.running}
							onPlayPause={props.onPlayPause}
							onRandomize={props.onRandomize}
							onClear={props.onClear}
						/>
						<ExportControl
							viewportWidth={props.viewportWidth}
							viewportHeight={props.viewportHeight}
							onExport={props.onExport}
							isExporting={props.isExporting}
							isRecording={props.isRecording}
							onToggleRecording={props.onToggleRecording}
						/>
					</div>

					<div
						class="grid transition-[grid-template-rows] duration-300 ease-in-out"
						style={{ "grid-template-rows": collapsed() ? "0fr" : "1fr" }}
					>
						<div class="overflow-hidden">
							<div class="flex flex-col gap-4 pt-3 border-t border-gray-700">
								<div class="flex flex-row flex-wrap items-center justify-center gap-3 md:gap-4">
									<SpeedControl
										speed={props.speed}
										onSpeedChange={props.onSpeedChange}
									/>
									<SpawnPatternControl
										spawnPattern={() => props.slimeConfig().spawnPattern}
										locked={props.lockedSettings().spawnPattern}
										onSpawnPatternChange={(pattern: SpawnPattern) =>
											props.onSlimeConfigChange("spawnPattern", pattern)
										}
										onToggleLock={() => props.onToggleLock("spawnPattern")}
									/>
									<Button
										onClick={props.onToggleSimulationMode}
										class="px-2 py-2 min-w-[64px] flex items-center justify-center"
										aria-label="Toggle simulation mode"
									>
										<span class="text-sm font-mono">
											{props.useWebGPU() ? "GPU" : "CPU"}
										</span>
									</Button>
								</div>
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
									<div class="flex flex-col gap-4">
										<SpeciesTabs
											configs={props.slimeConfig().species}
											lockedSettings={props.lockedSettings().species}
											onChange={(index, key, value) =>
												props.onSlimeConfigChange("species", value, index, key)
											}
											onToggleLock={(speciesIndex, key) =>
												props.onToggleSpeciesLock(speciesIndex, key)
											}
										/>
									</div>
									<div class="flex flex-col gap-4">
										<InteractionMatrix
											config={props.slimeConfig()}
											locked={props.lockedSettings().interactions}
											onChange={(row, col, value) =>
												props.onSlimeConfigChange(
													"interactions",
													value,
													undefined,
													undefined,
													row,
													col,
												)
											}
											onToggleLock={() => props.onToggleLock("interactions")}
										/>
										<SlimeMoldControls
											slimeConfig={props.slimeConfig}
											lockedSettings={props.lockedSettings}
											onSlimeConfigChange={props.onSlimeConfigChange}
											onToggleLock={props.onToggleLock}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
