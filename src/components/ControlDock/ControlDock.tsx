import { createEffect, createSignal, onMount, Show } from "solid-js";
import type { SlimeConfig } from "../../core/slime";
import { Button } from "../Button";
import { CollapseButton } from "./CollapseButton";
import { ColorControl } from "./ColorControl";
import { ExportControl } from "./ExportControl";
import { PlaybackControls } from "./PlaybackControls";
import { SlimeMoldControls } from "./SlimeMoldControls";
import { SpeedControl } from "./SpeedControl";

interface Props {
	running: () => boolean;
	speed: () => number;
	slimeConfig: () => SlimeConfig;
	useWebGPU: () => boolean;
	viewportWidth: number;
	viewportHeight: number;
	isExporting: () => boolean;
	isRecording: () => boolean;
	onPlayPause: () => void;
	onStep: () => void;
	onClear: () => void;
	onSpeedChange: (speed: number) => void;
	onSlimeConfigChange: (key: keyof SlimeConfig, value: number | string) => void;
	onRandomize: () => void;
	onToggleSimulationMode: () => void;
	onExport: (width: number, height: number) => void;
	onToggleRecording: () => void;
}

const STORAGE_KEY = "controldock-collapsed";

export const ControlDock = (props: Props) => {
	const [collapsed, setCollapsed] = createSignal(false);
	const [isExpanding, setIsExpanding] = createSignal(false);
	const [isCollapsing, setIsCollapsing] = createSignal(false);

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
		if (collapsed()) {
			setIsExpanding(true);
			setCollapsed(false);
			setTimeout(() => {
				setIsExpanding(false);
			}, 100);
		} else {
			setIsCollapsing(true);
			setTimeout(() => {
				setCollapsed(true);
				setIsCollapsing(false);
			}, 100);
		}
	}

	return (
		<div class="absolute bottom-0 left-0 w-full z-10 flex justify-center pointer-events-none px-4">
			<div
				class={`relative w-full max-w-[95vw] md:max-w-4xl ${
					isExpanding()
						? "dock-expand"
						: isCollapsing()
							? "dock-collapse"
							: collapsed()
								? "translate-y-[calc(100%-8px)]"
								: ""
				}`}
			>
				<div
					class={`pointer-events-auto bg-gray-800/95 border-2 border-gray-600 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)] pt-2 pb-4 px-4 flex flex-col gap-3 w-full`}
				>
					<div class="flex flex-row flex-wrap items-center justify-center gap-2 md:gap-4 shrink-0 z-20 relative">
						<PlaybackControls
							running={props.running}
							onPlayPause={props.onPlayPause}
							onStep={props.onStep}
							onClear={props.onClear}
						/>
						<SpeedControl
							speed={props.speed}
							onSpeedChange={props.onSpeedChange}
						/>
						<ColorControl
							color={() => props.slimeConfig().color}
							onColorChange={(color) =>
								props.onSlimeConfigChange("color", color)
							}
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
						<Button
							onClick={props.onRandomize}
							class="px-4 py-2 min-w-[48px] flex items-center justify-center"
							aria-label="Randomize settings"
						>
							<i class="hn hn-shuffle w-5 h-5" />
						</Button>
						<Button
							onClick={props.onToggleRecording}
							class={`px-4 py-2 min-w-[48px] flex items-center justify-center ${
								props.isRecording() ? "text-red-500" : ""
							}`}
							aria-label={
								props.isRecording() ? "Stop recording" : "Record video"
							}
						>
							<Show
								when={props.isRecording()}
								fallback={<i class="hn hn-retro-camera w-5 h-5" />}
							>
								<div class="w-4 h-4 bg-red-500 rounded-sm" />
							</Show>
						</Button>
						<ExportControl
							viewportWidth={props.viewportWidth}
							viewportHeight={props.viewportHeight}
							onExport={props.onExport}
							isExporting={props.isExporting}
						/>
					</div>

					<SlimeMoldControls
						slimeConfig={props.slimeConfig}
						onSlimeConfigChange={props.onSlimeConfigChange}
					/>
				</div>
				<CollapseButton collapsed={collapsed} onClick={handleToggle} />
			</div>
		</div>
	);
};
