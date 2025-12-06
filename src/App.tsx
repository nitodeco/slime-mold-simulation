import { Canvas } from "./components/Canvas";
import { ControlDock } from "./components/ControlDock/ControlDock";
import { InstructionsOverlay } from "./components/InstructionsOverlay";
import { MobileWarningDialog } from "./components/MobileWarningDialog";
import { useCanvasInteraction } from "./hooks/useCanvasInteraction";
import { useGridRenderer } from "./hooks/useGridRenderer";
import { useIsMobile } from "./hooks/useIsMobile";
import { useSimulation } from "./hooks/useSimulation";
import { useViewport } from "./hooks/useViewport";

const App = () => {
	let canvasRef: HTMLCanvasElement | undefined;

	const viewportHook = useViewport();
	const simulationHook = useSimulation();
	const isMobile = useIsMobile();
	const canvasInteractionHook = useCanvasInteraction(
		viewportHook.viewport,
		simulationHook.setCellAt,
		simulationHook.clearInteraction,
	);

	useGridRenderer(
		() => canvasRef,
		simulationHook.grid,
		viewportHook.viewport,
		viewportHook.canvasSize,
		simulationHook.slimeConfig,
		simulationHook.interactionTarget,
	);

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
			/>

			<ControlDock
				running={simulationHook.running}
				speed={simulationHook.speed}
				slimeConfig={simulationHook.slimeConfig}
				onPlayPause={simulationHook.handlePlayPause}
				onStep={simulationHook.handleStep}
				onClear={simulationHook.handleClear}
				onSpeedChange={simulationHook.handleSpeedChange}
				onSlimeConfigChange={simulationHook.handleSlimeConfigChange}
				onRandomize={simulationHook.handleRandomize}
			/>

			<InstructionsOverlay />
			<MobileWarningDialog isMobile={isMobile} />
		</div>
	);
};

export default App;
