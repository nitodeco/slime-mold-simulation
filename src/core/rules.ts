import type { Grid } from "./grid";

export type RuleName = "conway" | "briansbrain";

function countNeighborsInterior(
	data: Uint8Array,
	index: number,
	width: number,
): number {
	let count = 0;

	if (data[index - width - 1] >= 1) count++;
	if (data[index - width] >= 1) count++;
	if (data[index - width + 1] >= 1) count++;
	if (data[index - 1] >= 1) count++;
	if (data[index + 1] >= 1) count++;
	if (data[index + width - 1] >= 1) count++;
	if (data[index + width] >= 1) count++;
	if (data[index + width + 1] >= 1) count++;

	return count;
}

function countNeighborsWrapped(
	data: Uint8Array,
	row: number,
	col: number,
	width: number,
	height: number,
): number {
	let count = 0;
	for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
		for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
			if (deltaRow === 0 && deltaCol === 0) {
				continue;
			}

			const neighborRow = (row + deltaRow + height) % height;
			const neighborCol = (col + deltaCol + width) % width;

			if (data[neighborRow * width + neighborCol] >= 1) {
				count++;
			}
		}
	}
	return count;
}

function countAliveNeighborsInterior(
	data: Uint8Array,
	index: number,
	width: number,
): number {
	let count = 0;

	if (data[index - width - 1] === 1) count++;
	if (data[index - width] === 1) count++;
	if (data[index - width + 1] === 1) count++;
	if (data[index - 1] === 1) count++;
	if (data[index + 1] === 1) count++;
	if (data[index + width - 1] === 1) count++;
	if (data[index + width] === 1) count++;
	if (data[index + width + 1] === 1) count++;

	return count;
}

function countAliveNeighborsWrapped(
	data: Uint8Array,
	row: number,
	col: number,
	width: number,
	height: number,
): number {
	let count = 0;
	for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
		for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
			if (deltaRow === 0 && deltaCol === 0) {
				continue;
			}

			const neighborRow = (row + deltaRow + height) % height;
			const neighborCol = (col + deltaCol + width) % width;

			if (data[neighborRow * width + neighborCol] === 1) {
				count++;
			}
		}
	}
	return count;
}

export function stepConway(source: Grid, destination: Grid): void {
	const { data: sourceData, width, height } = source;
	const destData = destination.data;

	for (let row = 1; row < height - 1; row++) {
		for (let col = 1; col < width - 1; col++) {
			const index = row * width + col;
			const neighbors = countNeighborsInterior(sourceData, index, width);
			const isAlive = sourceData[index] === 1;

			if (isAlive) {
				destData[index] = neighbors === 2 || neighbors === 3 ? 1 : 0;
			} else {
				destData[index] = neighbors === 3 ? 1 : 0;
			}
		}
	}

	for (let col = 0; col < width; col++) {
		const topIndex = col;
		const bottomIndex = (height - 1) * width + col;

		const topNeighbors = countNeighborsWrapped(
			sourceData,
			0,
			col,
			width,
			height,
		);
		const topAlive = sourceData[topIndex] === 1;
		destData[topIndex] = topAlive
			? topNeighbors === 2 || topNeighbors === 3
				? 1
				: 0
			: topNeighbors === 3
				? 1
				: 0;

		const bottomNeighbors = countNeighborsWrapped(
			sourceData,
			height - 1,
			col,
			width,
			height,
		);
		const bottomAlive = sourceData[bottomIndex] === 1;
		destData[bottomIndex] = bottomAlive
			? bottomNeighbors === 2 || bottomNeighbors === 3
				? 1
				: 0
			: bottomNeighbors === 3
				? 1
				: 0;
	}

	for (let row = 1; row < height - 1; row++) {
		const leftIndex = row * width;
		const rightIndex = row * width + width - 1;

		const leftNeighbors = countNeighborsWrapped(
			sourceData,
			row,
			0,
			width,
			height,
		);
		const leftAlive = sourceData[leftIndex] === 1;
		destData[leftIndex] = leftAlive
			? leftNeighbors === 2 || leftNeighbors === 3
				? 1
				: 0
			: leftNeighbors === 3
				? 1
				: 0;

		const rightNeighbors = countNeighborsWrapped(
			sourceData,
			row,
			width - 1,
			width,
			height,
		);
		const rightAlive = sourceData[rightIndex] === 1;
		destData[rightIndex] = rightAlive
			? rightNeighbors === 2 || rightNeighbors === 3
				? 1
				: 0
			: rightNeighbors === 3
				? 1
				: 0;
	}
}

export function stepBriansBrain(source: Grid, destination: Grid): void {
	const { data: sourceData, width, height } = source;
	const destData = destination.data;

	for (let row = 1; row < height - 1; row++) {
		for (let col = 1; col < width - 1; col++) {
			const index = row * width + col;
			const state = sourceData[index];

			if (state === 1) {
				destData[index] = 2;
			} else if (state === 2) {
				destData[index] = 0;
			} else {
				const aliveNeighbors = countAliveNeighborsInterior(
					sourceData,
					index,
					width,
				);
				destData[index] = aliveNeighbors === 2 ? 1 : 0;
			}
		}
	}

	for (let col = 0; col < width; col++) {
		const topIndex = col;
		const bottomIndex = (height - 1) * width + col;

		const topState = sourceData[topIndex];
		if (topState === 1) {
			destData[topIndex] = 2;
		} else if (topState === 2) {
			destData[topIndex] = 0;
		} else {
			const aliveNeighbors = countAliveNeighborsWrapped(
				sourceData,
				0,
				col,
				width,
				height,
			);
			destData[topIndex] = aliveNeighbors === 2 ? 1 : 0;
		}

		const bottomState = sourceData[bottomIndex];
		if (bottomState === 1) {
			destData[bottomIndex] = 2;
		} else if (bottomState === 2) {
			destData[bottomIndex] = 0;
		} else {
			const aliveNeighbors = countAliveNeighborsWrapped(
				sourceData,
				height - 1,
				col,
				width,
				height,
			);
			destData[bottomIndex] = aliveNeighbors === 2 ? 1 : 0;
		}
	}

	for (let row = 1; row < height - 1; row++) {
		const leftIndex = row * width;
		const rightIndex = row * width + width - 1;

		const leftState = sourceData[leftIndex];
		if (leftState === 1) {
			destData[leftIndex] = 2;
		} else if (leftState === 2) {
			destData[leftIndex] = 0;
		} else {
			const aliveNeighbors = countAliveNeighborsWrapped(
				sourceData,
				row,
				0,
				width,
				height,
			);
			destData[leftIndex] = aliveNeighbors === 2 ? 1 : 0;
		}

		const rightState = sourceData[rightIndex];

		if (rightState === 1) {
			destData[rightIndex] = 2;
		} else if (rightState === 2) {
			destData[rightIndex] = 0;
		} else {
			const aliveNeighbors = countAliveNeighborsWrapped(
				sourceData,
				row,
				width - 1,
				width,
				height,
			);
			destData[rightIndex] = aliveNeighbors === 2 ? 1 : 0;
		}
	}
}

export function getStepFunction(
	rule: RuleName,
): (source: Grid, destination: Grid) => void {
	switch (rule) {
		case "conway":
			return stepConway;
		case "briansbrain":
			return stepBriansBrain;
	}
}
