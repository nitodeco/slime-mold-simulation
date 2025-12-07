import type { SlimeConfig, SpawnPattern } from "../slime";
import { getColorPresetFloats } from "../slime";
import {
	type AgentBuffers,
	type ConfigUniform,
	clearGridBuffers,
	createAgentBuffers,
	createConfigUniform,
	createGridBuffers,
	createRenderUniform,
	type GridBuffers,
	updateConfigUniform,
	updateRenderUniform,
} from "./buffers";
import { initWebGPU, type WebGPUContext } from "./context";
import {
	type ComputePipelines,
	createComputePipelines,
	createRenderPipeline,
	type RenderPipeline,
} from "./pipelines";

export interface GPUSimulation {
	tickAndRender(): void;
	render(): void;
	setConfig(config: SlimeConfig): void;
	clear(): void;
	reinitAgents(count: number, spawnPattern?: SpawnPattern): void;
	destroy(): void;
	configureCanvas(canvas: HTMLCanvasElement): boolean;
	exportScreenshot(width: number, height: number): Promise<Uint8Array>;
}

interface CachedBindGroups {
	diffuseAToB: GPUBindGroup;
	diffuseBToA: GPUBindGroup;
	agentMoveDepositAToB: GPUBindGroup;
	agentMoveDepositBToA: GPUBindGroup;
	renderA: GPUBindGroup;
	renderB: GPUBindGroup;
}

interface GPUSimulationState {
	context: WebGPUContext;
	gridBuffers: GridBuffers;
	agentBuffers: AgentBuffers;
	configUniform: ConfigUniform;
	renderUniform: ConfigUniform;
	computePipelines: ComputePipelines;
	renderPipeline: RenderPipeline;
	exportPipeline: RenderPipeline;
	cachedBindGroups: CachedBindGroups;
	canvasContext: GPUCanvasContext | null;
	width: number;
	height: number;
	frameIndex: number;
	currentSourceIsA: boolean;
	currentConfig: SlimeConfig;
	configDirty: boolean;
	cachedSpeciesColors: Array<{
		low: [number, number, number];
		mid: [number, number, number];
		high: [number, number, number];
	}>;
	gridTextureBytesPerRow: number;
}

const frameSeedArray = new Float32Array(1);
const emptyColor: [number, number, number] = [-1, -1, -1];

function colorsMatch(
	first: [number, number, number],
	second: [number, number, number],
): boolean {
	return (
		first[0] === second[0] && first[1] === second[1] && first[2] === second[2]
	);
}

function updateRenderColors(
	state: GPUSimulationState,
	device: GPUDevice,
	renderUniform: ConfigUniform,
): void {
	const currentColors = state.currentConfig.species.map((s) =>
		getColorPresetFloats(s.colorPreset),
	);

	let needsUpdate = false;
	for (let i = 0; i < currentColors.length; i++) {
		if (
			!colorsMatch(currentColors[i].low, state.cachedSpeciesColors[i].low) ||
			!colorsMatch(currentColors[i].mid, state.cachedSpeciesColors[i].mid) ||
			!colorsMatch(currentColors[i].high, state.cachedSpeciesColors[i].high)
		) {
			needsUpdate = true;
			break;
		}
	}

	if (!needsUpdate) {
		return;
	}

	updateRenderUniform(
		device,
		renderUniform,
		state.width,
		state.height,
		currentColors,
	);

	state.cachedSpeciesColors = currentColors;
}

function createCachedBindGroups(
	device: GPUDevice,
	gridBuffers: GridBuffers,
	agentBuffers: AgentBuffers,
	configUniform: ConfigUniform,
	renderUniform: ConfigUniform,
	computePipelines: ComputePipelines,
	renderPipeline: RenderPipeline,
): CachedBindGroups {
	const diffuseAToB = device.createBindGroup({
		layout: computePipelines.diffuseDecay.getBindGroupLayout(0),
		entries: [
			{ binding: 0, resource: { buffer: gridBuffers.bufferA } },
			{ binding: 1, resource: { buffer: gridBuffers.bufferB } },
			{ binding: 2, resource: { buffer: configUniform.buffer } },
		],
	});

	const diffuseBToA = device.createBindGroup({
		layout: computePipelines.diffuseDecay.getBindGroupLayout(0),
		entries: [
			{ binding: 0, resource: { buffer: gridBuffers.bufferB } },
			{ binding: 1, resource: { buffer: gridBuffers.bufferA } },
			{ binding: 2, resource: { buffer: configUniform.buffer } },
		],
	});

	const agentMoveDepositAToB = device.createBindGroup({
		layout: computePipelines.agentMoveDeposit.getBindGroupLayout(0),
		entries: [
			{ binding: 0, resource: { buffer: gridBuffers.bufferA } },
			{ binding: 1, resource: { buffer: agentBuffers.positionsX } },
			{ binding: 2, resource: { buffer: agentBuffers.positionsY } },
			{ binding: 3, resource: { buffer: agentBuffers.angles } },
			{ binding: 4, resource: { buffer: agentBuffers.species } },
			{ binding: 5, resource: { buffer: gridBuffers.bufferB } },
			{ binding: 6, resource: { buffer: configUniform.buffer } },
		],
	});

	const agentMoveDepositBToA = device.createBindGroup({
		layout: computePipelines.agentMoveDeposit.getBindGroupLayout(0),
		entries: [
			{ binding: 0, resource: { buffer: gridBuffers.bufferB } },
			{ binding: 1, resource: { buffer: agentBuffers.positionsX } },
			{ binding: 2, resource: { buffer: agentBuffers.positionsY } },
			{ binding: 3, resource: { buffer: agentBuffers.angles } },
			{ binding: 4, resource: { buffer: agentBuffers.species } },
			{ binding: 5, resource: { buffer: gridBuffers.bufferA } },
			{ binding: 6, resource: { buffer: configUniform.buffer } },
		],
	});

	const renderA = device.createBindGroup({
		layout: renderPipeline.pipeline.getBindGroupLayout(0),
		entries: [
			{ binding: 0, resource: gridBuffers.textureViewA },
			{ binding: 1, resource: { buffer: renderUniform.buffer } },
		],
	});

	const renderB = device.createBindGroup({
		layout: renderPipeline.pipeline.getBindGroupLayout(0),
		entries: [
			{ binding: 0, resource: gridBuffers.textureViewB },
			{ binding: 1, resource: { buffer: renderUniform.buffer } },
		],
	});

	return {
		diffuseAToB,
		diffuseBToA,
		agentMoveDepositAToB,
		agentMoveDepositBToA,
		renderA,
		renderB,
	};
}

function copyGridBufferToTexture(
	state: GPUSimulationState,
	commandEncoder: GPUCommandEncoder,
	useBufferA: boolean,
): void {
	const sourceBuffer = useBufferA
		? state.gridBuffers.bufferA
		: state.gridBuffers.bufferB;
	const destinationTexture = useBufferA
		? state.gridBuffers.textureA
		: state.gridBuffers.textureB;

	commandEncoder.copyBufferToTexture(
		{
			buffer: sourceBuffer,
			bytesPerRow: state.width * 16,
		},
		{ texture: destinationTexture },
		{ width: state.width, height: state.height },
	);
}

export async function createGPUSimulation(
	width: number,
	height: number,
	initialAgentCount: number,
	initialConfig: SlimeConfig,
): Promise<GPUSimulation | null> {
	const gpuContext = await initWebGPU();

	if (!gpuContext) {
		return null;
	}

	const { device } = gpuContext;

	const gridBuffers = createGridBuffers(device, width, height);
	const agentBuffers = createAgentBuffers(
		device,
		initialAgentCount,
		width,
		height,
		initialConfig,
	);
	const configUniform = createConfigUniform(device);
	const renderUniform = createRenderUniform(device);
	const computePipelines = createComputePipelines(device);
	const renderPipeline = createRenderPipeline(device);
	const exportPipeline = createRenderPipeline(device, "rgba8unorm");

	const cachedBindGroups = createCachedBindGroups(
		device,
		gridBuffers,
		agentBuffers,
		configUniform,
		renderUniform,
		computePipelines,
		renderPipeline,
	);

	const state: GPUSimulationState = {
		context: gpuContext,
		gridBuffers,
		agentBuffers,
		configUniform,
		renderUniform,
		computePipelines,
		renderPipeline,
		exportPipeline,
		cachedBindGroups,
		canvasContext: null,
		width,
		height,
		frameIndex: 0,
		currentSourceIsA: true,
		currentConfig: initialConfig,
		configDirty: true,
		cachedSpeciesColors: [
			{ low: emptyColor, mid: emptyColor, high: emptyColor },
			{ low: emptyColor, mid: emptyColor, high: emptyColor },
			{ low: emptyColor, mid: emptyColor, high: emptyColor },
		],
		gridTextureBytesPerRow: width * 16, // RGBA32Uint = 16 bytes per pixel
	};

	return {
		tickAndRender: () => tickAndRender(state),
		render: () => render(state),
		setConfig: (config: SlimeConfig) => setConfig(state, config),
		clear: () => clear(state),
		reinitAgents: (count: number, spawnPattern?: SpawnPattern) =>
			reinitAgents(state, count, spawnPattern),
		destroy: () => destroy(state),
		configureCanvas: (canvas: HTMLCanvasElement) =>
			configureCanvas(state, canvas),
		exportScreenshot: (width: number, height: number) =>
			exportScreenshot(state, width, height),
	};
}

function tickAndRender(state: GPUSimulationState): void {
	const { device } = state.context;

	if (state.configDirty) {
		updateConfigUniform(
			device,
			state.configUniform,
			state.currentConfig,
			state.width,
			state.height,
			state.frameIndex,
			state.agentBuffers.count,
		);
		state.configDirty = false;
	} else {
		state.configUniform.data[7] = state.frameIndex;
		frameSeedArray[0] = state.frameIndex;
		device.queue.writeBuffer(state.configUniform.buffer, 28, frameSeedArray);
	}

	updateRenderColors(state, device, state.renderUniform);

	const commandEncoder = device.createCommandEncoder();

	const diffuseBindGroup = state.currentSourceIsA
		? state.cachedBindGroups.diffuseAToB
		: state.cachedBindGroups.diffuseBToA;

	const diffusePass = commandEncoder.beginComputePass();
	diffusePass.setPipeline(state.computePipelines.diffuseDecay);
	diffusePass.setBindGroup(0, diffuseBindGroup);
	diffusePass.dispatchWorkgroups(
		Math.ceil(state.width / 16),
		Math.ceil(state.height / 16),
	);
	diffusePass.end();

	const agentMoveDepositBindGroup = state.currentSourceIsA
		? state.cachedBindGroups.agentMoveDepositAToB
		: state.cachedBindGroups.agentMoveDepositBToA;

	const agentMoveDepositPass = commandEncoder.beginComputePass();
	agentMoveDepositPass.setPipeline(state.computePipelines.agentMoveDeposit);
	agentMoveDepositPass.setBindGroup(0, agentMoveDepositBindGroup);
	agentMoveDepositPass.dispatchWorkgroups(
		Math.ceil(state.agentBuffers.count / 256),
	);
	agentMoveDepositPass.end();

	if (state.canvasContext) {
		copyGridBufferToTexture(state, commandEncoder, !state.currentSourceIsA);

		const renderBindGroup = state.currentSourceIsA
			? state.cachedBindGroups.renderB
			: state.cachedBindGroups.renderA;

		const textureView = state.canvasContext.getCurrentTexture().createView();

		const renderPass = commandEncoder.beginRenderPass({
			colorAttachments: [
				{
					view: textureView,
					clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
					loadOp: "clear",
					storeOp: "store",
				},
			],
		});

		renderPass.setPipeline(state.renderPipeline.pipeline);
		renderPass.setBindGroup(0, renderBindGroup);
		renderPass.draw(3);
		renderPass.end();
	}

	device.queue.submit([commandEncoder.finish()]);

	state.currentSourceIsA = !state.currentSourceIsA;
	state.frameIndex++;
}

function render(state: GPUSimulationState): void {
	const { device } = state.context;

	updateRenderColors(state, device, state.renderUniform);

	const commandEncoder = device.createCommandEncoder();

	if (state.canvasContext) {
		copyGridBufferToTexture(state, commandEncoder, state.currentSourceIsA);

		const renderBindGroup = state.currentSourceIsA
			? state.cachedBindGroups.renderA
			: state.cachedBindGroups.renderB;

		const textureView = state.canvasContext.getCurrentTexture().createView();

		const renderPass = commandEncoder.beginRenderPass({
			colorAttachments: [
				{
					view: textureView,
					clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
					loadOp: "clear",
					storeOp: "store",
				},
			],
		});

		renderPass.setPipeline(state.renderPipeline.pipeline);
		renderPass.setBindGroup(0, renderBindGroup);
		renderPass.draw(3);
		renderPass.end();
	}

	device.queue.submit([commandEncoder.finish()]);
}

function setConfig(state: GPUSimulationState, config: SlimeConfig): void {
	state.currentConfig = config;
	state.configDirty = true;
}

function clear(state: GPUSimulationState): void {
	const { device } = state.context;
	clearGridBuffers(device, state.gridBuffers);
	state.currentSourceIsA = true;
}

function reinitAgents(
	state: GPUSimulationState,
	count: number,
	spawnPattern?: SpawnPattern,
): void {
	const { device } = state.context;

	state.agentBuffers.positionsX.destroy();
	state.agentBuffers.positionsY.destroy();
	state.agentBuffers.angles.destroy();
	state.agentBuffers.species.destroy();

	// Reinit with current config to preserve species distribution
	state.agentBuffers = createAgentBuffers(
		device,
		count,
		state.width,
		state.height,
		state.currentConfig,
		spawnPattern,
	);

	state.cachedBindGroups = createCachedBindGroups(
		device,
		state.gridBuffers,
		state.agentBuffers,
		state.configUniform,
		state.renderUniform,
		state.computePipelines,
		state.renderPipeline,
	);

	state.configDirty = true;
}

function destroy(state: GPUSimulationState): void {
	state.gridBuffers.bufferA.destroy();
	state.gridBuffers.bufferB.destroy();
	state.gridBuffers.textureA.destroy();
	state.gridBuffers.textureB.destroy();
	state.agentBuffers.positionsX.destroy();
	state.agentBuffers.positionsY.destroy();
	state.agentBuffers.angles.destroy();
	state.configUniform.buffer.destroy();
	state.renderUniform.buffer.destroy();
}

function configureCanvas(
	state: GPUSimulationState,
	canvas: HTMLCanvasElement,
): boolean {
	const { device } = state.context;

	const canvasContext = canvas.getContext("webgpu");
	if (!canvasContext) {
		console.warn(
			"Failed to get WebGPU canvas context, falling back to CPU rendering",
		);
		return false;
	}

	canvasContext.configure({
		device,
		format: state.renderPipeline.format,
		alphaMode: "premultiplied",
	});

	state.canvasContext = canvasContext;
	return true;
}

async function exportScreenshot(
	state: GPUSimulationState,
	targetWidth: number,
	targetHeight: number,
): Promise<Uint8Array> {
	const { device } = state.context;

	const currentColors = state.currentConfig.species.map((s) =>
		getColorPresetFloats(s.colorPreset),
	);

	/*
	 * Specific render pipeline for export,
	 * ensures we get RGBA bytes regardless of the systems preferred canvas format
	 */
	const exportPipeline = state.exportPipeline;

	const exportRenderUniform = createRenderUniform(device);
	updateRenderUniform(
		device,
		exportRenderUniform,
		state.width,
		state.height,
		currentColors,
	);

	const offscreenTexture = device.createTexture({
		size: { width: targetWidth, height: targetHeight },
		format: exportPipeline.format,
		usage:
			GPUTextureUsage.RENDER_ATTACHMENT |
			GPUTextureUsage.COPY_SRC |
			GPUTextureUsage.TEXTURE_BINDING,
		label: "Export Offscreen Texture",
	});

	const bytesPerRow = Math.ceil((targetWidth * 4) / 256) * 256;
	const bufferSize = bytesPerRow * targetHeight;

	const stagingBuffer = device.createBuffer({
		size: bufferSize,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
		label: "Export Staging Buffer",
	});

	const currentTextureView = state.currentSourceIsA
		? state.gridBuffers.textureViewA
		: state.gridBuffers.textureViewB;

	const commandEncoder = device.createCommandEncoder();

	copyGridBufferToTexture(state, commandEncoder, state.currentSourceIsA);

	const exportBindGroup = device.createBindGroup({
		layout: exportPipeline.pipeline.getBindGroupLayout(0),
		entries: [
			{ binding: 0, resource: currentTextureView },
			{ binding: 1, resource: { buffer: exportRenderUniform.buffer } },
		],
	});

	const textureView = offscreenTexture.createView();

	const renderPass = commandEncoder.beginRenderPass({
		colorAttachments: [
			{
				view: textureView,
				clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
				loadOp: "clear",
				storeOp: "store",
			},
		],
	});

	renderPass.setPipeline(exportPipeline.pipeline);
	renderPass.setBindGroup(0, exportBindGroup);
	renderPass.draw(3);
	renderPass.end();

	commandEncoder.copyTextureToBuffer(
		{ texture: offscreenTexture },
		{ buffer: stagingBuffer, bytesPerRow },
		{ width: targetWidth, height: targetHeight },
	);

	device.queue.submit([commandEncoder.finish()]);

	await stagingBuffer.mapAsync(GPUMapMode.READ);
	const mappedRange = stagingBuffer.getMappedRange();
	const rawData = new Uint8Array(mappedRange);

	const pixelData = new Uint8Array(targetWidth * targetHeight * 4);
	for (let row = 0; row < targetHeight; row++) {
		const srcOffset = row * bytesPerRow;
		const dstOffset = row * targetWidth * 4;
		pixelData.set(
			rawData.subarray(srcOffset, srcOffset + targetWidth * 4),
			dstOffset,
		);
	}

	stagingBuffer.unmap();
	stagingBuffer.destroy();
	offscreenTexture.destroy();
	exportRenderUniform.buffer.destroy();

	return pixelData;
}
