import { Button } from "../Button";

interface PlaybackControlsProps {
	running: () => boolean;
	onPlayPause: () => void;
	onStep: () => void;
	onClear: () => void;
}

export const PlaybackControls = (props: PlaybackControlsProps) => {
	return (
		<div class="flex flex-wrap justify-center items-center gap-3">
			<div class="flex items-center gap-2">
				<Button
					onClick={props.onPlayPause}
					variant={props.running() ? "stop" : "play"}
					class="px-4 py-2 min-w-[48px] flex items-center justify-center"
					aria-label={props.running() ? "Pause" : "Play"}
				>
					{props.running() ? (
						<i class="hn hn-pause w-5 h-5" />
					) : (
						<i class="hn hn-play w-5 h-5" />
					)}
				</Button>
				<Button
					onClick={props.onStep}
					class="px-4 py-2 min-w-[48px] flex items-center justify-center"
					aria-label="Step forward"
				>
					<i class="hn hn-arrow-right w-5 h-5" />
				</Button>
			</div>

			<div class="h-8 w-px bg-gray-700 mx-2 hidden md:block" />

			<div class="flex items-center gap-2">
				<Button
					onClick={props.onClear}
					class="px-4 py-2 min-w-[48px] flex items-center justify-center"
					aria-label="Clear"
				>
					<i class="hn hn-trash w-5 h-5" />
				</Button>
			</div>
		</div>
	);
};
