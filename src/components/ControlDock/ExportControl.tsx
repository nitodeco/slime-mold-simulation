import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { Button } from "../Button";

export interface ResolutionPreset {
	label: string;
	width: number;
	height: number;
}

interface Props {
	viewportWidth: number;
	viewportHeight: number;
	onExport: (width: number, height: number) => void;
	isExporting: () => boolean;
	isRecording: () => boolean;
	onToggleRecording: () => void;
}

const RESOLUTION_PRESETS: ResolutionPreset[] = [
	{ label: "1080p", width: 1920, height: 1080 },
	{ label: "1440p", width: 2560, height: 1440 },
	{ label: "4K", width: 3840, height: 2160 },
];

export const ExportControl = (props: Props) => {
	const [dropdownOpen, setDropdownOpen] = createSignal(false);
	let containerRef: HTMLDivElement | undefined;

	function handleExport(width: number, height: number) {
		setDropdownOpen(false);
		props.onExport(width, height);
	}

	function handleViewportExport() {
		handleExport(props.viewportWidth, props.viewportHeight);
	}

	function handleToggleRecording() {
		setDropdownOpen(false);
		props.onToggleRecording();
	}

	function handleClickOutside(event: MouseEvent) {
		if (
			containerRef &&
			!containerRef.contains(event.target as Node) &&
			dropdownOpen()
		) {
			setDropdownOpen(false);
		}
	}

	function setContainerRef(el: HTMLDivElement) {
		containerRef = el;
	}

	onMount(() => {
		document.addEventListener("mousedown", handleClickOutside);
	});

	onCleanup(() => {
		document.removeEventListener("mousedown", handleClickOutside);
	});

	return (
		<div class="relative" ref={setContainerRef}>
			<Button
				onClick={() => setDropdownOpen(!dropdownOpen())}
				class={`px-4 py-2 min-w-[48px] flex items-center justify-center gap-2 ${
					props.isRecording()
						? "border-red-500/50 bg-red-900/20 text-red-200"
						: ""
				}`}
				aria-label="Export menu"
			>
				<Show
					when={!props.isExporting()}
					fallback={
						<div class="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
					}
				>
					<Show
						when={props.isRecording()}
						fallback={<i class="hn hn-retro-camera w-5 h-5" />}
					>
						<div class="w-5 h-5 bg-red-500 rounded-sm animate-pulse" />
					</Show>
				</Show>
			</Button>

			<Show when={dropdownOpen() && !props.isExporting()}>
				<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 border-2 border-gray-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.6)] min-w-[180px] z-20 pointer-events-auto flex flex-col rounded-sm">
					<div class="p-2 border-b border-gray-600">
						<div class="text-[10px] uppercase text-gray-400 mb-1 font-bold tracking-wider">
							Video
						</div>
						<button
							type="button"
							onClick={handleToggleRecording}
							class={`w-full px-2 py-1.5 text-left text-xs border transition-colors flex items-center gap-2 cursor-pointer rounded-sm ${
								props.isRecording()
									? "border-red-500/50 bg-red-900/20 text-red-200 hover:bg-red-900/40"
									: "border-transparent text-gray-200 hover:bg-gray-700"
							}`}
						>
							<div
								class={`w-2 h-2 rounded-full ${
									props.isRecording()
										? "bg-red-500 animate-pulse"
										: "bg-red-500"
								}`}
							/>
							{props.isRecording() ? "Stop Recording" : "Start Recording"}
						</button>
					</div>

					<div class="p-2">
						<div class="text-[10px] uppercase text-gray-400 mb-1 font-bold tracking-wider">
							Snapshot
						</div>
						<button
							type="button"
							onClick={handleViewportExport}
							class="w-full px-2 py-1.5 text-left text-xs text-gray-200 hover:bg-gray-700 border border-transparent cursor-pointer rounded-sm"
						>
							Viewport ({props.viewportWidth}x{props.viewportHeight})
						</button>
						{RESOLUTION_PRESETS.map((preset) => (
							<button
								type="button"
								onClick={() => handleExport(preset.width, preset.height)}
								class="w-full px-2 py-1.5 text-left text-xs text-gray-200 hover:bg-gray-700 border border-transparent cursor-pointer rounded-sm"
							>
								{preset.label} ({preset.width}x{preset.height})
							</button>
						))}
					</div>
				</div>
			</Show>
		</div>
	);
};
