import { For, Show } from "solid-js";
import { Canvas } from "./components/Canvas";
import { ControlDock } from "./components/ControlDock/ControlDock";
import { ShareControl } from "./components/ControlDock/ShareControl";
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
			<div class="absolute top-4 left-4 z-20 pointer-events-auto">
				<ShareControl getShareUrl={simulationHook.getShareUrl} />
			</div>
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
				lockedSettings={simulationHook.lockedSettings}
				useWebGPU={simulationHook.useWebGPU}
				viewportWidth={viewportHook.canvasSize().width}
				viewportHeight={viewportHook.canvasSize().height}
				isExporting={simulationHook.isExporting}
				isRecording={simulationHook.isRecording}
				onPlayPause={simulationHook.handlePlayPause}
				onClear={simulationHook.handleClear}
				onSpeedChange={simulationHook.handleSpeedChange}
				onSlimeConfigChange={simulationHook.handleSlimeConfigChange}
				onRandomize={simulationHook.handleRandomize}
				onToggleSimulationMode={simulationHook.handleToggleSimulationMode}
				onExport={simulationHook.handleExportScreenshot}
				onToggleRecording={simulationHook.handleToggleRecording}
				onToggleLock={simulationHook.handleToggleLock}
				onToggleSpeciesLock={simulationHook.handleToggleSpeciesLock}
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
