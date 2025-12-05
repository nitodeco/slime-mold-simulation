import { Canvas } from "./components/Canvas";
import { ControlDock } from "./components/ControlDock";
import { InstructionsOverlay } from "./components/InstructionsOverlay";
import type { RuleName } from "./core/rules";
import { useCanvasInteraction } from "./hooks/useCanvasInteraction";
import { useGridRenderer } from "./hooks/useGridRenderer";
import { useSimulation } from "./hooks/useSimulation";
import { useViewport } from "./hooks/useViewport";

export default function App() {
	let canvasRef: HTMLCanvasElement | undefined;

	const viewportHook = useViewport();
	const simulationHook = useSimulation();
	const canvasInteractionHook = useCanvasInteraction(
		viewportHook.viewport,
		simulationHook.setCellAt,
		viewportHook.setViewport,
	);

	useGridRenderer(
		() => canvasRef,
		simulationHook.grid,
		viewportHook.viewport,
		viewportHook.canvasSize,
	);

	function handleRuleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		simulationHook.handleRuleChange(target.value as RuleName);
	}

	function handleSpeedChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newSpeed = Number.parseInt(target.value, 10);
		simulationHook.handleSpeedChange(newSpeed);
	}

	return (
		<div class="relative w-full h-screen overflow-hidden bg-gray-900">
			<Canvas
				canvasRef={(el) => {
					canvasRef = el;
				}}
				width={viewportHook.canvasSize().width}
				height={viewportHook.canvasSize().height}
				onMouseDown={canvasInteractionHook.handleMouseDown}
				onMouseMove={canvasInteractionHook.handleMouseMove}
				onMouseUp={canvasInteractionHook.handleMouseUp}
				onWheel={viewportHook.handleWheel}
			/>

			<ControlDock
				rule={simulationHook.rule}
				running={simulationHook.running}
				speed={simulationHook.speed}
				onRuleChange={handleRuleChange}
				onPlayPause={simulationHook.handlePlayPause}
				onStep={simulationHook.handleStep}
				onRandom={simulationHook.handleRandom}
				onClear={simulationHook.handleClear}
				onSpeedChange={handleSpeedChange}
			/>

			<InstructionsOverlay />
		</div>
	);
}
