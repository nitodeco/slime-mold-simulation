import {
	createEffect,
	createMemo,
	createSignal,
	onCleanup,
	onMount,
} from "solid-js";
import { GRID_COLS, GRID_ROWS, MAX_CPU_AGENTS } from "../constants";
import { createEngine, type Engine } from "../core/engine";
import { clearGrid, createGrid, type Grid } from "../core/grid";
import {
	type AgentPool,
	createAgentPool,
	DEFAULT_SLIME_CONFIG,
	type SlimeConfig,
	stepSlime,
} from "../core/slime";
import {
	createGPUSimulation,
	type GPUSimulation,
} from "../core/webgpu/gpuSimulation";
import {
	loadSimulationSettings,
	saveSimulationSettings,
} from "../utils/storage";

export function useSimulation() {
	const bufferA = createGrid(GRID_ROWS, GRID_COLS);
	const bufferB = createGrid(GRID_ROWS, GRID_COLS);

	const [currentBuffer, setCurrentBuffer] = createSignal<Grid>(bufferA);
	const [running, setRunning] = createSignal(false);

	const loadedSettings = loadSimulationSettings();
	const [speed, setSpeed] = createSignal(loadedSettings?.speed ?? 50);
	const [slimeConfig, setSlimeConfig] = createSignal<SlimeConfig>(
		loadedSettings?.slimeConfig ?? DEFAULT_SLIME_CONFIG,
	);
	const [gpuAvailable, setGpuAvailable] = createSignal(false);
	const [useWebGPU, setUseWebGPU] = createSignal(
		loadedSettings?.useWebGPU ?? true,
	);
	const [gpuInitializing, setGpuInitializing] = createSignal(true);
	const [canvasKey, setCanvasKey] = createSignal(0);
	const [fps, setFps] = createSignal(0);
	const [averageFrameTime, setAverageFrameTime] = createSignal(0);
	const [isExporting, setIsExporting] = createSignal(false);
	const [isRecording, setIsRecording] = createSignal(false);

	let isInitialLoad = true;

	let engine: Engine | undefined;
	const agentsRef: { current: AgentPool | null } = { current: null };
	let gpuSimulation: GPUSimulation | null = null;
	let canvasRef: HTMLCanvasElement | null = null;
	let mediaRecorder: MediaRecorder | null = null;
	let recordedChunks: Blob[] = [];
	let gpuInitialized = false;
	let lastFrameTime = 0;

	const agentCount = createMemo(() => {
		return calculateAgentCount(slimeConfig());
	});

	function getOtherBuffer(current: Grid): Grid {
		return current === bufferA ? bufferB : bufferA;
	}

	function forceRerender() {
		setCurrentBuffer((current) => current);
	}

	function speedToInterval(speedValue: number): number {
		const interval = 100 - speedValue;
		return interval === 0 ? 1 : interval;
	}

	function calculateAgentCount(config: SlimeConfig): number {
		const rawCount = Math.floor(
			GRID_ROWS * GRID_COLS * (config.agentCount / 100),
		);

		if (!gpuAvailable() || !useWebGPU()) {
			return Math.min(rawCount, MAX_CPU_AGENTS);
		}

		return rawCount;
	}

	function initAgents() {
		const config = slimeConfig();
		const count = calculateAgentCount(config);
		agentsRef.current = createAgentPool(count, GRID_COLS, GRID_ROWS);
	}

	function tick() {
		const startTime = performance.now();

		if (gpuAvailable() && useWebGPU() && gpuSimulation) {
			gpuSimulation.tickAndRender();
		} else {
			const source = currentBuffer();
			const destination = getOtherBuffer(source);

			if (agentsRef.current === null) {
				initAgents();
			}

			if (agentsRef.current) {
				stepSlime(source, destination, agentsRef.current, slimeConfig());
			}

			setCurrentBuffer(destination);
		}

		const endTime = performance.now();
		lastFrameTime = endTime - startTime;
	}

	function handlePlayPause() {
		if (!engine) {
			return;
		}

		if (running()) {
			engine.stop();
			setRunning(false);
		} else {
			engine.start();
			setRunning(true);
		}
	}

	function handleStep() {
		tick();
	}

	function handleClear() {
		if (gpuAvailable() && useWebGPU() && gpuSimulation) {
			gpuSimulation.clear();

			const config = slimeConfig();
			const count = calculateAgentCount(config);

			gpuSimulation.reinitAgents(count);
			gpuSimulation.render();
		} else {
			const current = currentBuffer();

			clearGrid(current);
			clearGrid(getOtherBuffer(current));

			agentsRef.current = null;

			initAgents();
			forceRerender();
		}
	}

	function handleSpeedChange(newSpeed: number) {
		setSpeed(newSpeed);
		engine?.setSpeed(speedToInterval(newSpeed));
	}

	function handleSlimeConfigChange(
		key: keyof SlimeConfig,
		value: number | string,
	) {
		const newConfig = {
			...slimeConfig(),
			[key]: value,
		};

		setSlimeConfig(newConfig);

		if (gpuAvailable() && useWebGPU() && gpuSimulation) {
			gpuSimulation.setConfig(newConfig);

			if (key === "agentCount") {
				const count = calculateAgentCount(newConfig);

				gpuSimulation.reinitAgents(count);
				gpuSimulation.clear();
			}
		} else {
			if (key === "agentCount") {
				const current = currentBuffer();

				initAgents();
				clearGrid(current);
				clearGrid(getOtherBuffer(current));
			}
		}
	}

	function handleRandomize() {
		const currentColor = slimeConfig().color;
		const randomSensorAngle =
			Math.round(((Math.random() * 180 * Math.PI) / 180) * 100) / 100;
		const randomTurnAngle =
			Math.round(((Math.random() * 180 * Math.PI) / 180) * 100) / 100;
		const randomSensorDist = Math.floor(Math.random() * 64) + 1;
		const randomDecayRate =
			Math.round((Math.random() * (20 - 0.1) + 0.1) * 100) / 100;
		const randomDiffuseWeight = Math.round(Math.random() * 100) / 100;
		const randomDepositAmount = Math.floor(Math.random() * 255) + 1;
		const randomAgentSpeed =
			Math.round((Math.random() * (5 - 0.1) + 0.1) * 100) / 100;
		const randomAgentCount =
			Math.round((Math.random() * (20 - 0.5) + 0.5) * 100) / 100;

		const newConfig: SlimeConfig = {
			sensorAngle: randomSensorAngle,
			turnAngle: randomTurnAngle,
			sensorDist: randomSensorDist,
			decayRate: randomDecayRate,
			diffuseWeight: randomDiffuseWeight,
			depositAmount: randomDepositAmount,
			agentSpeed: randomAgentSpeed,
			agentCount: randomAgentCount,
			color: currentColor,
		};

		setSlimeConfig(newConfig);

		if (gpuAvailable() && useWebGPU() && gpuSimulation) {
			gpuSimulation.setConfig(newConfig);

			const count = calculateAgentCount(newConfig);

			gpuSimulation.reinitAgents(count);
			gpuSimulation.clear();
			gpuSimulation.render();
		} else {
			const current = currentBuffer();

			initAgents();
			clearGrid(current);
			clearGrid(getOtherBuffer(current));
			forceRerender();
		}
	}

	async function initGPU() {
		if (gpuInitialized || !canvasRef) {
			return;
		}

		gpuInitialized = true;

		const config = slimeConfig();
		const agentCount = Math.floor(
			GRID_ROWS * GRID_COLS * (config.agentCount / 100),
		);

		gpuSimulation = await createGPUSimulation(
			GRID_COLS,
			GRID_ROWS,
			agentCount,
			config,
		);

		if (gpuSimulation) {
			const canvasConfigured = gpuSimulation.configureCanvas(canvasRef);

			if (canvasConfigured) {
				setGpuAvailable(true);
				setGpuInitializing(false);

				console.log("WebGPU acceleration enabled");
			} else {
				gpuSimulation.destroy();
				gpuSimulation = null;

				setUseWebGPU(false);
				setGpuInitializing(false);

				console.log(
					"WebGPU canvas configuration failed, using CPU fallback (max 50k agents)",
				);
			}
		} else {
			setUseWebGPU(false);
			setGpuInitializing(false);

			console.log("WebGPU not available, using CPU fallback (max 50k agents)");
		}
	}

	function handleToggleSimulationMode() {
		const currentMode = useWebGPU();
		setUseWebGPU(!currentMode);
		setCanvasKey((key) => key + 1);

		if (!currentMode) {
			if (gpuSimulation) {
				gpuSimulation.destroy();
				gpuSimulation = null;
			}
			gpuInitialized = false;
			setGpuAvailable(false);
			setGpuInitializing(true);
		} else {
			setGpuInitializing(false);
		}
	}

	async function handleExportScreenshot(width: number, height: number) {
		if (isExporting()) {
			return;
		}

		setIsExporting(true);

		try {
			if (gpuAvailable() && useWebGPU() && gpuSimulation) {
				const pixelData = await gpuSimulation.exportScreenshot(width, height);
				downloadPixelDataAsPng(pixelData, width, height);
			} else if (canvasRef) {
				downloadCanvasAsPng(canvasRef, width, height);
			}
		} catch (error) {
			console.error("Failed to export screenshot:", error);
		} finally {
			setIsExporting(false);
		}
	}

	function downloadPixelDataAsPng(
		pixelData: Uint8Array,
		width: number,
		height: number,
	) {
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;

		const context = canvas.getContext("2d");
		if (!context) {
			console.error("Failed to get 2D context for export canvas");
			return;
		}

		const imageData = context.createImageData(width, height);
		imageData.data.set(pixelData);
		context.putImageData(imageData, 0, 0);

		canvas.toBlob((blob) => {
			if (!blob) {
				console.error("Failed to create blob from canvas");
				return;
			}

			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `slime-mold-${width}x${height}-${Date.now()}.png`;
			link.click();

			URL.revokeObjectURL(url);
		}, "image/png");
	}

	function downloadCanvasAsPng(
		sourceCanvas: HTMLCanvasElement,
		targetWidth: number,
		targetHeight: number,
	) {
		const exportCanvas = document.createElement("canvas");
		exportCanvas.width = targetWidth;
		exportCanvas.height = targetHeight;

		const context = exportCanvas.getContext("2d");
		if (!context) {
			console.error("Failed to get 2D context for export canvas");
			return;
		}

		context.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

		exportCanvas.toBlob((blob) => {
			if (!blob) {
				console.error("Failed to create blob from canvas");
				return;
			}

			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `slime-mold-${targetWidth}x${targetHeight}-${Date.now()}.png`;
			link.click();

			URL.revokeObjectURL(url);
		}, "image/png");
	}

	function setCanvasRef(canvas: HTMLCanvasElement) {
		canvasRef = canvas;
		if (useWebGPU()) {
			initGPU();
		} else {
			setGpuInitializing(false);
		}
	}

	function handleToggleRecording() {
		if (isRecording()) {
			if (mediaRecorder && mediaRecorder.state !== "inactive") {
				mediaRecorder.stop();
			}
		} else {
			if (!canvasRef) return;

			try {
				const stream = canvasRef.captureStream(60);

				const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
					? "video/webm; codecs=vp9"
					: "video/webm";

				mediaRecorder = new MediaRecorder(stream, {
					mimeType,
					videoBitsPerSecond: 8_000_000, // 8 Mbps
				});

				recordedChunks = [];

				mediaRecorder.ondataavailable = (event) => {
					if (event.data.size > 0) {
						recordedChunks.push(event.data);
					}
				};

				mediaRecorder.onstop = () => {
					const blob = new Blob(recordedChunks, { type: mimeType });
					const url = URL.createObjectURL(blob);
					const link = document.createElement("a");
					link.href = url;
					link.download = `slime-simulation-${Date.now()}.webm`;
					link.click();
					URL.revokeObjectURL(url);
					setIsRecording(false);
				};

				mediaRecorder.start();
				setIsRecording(true);
			} catch (err) {
				console.error("Error starting recording:", err);
				setIsRecording(false);
			}
		}
	}

	createEffect(() => {
		const currentSpeed = speed();
		const currentSlimeConfig = slimeConfig();
		const currentUseWebGPU = useWebGPU();

		if (isInitialLoad) {
			return;
		}

		saveSimulationSettings({
			speed: currentSpeed,
			slimeConfig: currentSlimeConfig,
			useWebGPU: currentUseWebGPU,
		});
	});

	onMount(() => {
		isInitialLoad = false;

		engine = createEngine(tick);
		engine.setSpeed(speedToInterval(speed()));
		initAgents();

		const metricsInterval = setInterval(() => {
			if (engine) {
				setFps(engine.getFps());
			}
			setAverageFrameTime(lastFrameTime);
		}, 500);

		onCleanup(() => {
			engine?.stop();
			gpuSimulation?.destroy();
			clearInterval(metricsInterval);
		});
	});

	return {
		grid: currentBuffer,
		running,
		speed,
		slimeConfig,
		gpuAvailable,
		useWebGPU,
		gpuInitializing,
		canvasKey,
		fps,
		averageFrameTime,
		agentCount,
		isExporting,
		handlePlayPause,
		handleStep,
		handleClear,
		handleSpeedChange,
		handleSlimeConfigChange,
		handleRandomize,
		handleToggleSimulationMode,
		handleExportScreenshot,
		handleToggleRecording,
		setCanvasRef,
		isRecording,
	};
}
