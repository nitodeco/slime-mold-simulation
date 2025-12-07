import type { Accessor } from "solid-js";
import { GRID_COLS, GRID_ROWS } from "../constants";

interface Props {
	fps: Accessor<number>;
	frameTime: Accessor<number>;
	agentCount: Accessor<number>;
	stepCount: Accessor<number>;
}

function getFpsColor(fps: number): string {
	if (fps < 30) return "text-red-400";
	if (fps < 60) return "text-yellow-400";
	return "text-green-400";
}

function getFrameTimeColor(frameTime: number): string {
	if (frameTime > 33) return "text-red-400";
	if (frameTime > 16) return "text-yellow-400";
	return "text-gray-100";
}

export const PerformancePanel = (props: Props) => {
	return (
		<div class="glass-panel absolute top-4 right-4 text-white px-3 py-2 rounded-lg font-mono text-[11px] z-20 pointer-events-none select-none">
			<div class="grid grid-cols-[auto_1fr_auto_auto_1fr] gap-x-2 gap-y-0.5 items-center">
				<span class="text-gray-400">FPS</span>
				<span
					class={`font-semibold tabular-nums text-right ${getFpsColor(props.fps())}`}
				>
					{props.fps()}
				</span>
				<span class="text-gray-600">·</span>
				<span class="text-gray-400">Step</span>
				<span class="tabular-nums text-right text-gray-100">
					{props.stepCount().toLocaleString()}
				</span>

				<span class="text-gray-400">Time</span>
				<span
					class={`tabular-nums text-right ${getFrameTimeColor(props.frameTime())}`}
				>
					{props.frameTime().toFixed(1)}ms
				</span>
				<span class="text-gray-600">·</span>
				<span class="text-gray-400">Agents</span>
				<span class="tabular-nums text-right text-gray-100">
					{props.agentCount().toLocaleString()}
				</span>

				<span class="text-gray-400">Resolution</span>
				<span
					class="tabular-nums text-right text-gray-100"
					style={{ "grid-column": "2 / -1" }}
				>
					{GRID_COLS}×{GRID_ROWS}
				</span>
			</div>
		</div>
	);
};
