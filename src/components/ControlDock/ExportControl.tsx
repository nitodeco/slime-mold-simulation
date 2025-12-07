import { Camera } from "lucide-solid";
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
						fallback={<Camera class="w-5 h-5" />}
					>
						<div class="w-5 h-5 bg-red-500 rounded-sm animate-pulse" />
					</Show>
				</Show>
			</Button>

			<Show when={dropdownOpen() && !props.isExporting()}>
				<div class="glass-panel absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[180px] z-20 pointer-events-auto flex flex-col rounded-xl">
					<div class="p-2.5 border-b border-white/10">
						<div class="text-[10px] uppercase text-gray-200 mb-1.5 font-medium tracking-wider">
							Video
						</div>
						<button
							type="button"
							onClick={handleToggleRecording}
							class={`w-full px-2.5 py-2 text-left text-xs border transition-all flex items-center gap-2 cursor-pointer rounded-xl ${
								props.isRecording()
									? "border-red-400/30 bg-red-500/20 text-red-200 hover:bg-red-500/30"
									: "border-transparent text-gray-200 hover:bg-white/10"
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

					<div class="p-2.5">
						<div class="text-[10px] uppercase text-gray-200 mb-1.5 font-medium tracking-wider">
							Snapshot
						</div>
						<button
							type="button"
							onClick={handleViewportExport}
							class="w-full px-2.5 py-2 text-left text-xs text-gray-200 hover:bg-white/10 border border-transparent cursor-pointer rounded-xl transition-all"
						>
							Viewport ({props.viewportWidth}x{props.viewportHeight})
						</button>
						{RESOLUTION_PRESETS.map((preset) => (
							<button
								type="button"
								onClick={() => handleExport(preset.width, preset.height)}
								class="w-full px-2.5 py-2 text-left text-xs text-gray-200 hover:bg-white/10 border border-transparent cursor-pointer rounded-xl transition-all"
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
