import type { Accessor } from "solid-js";
import { GRID_COLS, GRID_ROWS } from "../constants";

interface Props {
	fps: Accessor<number>;
	frameTime: Accessor<number>;
	agentCount: Accessor<number>;
}

export const PerformancePanel = (props: Props) => {
	return (
		<div class="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white p-3 rounded-sm font-mono text-xs z-20 border border-white/10 shadow-lg pointer-events-none select-none">
			<div class="flex flex-col gap-1">
				<div class="flex justify-between gap-4">
					<span class="text-gray-400">FPS:</span>
					<span class="font-bold text-green-400">{props.fps()}</span>
				</div>
				<div class="flex justify-between gap-4">
					<span class="text-gray-400">Frame Time:</span>
					<span>{props.frameTime().toFixed(2)}ms</span>
				</div>
				<div class="flex justify-between gap-4">
					<span class="text-gray-400">Agents:</span>
					<span>{props.agentCount().toLocaleString()}</span>
				</div>
				<div class="flex justify-between gap-4">
					<span class="text-gray-400">Grid:</span>
					<span>
						{GRID_COLS}x{GRID_ROWS}
					</span>
				</div>
			</div>
		</div>
	);
};
