import { For, Show } from "solid-js";
import { Canvas } from "./components/Canvas";
import { ControlDock } from "./components/ControlDock/ControlDock";
import { MobileWarningDialog } from "./components/MobileWarningDialog";
import { PerformancePanel } from "./components/PerformancePanel";
import { useGridRenderer } from "./hooks/useGridRenderer";
import { useIsMobile } from "./hooks/useIsMobile";
import { useSimulation } from "./hooks/useSimulation";
import { useViewport } from "./hooks/useViewport";

const App = () => {
	let canvasRef: HTMLCanvasElement | undefined;

	const viewportHook = useViewport();
	const simulationHook = useSimulation();
	const isMobile = useIsMobile();

	useGridRenderer(
		() => canvasRef,
		simulationHook.grid,
		viewportHook.viewport,
		viewportHook.canvasSize,
		simulationHook.slimeConfig,
		simulationHook.useWebGPU,
		simulationHook.gpuAvailable,
		simulationHook.gpuInitializing,
	);

	return (
		<div class="relative w-full h-screen overflow-hidden bg-gray-900">
			<For each={[simulationHook.canvasKey()]}>
				{() => (
					<Canvas
						canvasRef={(el) => {
							canvasRef = el;
							simulationHook.setCanvasRef(el);
						}}
						width={viewportHook.canvasSize().width}
						height={viewportHook.canvasSize().height}
					/>
				)}
			</For>

			<ControlDock
				running={simulationHook.running}
				speed={simulationHook.speed}
				slimeConfig={simulationHook.slimeConfig}
				useWebGPU={simulationHook.useWebGPU}
				viewportWidth={viewportHook.canvasSize().width}
				viewportHeight={viewportHook.canvasSize().height}
				isExporting={simulationHook.isExporting}
				isRecording={simulationHook.isRecording}
				onPlayPause={simulationHook.handlePlayPause}
				onStep={simulationHook.handleStep}
				onClear={simulationHook.handleClear}
				onSpeedChange={simulationHook.handleSpeedChange}
				onSlimeConfigChange={simulationHook.handleSlimeConfigChange}
				onRandomize={simulationHook.handleRandomize}
				onToggleSimulationMode={simulationHook.handleToggleSimulationMode}
				onExport={simulationHook.handleExportScreenshot}
				onToggleRecording={simulationHook.handleToggleRecording}
			/>

			<PerformancePanel
				fps={simulationHook.fps}
				frameTime={simulationHook.averageFrameTime}
				agentCount={simulationHook.agentCount}
			/>

			<Show when={isMobile()}>
				<MobileWarningDialog />
			</Show>
		</div>
	);
};

export default App;
