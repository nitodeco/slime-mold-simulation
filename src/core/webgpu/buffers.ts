import type { SlimeConfig } from "../slime";
import { generateAgentPositions } from "../spawnPatterns";

export interface GridBuffers {
	bufferA: GPUBuffer;
	bufferB: GPUBuffer;
	width: number;
	height: number;
	textureA: GPUTexture;
	textureB: GPUTexture;
	textureViewA: GPUTextureView;
	textureViewB: GPUTextureView;
}

export interface AgentBuffers {
	positionsX: GPUBuffer;
	positionsY: GPUBuffer;
	angles: GPUBuffer;
	species: GPUBuffer;
	count: number;
}

export interface ConfigUniform {
	buffer: GPUBuffer;
	data: Float32Array;
}

export function createGridBuffers(
	device: GPUDevice,
	width: number,
	height: number,
): GridBuffers {
	const size = width * height * 16; // RGBA32Uint

	const bufferA = device.createBuffer({
		size,
		usage:
			GPUBufferUsage.STORAGE |
			GPUBufferUsage.COPY_DST |
			GPUBufferUsage.COPY_SRC,
		label: "Grid Buffer A",
	});

	const bufferB = device.createBuffer({
		size,
		usage:
			GPUBufferUsage.STORAGE |
			GPUBufferUsage.COPY_DST |
			GPUBufferUsage.COPY_SRC,
		label: "Grid Buffer B",
	});

	const textureDescriptor: GPUTextureDescriptor = {
		size: { width, height },
		format: "rgba32uint",
		usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
		label: "Grid Texture",
	};

	const textureA = device.createTexture(textureDescriptor);
	const textureB = device.createTexture(textureDescriptor);

	const textureViewA = textureA.createView();
	const textureViewB = textureB.createView();

	return {
		bufferA,
		bufferB,
		width,
		height,
		textureA,
		textureB,
		textureViewA,
		textureViewB,
	};
}

export function clearGridBuffers(
	device: GPUDevice,
	gridBuffers: GridBuffers,
): void {
	const zeroData = new Uint32Array(gridBuffers.width * gridBuffers.height * 4);
	device.queue.writeBuffer(gridBuffers.bufferA, 0, zeroData);
	device.queue.writeBuffer(gridBuffers.bufferB, 0, zeroData);
}

export function createAgentBuffers(
	device: GPUDevice,
	count: number,
	width: number,
	height: number,
	config: SlimeConfig,
): AgentBuffers {
	const size = count * 4;

	const positionsX = device.createBuffer({
		size,
		usage:
			GPUBufferUsage.STORAGE |
			GPUBufferUsage.COPY_DST |
			GPUBufferUsage.COPY_SRC,
		label: "Agent Positions X",
	});

	const positionsY = device.createBuffer({
		size,
		usage:
			GPUBufferUsage.STORAGE |
			GPUBufferUsage.COPY_DST |
			GPUBufferUsage.COPY_SRC,
		label: "Agent Positions Y",
	});

	const anglesBuffer = device.createBuffer({
		size,
		usage:
			GPUBufferUsage.STORAGE |
			GPUBufferUsage.COPY_DST |
			GPUBufferUsage.COPY_SRC,
		label: "Agent Angles",
	});

	const speciesBuffer = device.createBuffer({
		size,
		usage:
			GPUBufferUsage.STORAGE |
			GPUBufferUsage.COPY_DST |
			GPUBufferUsage.COPY_SRC,
		label: "Agent Species",
	});

	const { xPositions, yPositions, angles } = generateAgentPositions(
		config.spawnPattern,
		count,
		width,
		height,
	);

	const species = new Uint32Array(count);
	const species1Count = Math.floor(
		(count * config.species[0].agentCount) / 100,
	);
	const species2Count = Math.floor(
		(count * config.species[1].agentCount) / 100,
	);

	for (let i = 0; i < count; i++) {
		if (i < species1Count) {
			species[i] = 0;
		} else if (i < species1Count + species2Count) {
			species[i] = 1;
		} else {
			species[i] = 2;
		}
	}

	device.queue.writeBuffer(positionsX, 0, xPositions);
	device.queue.writeBuffer(positionsY, 0, yPositions);
	device.queue.writeBuffer(anglesBuffer, 0, angles);
	device.queue.writeBuffer(speciesBuffer, 0, species);

	return {
		positionsX,
		positionsY,
		angles: anglesBuffer,
		species: speciesBuffer,
		count,
	};
}

export function createConfigUniform(device: GPUDevice): ConfigUniform {
	// Base config (44 bytes -> 12 floats/uints aligned to 48 bytes)
	// Species configs (3 * 5 floats = 15 floats -> 60 bytes)
	// Interaction matrix (9 floats -> 36 bytes)
	// Total needs to be aligned. Let's use a generous buffer size.
	// 64 floats = 256 bytes
	const data = new Float32Array(64);

	const buffer = device.createBuffer({
		size: data.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		label: "Config Uniform",
	});

	return { buffer, data };
}

export function updateConfigUniform(
	device: GPUDevice,
	configUniform: ConfigUniform,
	slimeConfig: SlimeConfig,
	width: number,
	height: number,
	frameSeed: number,
	agentCount: number,
): void {
	const data = configUniform.data;
	const dataView = new DataView(data.buffer);

	dataView.setUint32(0, width, true);
	dataView.setUint32(4, height, true);
	dataView.setFloat32(8, slimeConfig.decayRate, true);
	dataView.setFloat32(12, slimeConfig.diffuseWeight, true);
	dataView.setUint32(16, agentCount, true);
	dataView.setFloat32(20, frameSeed, true);
	// Padding up to 32 bytes (vec4 alignment for start of arrays usually good practice)

	// Per-species config (starting at float index 8, byte offset 32)
	// Each species: sensorAngle, turnAngle, sensorDist, agentSpeed, depositAmount (5 floats)
	// We'll pack them into vec4s + float? Or just array of structs.
	// WGSL alignment rules: struct member alignments.
	// Let's align each species to 32 bytes (8 floats) for simplicity in WGSL access
	// Species 0: offset 32 (index 8)
	// Species 1: offset 64 (index 16)
	// Species 2: offset 96 (index 24)

	for (let i = 0; i < 3; i++) {
		const species = slimeConfig.species[i];
		const baseIdx = 8 + i * 8;
		dataView.setFloat32(baseIdx * 4, species.sensorAngle, true);
		dataView.setFloat32((baseIdx + 1) * 4, species.turnAngle, true);
		dataView.setFloat32((baseIdx + 2) * 4, species.sensorDist, true);
		dataView.setFloat32((baseIdx + 3) * 4, species.agentSpeed, true);
		dataView.setFloat32((baseIdx + 4) * 4, species.depositAmount, true);
	}

	// Interaction matrix (3x3)
	// Starting at offset 128 (index 32)
	// Matrix 0 row: index 32, 33, 34
	// Matrix 1 row: index 36, 37, 38 (aligned to vec4 usually preferred)
	// Matrix 2 row: index 40, 41, 42

	for (let i = 0; i < 3; i++) {
		const baseIdx = 32 + i * 4;
		for (let j = 0; j < 3; j++) {
			dataView.setFloat32(
				(baseIdx + j) * 4,
				slimeConfig.interactions[i][j],
				true,
			);
		}
	}

	device.queue.writeBuffer(configUniform.buffer, 0, data);
}

export function createRenderUniform(device: GPUDevice): ConfigUniform {
	// 3 species * 3 colors (low, mid, high) * 4 floats (rgba padded) = 36 floats
	// + vec2 size + padding = 4 floats
	// Total 40 floats aligned to 160 bytes
	const data = new Float32Array(48); // Generous padding

	const buffer = device.createBuffer({
		size: data.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		label: "Render Uniform",
	});

	return { buffer, data };
}

export function updateRenderUniform(
	device: GPUDevice,
	renderUniform: ConfigUniform,
	width: number,
	height: number,
	speciesColors: Array<{
		low: [number, number, number];
		mid: [number, number, number];
		high: [number, number, number];
	}>,
): void {
	const data = renderUniform.data;
	const dataView = new DataView(data.buffer);

	dataView.setFloat32(0, width, true);
	dataView.setFloat32(4, height, true);
	dataView.setFloat32(8, 0, true);
	dataView.setFloat32(12, 0, true);

	// Starting at offset 16 (float index 4)
	// Each species takes 3 vec4s (48 bytes) -> 3 * 48 = 144 bytes
	// Total size check: 16 + 144 = 160 bytes. Fits in 192 bytes (48 floats).

	for (let i = 0; i < 3; i++) {
		const colors = speciesColors[i];
		const baseIdx = 4 + i * 12; // 3 vec4s per species = 12 floats

		dataView.setFloat32(baseIdx * 4, colors.low[0], true);
		dataView.setFloat32((baseIdx + 1) * 4, colors.low[1], true);
		dataView.setFloat32((baseIdx + 2) * 4, colors.low[2], true);
		dataView.setFloat32((baseIdx + 3) * 4, 0, true);

		dataView.setFloat32((baseIdx + 4) * 4, colors.mid[0], true);
		dataView.setFloat32((baseIdx + 5) * 4, colors.mid[1], true);
		dataView.setFloat32((baseIdx + 6) * 4, colors.mid[2], true);
		dataView.setFloat32((baseIdx + 7) * 4, 0, true);

		dataView.setFloat32((baseIdx + 8) * 4, colors.high[0], true);
		dataView.setFloat32((baseIdx + 9) * 4, colors.high[1], true);
		dataView.setFloat32((baseIdx + 10) * 4, colors.high[2], true);
		dataView.setFloat32((baseIdx + 11) * 4, 0, true);
	}

	device.queue.writeBuffer(renderUniform.buffer, 0, data);
}

export function destroyBuffers(
	gridBuffers: GridBuffers,
	agentBuffers: AgentBuffers,
	configUniform: ConfigUniform,
): void {
	gridBuffers.bufferA.destroy();
	gridBuffers.bufferB.destroy();
	gridBuffers.textureA.destroy();
	gridBuffers.textureB.destroy();
	agentBuffers.positionsX.destroy();
	agentBuffers.positionsY.destroy();
	agentBuffers.angles.destroy();
	configUniform.buffer.destroy();
}
