import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
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

const TRANSITION_DURATION = 150;

export const ControlDock = (props: Props) => {
	const [collapsed, setCollapsed] = createSignal(true);
	const [isTransitioning, setIsTransitioning] = createSignal(false);
	let transitionTimeout: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored !== null) {
			setCollapsed(stored === "true");
		}
	});

	onCleanup(() => {
		if (transitionTimeout) {
			clearTimeout(transitionTimeout);
		}
	});

	createEffect(() => {
		localStorage.setItem(STORAGE_KEY, String(collapsed()));
	});

	function handleToggle() {
		if (transitionTimeout) {
			clearTimeout(transitionTimeout);
		}
		setIsTransitioning(true);
		setCollapsed(!collapsed());
		transitionTimeout = setTimeout(() => {
			setIsTransitioning(false);
		}, TRANSITION_DURATION);
	}

	return (
		<div class="fixed bottom-0 left-0 w-full z-10 flex justify-center pointer-events-none px-4 pb-0">
			<div class="relative flex flex-col items-center w-full max-w-[95vw] md:max-w-6xl">
				<CollapseButton collapsed={collapsed} onClick={handleToggle} />
				<div
					class="glass-panel pointer-events-auto flex flex-row items-center justify-center py-2 px-4 gap-1 md:gap-2 z-40 rounded-2xl rounded-b-none"
					style={{
						background: collapsed()
							? "rgba(255, 255, 255, 0.01)"
							: "rgba(48, 48, 48, 0.5)",
						"backdrop-filter": collapsed()
							? "blur(16px) saturate(120%)"
							: "blur(32px) saturate(120%)",
						"-webkit-backdrop-filter": collapsed()
							? "blur(16px) saturate(120%)"
							: "blur(32px) saturate(120%)",
						"border-bottom": collapsed() ? undefined : "none",
						transition: `background ${TRANSITION_DURATION}ms ease-out, backdrop-filter ${TRANSITION_DURATION}ms ease-out, -webkit-backdrop-filter ${TRANSITION_DURATION}ms ease-out, border-bottom ${TRANSITION_DURATION}ms ease-out, border-radius ${TRANSITION_DURATION}ms ease-out`,
					}}
				>
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
					class="grid w-full"
					style={{
						"grid-template-rows": collapsed() ? "0fr" : "1fr",
						transition: `grid-template-rows ${TRANSITION_DURATION}ms ease-out`,
						overflow: "hidden",
					}}
				>
					<div
						class={`pointer-events-auto ${collapsed() ? "" : "max-h-[75dvh] md:max-h-[calc(100vh-120px)]"}`}
						style={{
							overflow: isTransitioning() || collapsed() ? "hidden" : "auto",
						}}
					>
						<div
							class="glass-panel pointer-events-auto flex flex-col rounded-2xl py-3 px-4 gap-4 z-30"
							style={{
								background: "rgba(48, 48, 48, 0.5)",
								"backdrop-filter": "blur(32px) saturate(120%)",
								"-webkit-backdrop-filter": "blur(32px) saturate(120%)",
								"border-top": "none",
							}}
						>
							<div class="glass-panel-subtle flex flex-row flex-wrap items-center justify-center gap-3 md:gap-4 p-3 rounded-xl">
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
									class="h-[36px] px-3 min-w-[64px] flex items-center justify-center"
									aria-label="Toggle simulation mode"
								>
									<span class="text-sm font-mono">
										{props.useWebGPU() ? "GPU" : "CPU"}
									</span>
								</Button>
							</div>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/10 items-stretch">
								<div class="flex flex-col gap-4 h-full">
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
								<div class="flex flex-col gap-4 h-full">
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
								</div>
							</div>
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
	);
};
