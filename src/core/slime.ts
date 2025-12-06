import { GRID_COLS_MASK, GRID_ROWS_MASK } from "../constants";
import { hexToRgb } from "../utils/color";
import type { Grid } from "./grid";
import { generateAgentPositions } from "./spawnPatterns";
import { fastCos, fastSin } from "./trigLookup";

export const VALID_SPAWN_PATTERNS = [
	"random",
	"center",
	"circle",
	"multiCircle",
	"spiral",
] as const;

export type SpawnPattern = (typeof VALID_SPAWN_PATTERNS)[number];

export type ColorPresetName =
	| "neon"
	| "ocean"
	| "ember"
	| "toxic"
	| "void"
	| "sunset"
	| "forest"
	| "arctic"
	| "lava"
	| "plasma"
	| "aurora"
	| "fire";

export interface ColorPreset {
	low: string;
	mid: string;
	high: string;
}

export const COLOR_PRESETS: Record<ColorPresetName, ColorPreset> = {
	neon: { low: "#1a0a33", mid: "#ff00b7", high: "#ff66ff" },
	ocean: { low: "#0a2c35", mid: "#00e0ff", high: "#66ffff" },
	ember: { low: "#2a0505", mid: "#ff6b00", high: "#ffaa00" },
	toxic: { low: "#082c14", mid: "#55ff55", high: "#88ff88" },
	void: { low: "#05050a", mid: "#5b1b7d", high: "#ff00aa" },
	sunset: { low: "#240a16", mid: "#ff5a3d", high: "#ff9a73" },
	forest: { low: "#0a1f12", mid: "#2f8f46", high: "#8fcf9a" },
	arctic: { low: "#0a1a2a", mid: "#2c9ad7", high: "#7fd7ff" },
	lava: { low: "#220000", mid: "#d12d00", high: "#ff7a00" },
	plasma: { low: "#0a0a26", mid: "#5a0fd1", high: "#73d7ff" },
	aurora: { low: "#04120f", mid: "#1dbd6f", high: "#5fd2d2" },
	fire: { low: "#2d0b00", mid: "#ff3c00", high: "#ffae00" },
};

export const COLOR_PRESET_NAMES: ColorPresetName[] = [
	"arctic",
	"aurora",
	"ember",
	"fire",
	"forest",
	"lava",
	"neon",
	"ocean",
	"plasma",
	"sunset",
	"toxic",
	"void",
];

export function getColorPreset(presetName: ColorPresetName): ColorPreset {
	return COLOR_PRESETS[presetName] ?? COLOR_PRESETS.neon;
}

export interface ColorPresetFloats {
	low: [number, number, number];
	mid: [number, number, number];
	high: [number, number, number];
}

export function getColorPresetFloats(
	presetName: ColorPresetName,
): ColorPresetFloats {
	const preset = getColorPreset(presetName);
	const lowRgb = hexToRgb(preset.low);
	const midRgb = hexToRgb(preset.mid);
	const highRgb = hexToRgb(preset.high);

	return {
		low: [lowRgb.red / 255, lowRgb.green / 255, lowRgb.blue / 255],
		mid: [midRgb.red / 255, midRgb.green / 255, midRgb.blue / 255],
		high: [highRgb.red / 255, highRgb.green / 255, highRgb.blue / 255],
	};
}

export interface SpeciesConfig {
	sensorAngle: number;
	turnAngle: number;
	sensorDist: number;
	agentSpeed: number;
	depositAmount: number;
	colorPreset: ColorPresetName;
	agentCount: number; // percentage of total
}

export interface SlimeConfig {
	decayRate: number;
	diffuseWeight: number;
	spawnPattern: SpawnPattern;
	agentCount: number; // Total agent count
	species: [SpeciesConfig, SpeciesConfig, SpeciesConfig];
	interactions: number[][]; // 3x3 matrix
}

export const DEFAULT_SPECIES_CONFIG: SpeciesConfig = {
	sensorAngle: Math.PI / 4,
	turnAngle: Math.PI / 4,
	sensorDist: 9,
	agentSpeed: 1,
	depositAmount: 50,
	colorPreset: "neon",
	agentCount: 33.33,
};

export const DEFAULT_SLIME_CONFIG: SlimeConfig = {
	decayRate: 2,
	diffuseWeight: 0.1,
	spawnPattern: "random",
	agentCount: 5,
	species: [
		{ ...DEFAULT_SPECIES_CONFIG, colorPreset: "neon" },
		{ ...DEFAULT_SPECIES_CONFIG, colorPreset: "fire" },
		{ ...DEFAULT_SPECIES_CONFIG, colorPreset: "ocean" },
	],
	interactions: [
		[1, -0.1, -0.1],
		[-0.1, 1, -0.1],
		[-0.1, -0.1, 1],
	],
};

export interface AgentPool {
	x: Float32Array;
	y: Float32Array;
	angle: Float32Array;
	species: Uint32Array;
	count: number;
}

export function createAgentPool(
	count: number,
	width: number,
	height: number,
	config: SlimeConfig,
): AgentPool {
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

	return {
		x: xPositions,
		y: yPositions,
		angle: angles,
		species,
		count,
	};
}

export function stepSlime(
	source: Grid,
	destination: Grid,
	agents: AgentPool,
	config: SlimeConfig,
): void {
	const { width, height } = source;
	const sourceData = source.data;
	const destData = destination.data;

	const diffuseWeight = config.diffuseWeight;
	const oneMinusDiffuse = 1 - diffuseWeight;
	const decayRate = config.decayRate;
	const oneNinth = 0.1111111111;

	for (let cellY = 0; cellY < height; cellY++) {
		const rowOffset = cellY * width;
		const aboveRow = ((cellY - 1) & GRID_ROWS_MASK) * width;
		const belowRow = ((cellY + 1) & GRID_ROWS_MASK) * width;

		for (let cellX = 0; cellX < width; cellX++) {
			const left = (cellX - 1) & GRID_COLS_MASK;
			const right = (cellX + 1) & GRID_COLS_MASK;

			const sum =
				sourceData[aboveRow + left] +
				sourceData[aboveRow + cellX] +
				sourceData[aboveRow + right] +
				sourceData[rowOffset + left] +
				sourceData[rowOffset + cellX] +
				sourceData[rowOffset + right] +
				sourceData[belowRow + left] +
				sourceData[belowRow + cellX] +
				sourceData[belowRow + right];

			const index = rowOffset + cellX;
			const original = sourceData[index];
			const blurred = sum * oneNinth;
			const diffused = original * oneMinusDiffuse + blurred * diffuseWeight;

			const newValue = diffused - decayRate;
			destData[index] = newValue > 0 ? newValue : 0;
		}
	}

	const agentXPositions = agents.x;
	const agentYPositions = agents.y;
	const agentAngles = agents.angle;
	const agentSpecies = agents.species;
	const agentCount = agents.count;

	for (let agentIndex = 0; agentIndex < agentCount; agentIndex++) {
		const speciesIndex = agentSpecies[agentIndex];
		const speciesConfig = config.species[speciesIndex];

		const sensorAngle = speciesConfig.sensorAngle;
		const turnAngle = speciesConfig.turnAngle;
		const sensorDist = speciesConfig.sensorDist;
		const agentSpeed = speciesConfig.agentSpeed;
		const depositAmount = speciesConfig.depositAmount;

		const agentX = agentXPositions[agentIndex];
		const agentY = agentYPositions[agentIndex];
		let agentAngle = agentAngles[agentIndex];

		const leftAngle = agentAngle - sensorAngle;
		const rightAngle = agentAngle + sensorAngle;

		const leftSensorX = Math.round(agentX + fastCos(leftAngle) * sensorDist);
		const leftSensorY = Math.round(agentY + fastSin(leftAngle) * sensorDist);
		const leftWrappedX = leftSensorX & GRID_COLS_MASK;
		const leftWrappedY = leftSensorY & GRID_ROWS_MASK;
		const leftSensor = sourceData[leftWrappedY * width + leftWrappedX];

		const centerSensorX = Math.round(agentX + fastCos(agentAngle) * sensorDist);
		const centerSensorY = Math.round(agentY + fastSin(agentAngle) * sensorDist);
		const centerWrappedX = centerSensorX & GRID_COLS_MASK;
		const centerWrappedY = centerSensorY & GRID_ROWS_MASK;
		const centerSensor = sourceData[centerWrappedY * width + centerWrappedX];

		const rightSensorX = Math.round(agentX + fastCos(rightAngle) * sensorDist);
		const rightSensorY = Math.round(agentY + fastSin(rightAngle) * sensorDist);
		const rightWrappedX = rightSensorX & GRID_COLS_MASK;
		const rightWrappedY = rightSensorY & GRID_ROWS_MASK;
		const rightSensor = sourceData[rightWrappedY * width + rightWrappedX];

		if (centerSensor >= leftSensor && centerSensor >= rightSensor) {
		} else if (leftSensor > rightSensor) {
			agentAngle -= turnAngle;
		} else if (rightSensor > leftSensor) {
			agentAngle += turnAngle;
		} else {
			agentAngle += (Math.random() - 0.5) * 2 * turnAngle;
		}

		let newX = agentX + fastCos(agentAngle) * agentSpeed;
		let newY = agentY + fastSin(agentAngle) * agentSpeed;

		if (newX < 0) newX += width;
		if (newX >= width) newX -= width;
		if (newY < 0) newY += height;
		if (newY >= height) newY -= height;

		agentXPositions[agentIndex] = newX;
		agentYPositions[agentIndex] = newY;
		agentAngles[agentIndex] = agentAngle;

		const pixelX = Math.floor(newX);
		const pixelY = Math.floor(newY);
		const pixelIndex = pixelY * width + pixelX;

		const currentVal = destData[pixelIndex];
		const newPixelValue = currentVal + depositAmount;
		destData[pixelIndex] = newPixelValue < 255 ? newPixelValue : 255;
	}
}
