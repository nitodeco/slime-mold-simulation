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
	COLOR_PRESET_NAMES,
	createAgentPool,
	DEFAULT_SLIME_CONFIG,
	type SlimeConfig,
	type SpeciesConfig,
	stepSlime,
} from "../core/slime";
import {
	createGPUSimulation,
	type GPUSimulation,
} from "../core/webgpu/gpuSimulation";
import {
	clampedGaussianRandom,
	generateRandomPopulationRatios,
} from "../utils/math";
import {
	DEFAULT_LOCKED_SETTINGS,
	decodeSimulationSettings,
	encodeSimulationSettings,
	type LockedSettings,
	loadLockedSettings,
	loadSimulationSettings,
	type SimulationSettings,
	type SpeciesLockedSettings,
	saveLockedSettings,
	saveSimulationSettings,
} from "../utils/storage";

export function useSimulation() {
	const bufferA = createGrid(GRID_ROWS, GRID_COLS);
	const bufferB = createGrid(GRID_ROWS, GRID_COLS);

	function loadSettingsFromQuery(): SimulationSettings | null {
		if (typeof window === "undefined") {
			return null;
		}

		const searchParams = new URLSearchParams(window.location.search);
		const encodedSettings = searchParams.get("config");

		if (!encodedSettings) {
			return null;
		}

		return decodeSimulationSettings(encodedSettings);
	}

	const [currentBuffer, setCurrentBuffer] = createSignal<Grid>(bufferA);
	const [running, setRunning] = createSignal(false);

	const querySettings = loadSettingsFromQuery();
	const storedSettings = loadSimulationSettings();
	const initialSettings = querySettings ?? storedSettings;

	const [speed, setSpeed] = createSignal(initialSettings?.speed ?? 80);
	const [slimeConfig, setSlimeConfig] = createSignal<SlimeConfig>(
		initialSettings?.slimeConfig
			? {
					...DEFAULT_SLIME_CONFIG,
					...initialSettings.slimeConfig,
				}
			: DEFAULT_SLIME_CONFIG,
	);
	const [gpuAvailable, setGpuAvailable] = createSignal(false);
	const [webGPUSupported, setWebGPUSupported] = createSignal<boolean | null>(
		null,
	);
	const [useWebGPU, setUseWebGPU] = createSignal(
		initialSettings?.useWebGPU ?? true,
	);
	const [lockedSettings, setLockedSettings] = createSignal<LockedSettings>(
		loadLockedSettings() ?? DEFAULT_LOCKED_SETTINGS,
	);
	const [gpuInitializing, setGpuInitializing] = createSignal(true);
	const [canvasKey, setCanvasKey] = createSignal(0);
	const [fps, setFps] = createSignal(0);
	const [averageFrameTime, setAverageFrameTime] = createSignal(0);
	const [isExporting, setIsExporting] = createSignal(false);
	const [isRecording, setIsRecording] = createSignal(false);
	const [stepCount, setStepCount] = createSignal(0);

	let isInitialLoad = true;
	let internalStepCount = 0;

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
		agentsRef.current = createAgentPool(count, GRID_COLS, GRID_ROWS, config);
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

		internalStepCount++;
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

	function handleClear() {
		internalStepCount = 0;
		setStepCount(0);
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
		value: number | string | object,
		speciesIndex?: number,
		speciesKey?: keyof SpeciesConfig,
		interactionRow?: number,
		interactionCol?: number,
	) {
		const current = slimeConfig();
		let newConfig = { ...current };

		if (speciesIndex !== undefined && speciesKey) {
			const species = [...current.species];
			species[speciesIndex] = {
				...species[speciesIndex],
				[speciesKey]: value as number | string,
			};
			newConfig.species = species as [
				SpeciesConfig,
				SpeciesConfig,
				SpeciesConfig,
			];
		} else if (interactionRow !== undefined && interactionCol !== undefined) {
			const interactions = current.interactions.map((row) => [...row]);
			interactions[interactionRow][interactionCol] = value as number;
			newConfig.interactions = interactions;
		} else {
			newConfig = {
				...current,
				[key]: value,
			};
		}

		setSlimeConfig(newConfig);

		const requiresReinit =
			key === "agentCount" ||
			key === "enabledSpawnPatterns" ||
			(speciesIndex !== undefined && speciesKey === "agentCount");

		if (gpuAvailable() && useWebGPU() && gpuSimulation) {
			gpuSimulation.setConfig(newConfig);

			if (requiresReinit) {
				const count = calculateAgentCount(newConfig);

				gpuSimulation.reinitAgents(count);
				gpuSimulation.clear();
			}
		} else {
			if (requiresReinit) {
				const current = currentBuffer();

				initAgents();
				clearGrid(current);
				clearGrid(getOtherBuffer(current));
			}
		}
	}

	function handleToggleLock(key: keyof Omit<LockedSettings, "species">) {
		const current = lockedSettings();
		const newSettings = {
			...current,
			[key]: !current[key],
		};
		setLockedSettings(newSettings);
		saveLockedSettings(newSettings);
	}

	function handleToggleSpeciesLock(
		speciesIndex: number,
		key: keyof SpeciesLockedSettings,
	) {
		const current = lockedSettings();
		const newSpecies = [...current.species] as [
			SpeciesLockedSettings,
			SpeciesLockedSettings,
			SpeciesLockedSettings,
		];
		newSpecies[speciesIndex] = {
			...newSpecies[speciesIndex],
			[key]: !newSpecies[speciesIndex][key],
		};
		const newSettings = {
			...current,
			species: newSpecies,
		};
		setLockedSettings(newSettings);
		saveLockedSettings(newSettings);
	}

	function handleRandomize() {
		const currentConfig = slimeConfig();
		const locks = lockedSettings();

		const populationRatios = generateRandomPopulationRatios(3, 10);

		const randomSpecies = currentConfig.species.map((species, index) => {
			const speciesLocks = locks.species[index];
			return {
				...species,
				sensorAngle: speciesLocks.sensorAngle
					? species.sensorAngle
					: Math.round(
							clampedGaussianRandom(
								(10 * Math.PI) / 180,
								(90 * Math.PI) / 180,
								(45 * Math.PI) / 180,
								(20 * Math.PI) / 180,
							) * 100,
						) / 100,
				turnAngle: speciesLocks.turnAngle
					? species.turnAngle
					: Math.round(
							clampedGaussianRandom(
								(10 * Math.PI) / 180,
								(90 * Math.PI) / 180,
								(45 * Math.PI) / 180,
								(20 * Math.PI) / 180,
							) * 100,
						) / 100,
				sensorDist: speciesLocks.sensorDist
					? species.sensorDist
					: Math.round(clampedGaussianRandom(5, 35, 15, 8)),
				depositAmount: speciesLocks.depositAmount
					? species.depositAmount
					: Math.round(clampedGaussianRandom(20, 150, 60, 30)),
				agentSpeed: speciesLocks.agentSpeed
					? species.agentSpeed
					: Math.round(clampedGaussianRandom(0.5, 3, 1.5, 0.5) * 100) / 100,
				colorPreset: speciesLocks.colorPreset
					? species.colorPreset
					: COLOR_PRESET_NAMES[
							Math.floor(Math.random() * COLOR_PRESET_NAMES.length)
						],
				agentCount: speciesLocks.agentCount
					? species.agentCount
					: populationRatios[index],
			};
		}) as [SpeciesConfig, SpeciesConfig, SpeciesConfig];

		const randomInteractions = locks.interactions
			? currentConfig.interactions
			: Array(3)
					.fill(0)
					.map((_, rowIndex) =>
						Array(3)
							.fill(0)
							.map((_, colIndex) => {
								if (rowIndex === colIndex) {
									return (
										Math.round(clampedGaussianRandom(0.5, 1, 0.8, 0.2) * 10) /
										10
									);
								}
								return (
									Math.round(clampedGaussianRandom(-0.5, 0.5, 0, 0.3) * 10) / 10
								);
							}),
					);

		const enabledPatterns = currentConfig.enabledSpawnPatterns;

		const randomSpawnPattern =
			enabledPatterns[Math.floor(Math.random() * enabledPatterns.length)];

		const newConfig: SlimeConfig = {
			...currentConfig,
			decayRate: locks.decayRate
				? currentConfig.decayRate
				: Math.round(clampedGaussianRandom(0.5, 8, 2.5, 2) * 100) / 100,
			diffuseWeight: locks.diffuseWeight
				? currentConfig.diffuseWeight
				: Math.round(clampedGaussianRandom(0.05, 0.5, 0.15, 0.1) * 100) / 100,
			agentCount: locks.agentCount
				? currentConfig.agentCount
				: Math.round(clampedGaussianRandom(5, 20, 10, 4) * 100) / 100,
			enabledSpawnPatterns: currentConfig.enabledSpawnPatterns,
			species: randomSpecies,
			interactions: randomInteractions,
		};

		setSlimeConfig(newConfig);
		internalStepCount = 0;
		setStepCount(0);

		if (gpuAvailable() && useWebGPU() && gpuSimulation) {
			gpuSimulation.setConfig(newConfig);

			const count = calculateAgentCount(newConfig);

			gpuSimulation.reinitAgents(count, randomSpawnPattern);
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
				setWebGPUSupported(true);
				setGpuInitializing(false);

				console.log("WebGPU acceleration enabled");
			} else {
				gpuSimulation.destroy();
				gpuSimulation = null;

				setUseWebGPU(false);
				setWebGPUSupported(false);
				setGpuInitializing(false);

				console.log(
					"WebGPU canvas configuration failed, using CPU fallback (max 50k agents)",
				);
			}
		} else {
			setUseWebGPU(false);
			setWebGPUSupported(false);
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
				const actualFps = Math.min(60, fps() || 60);
				const stream = canvasRef.captureStream(actualFps);

				const codecOptions = [
					{ mimeType: "video/webm; codecs=vp9", bitrate: 8_000_000 },
					{ mimeType: "video/webm; codecs=vp8", bitrate: 5_000_000 },
					{ mimeType: "video/webm", bitrate: 3_000_000 },
				];

				let selectedCodec = codecOptions[codecOptions.length - 1];
				for (const codec of codecOptions) {
					if (MediaRecorder.isTypeSupported(codec.mimeType)) {
						selectedCodec = codec;
						break;
					}
				}

				mediaRecorder = new MediaRecorder(stream, {
					mimeType: selectedCodec.mimeType,
					videoBitsPerSecond: selectedCodec.bitrate,
					audioBitsPerSecond: 0,
				});

				recordedChunks = [];

				mediaRecorder.ondataavailable = (event) => {
					if (event.data.size > 0) {
						recordedChunks.push(event.data);
					}
				};

				mediaRecorder.onstop = () => {
					const blob = new Blob(recordedChunks, {
						type: selectedCodec.mimeType,
					});
					const url = URL.createObjectURL(blob);
					const link = document.createElement("a");
					link.href = url;
					link.download = `slime-simulation-${Date.now()}.webm`;
					link.click();
					URL.revokeObjectURL(url);
					setIsRecording(false);
				};

				mediaRecorder.start(1000);
				setIsRecording(true);
			} catch (err) {
				console.error("Error starting recording:", err);
				setIsRecording(false);
			}
		}
	}

	function getShareUrl(): string {
		if (typeof window === "undefined") {
			return "";
		}

		const currentSettings: SimulationSettings = {
			speed: speed(),
			slimeConfig: slimeConfig(),
			useWebGPU: useWebGPU(),
		};

		const encodedSettings = encodeSimulationSettings(currentSettings);
		const shareUrl = new URL(window.location.href);
		shareUrl.searchParams.set("config", encodedSettings);

		return shareUrl.toString();
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
			setStepCount(internalStepCount);
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
		webGPUSupported,
		useWebGPU,
		gpuInitializing,
		canvasKey,
		fps,
		averageFrameTime,
		agentCount,
		stepCount,
		isExporting,
		lockedSettings,
		handlePlayPause,
		handleClear,
		handleSpeedChange,
		handleSlimeConfigChange,
		handleRandomize,
		handleToggleSimulationMode,
		handleExportScreenshot,
		handleToggleRecording,
		handleToggleLock,
		handleToggleSpeciesLock,
		setCanvasRef,
		isRecording,
		getShareUrl,
	};
}
