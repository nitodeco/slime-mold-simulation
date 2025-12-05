import type { RuleName } from "../core/rules";
import { Button } from "./Button";

interface Porps {
	rule: () => RuleName;
	running: () => boolean;
	speed: () => number;
	onRuleChange: (event: Event) => void;
	onPlayPause: () => void;
	onStep: () => void;
	onRandom: () => void;
	onClear: () => void;
	onSpeedChange: (event: Event) => void;
}

export function ControlDock(props: Porps) {
	return (
		<div class="absolute bottom-8 left-0 w-full z-10 flex justify-center pointer-events-none px-4">
			<div class="pointer-events-auto bg-gray-800/95 backdrop-blur-sm border-2 border-gray-600 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.6)] p-4 flex flex-col gap-3 w-full max-w-[95vw] md:max-w-4xl">
				<div class="flex flex-row flex-wrap items-center justify-center gap-4 md:gap-8">
					{/* Rule Selector */}
					<div class="flex items-center">
						<select
							value={props.rule()}
							onChange={props.onRuleChange}
							class="w-full md:w-48 bg-gray-900 text-gray-200 text-xs md:text-sm border-2 border-gray-600 px-3 py-2 focus:outline-none focus:border-gray-400 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-px active:shadow-none hover:bg-gray-800 transition-colors font-bold"
						>
							<option value="conway">Conway's Life</option>
							<option value="briansbrain">Brian's Brain</option>
						</select>
					</div>

					{/* Playback Controls */}
					<div class="flex flex-wrap justify-center items-center gap-3">
						<div class="flex items-center gap-2">
							<Button
								onClick={props.onPlayPause}
								variant={props.running() ? "stop" : "play"}
								class="px-6 min-w-[80px]"
							>
								{props.running() ? "STOP" : "PLAY"}
							</Button>
							<Button onClick={props.onStep}>STEP</Button>
						</div>

						<div class="h-8 w-px bg-gray-700 mx-2 hidden md:block" />

						{/* Actions */}
						<div class="flex items-center gap-2">
							<Button onClick={props.onRandom}>RND</Button>
							<Button onClick={props.onClear}>CLR</Button>
						</div>
					</div>

					{/* Speed Control */}
					<div class="flex items-center gap-3 bg-gray-900/40 px-3 py-2 border-2 border-gray-700/30 rounded-sm">
						<span class="text-gray-400 text-[10px] uppercase tracking-wider font-bold">
							Speed
						</span>
						<input
							type="range"
							min="10"
							max="500"
							value={props.speed()}
							onInput={props.onSpeedChange}
							class="pixel-slider w-24 cursor-pointer"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
