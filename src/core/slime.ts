import { GRID_COLS_MASK, GRID_ROWS_MASK } from "../constants";
import type { Grid } from "./grid";
import { fastCos, fastSin } from "./trigLookup";

export interface SlimeConfig {
	sensorAngle: number;
	turnAngle: number;
	sensorDist: number;
	decayRate: number;
	diffuseWeight: number;
	depositAmount: number;
	agentSpeed: number;
	agentCount: number;
	vortexRadius: number;
	color: string;
}

export const DEFAULT_SLIME_CONFIG: SlimeConfig = {
	sensorAngle: Math.PI / 4,
	turnAngle: Math.PI / 4,
	sensorDist: 9,
	decayRate: 2,
	diffuseWeight: 0.1,
	depositAmount: 50,
	agentSpeed: 1,
	agentCount: 5,
	vortexRadius: 40,
	color: "#FB00FF",
};

export interface AgentPool {
	x: Float32Array;
	y: Float32Array;
	angle: Float32Array;
	count: number;
}

export function createAgentPool(
	count: number,
	width: number,
	height: number,
): AgentPool {
	const xPositions = new Float32Array(count);
	const yPositions = new Float32Array(count);
	const angles = new Float32Array(count);

	for (let index = 0; index < count; index++) {
		xPositions[index] = Math.random() * width;
		yPositions[index] = Math.random() * height;
		angles[index] = Math.random() * Math.PI * 2;
	}

	return {
		x: xPositions,
		y: yPositions,
		angle: angles,
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
	const agentCount = agents.count;

	const sensorAngle = config.sensorAngle;
	const turnAngle = config.turnAngle;
	const sensorDist = config.sensorDist;
	const agentSpeed = config.agentSpeed;
	const depositAmount = config.depositAmount;

	for (let agentIndex = 0; agentIndex < agentCount; agentIndex++) {
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
