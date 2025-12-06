export interface Grid {
	data: Uint8Array;
	width: number;
	height: number;
}

export function createGrid(rows: number, cols: number): Grid {
	return {
		data: new Uint8Array(rows * cols),
		width: cols,
		height: rows,
	};
}

export function getCell(grid: Grid, row: number, col: number): number {
	return grid.data[row * grid.width + col];
}

export function setCell(
	grid: Grid,
	row: number,
	col: number,
	value: number,
): void {
	if (row >= 0 && row < grid.height && col >= 0 && col < grid.width) {
		grid.data[row * grid.width + col] = value;
	}
}

export function toggleCell(grid: Grid, row: number, col: number): void {
	if (row >= 0 && row < grid.height && col >= 0 && col < grid.width) {
		const index = row * grid.width + col;
		grid.data[index] = grid.data[index] === 0 ? 1 : 0;
	}
}

export function clearGrid(grid: Grid): void {
	grid.data.fill(0);
}

export function randomizeGrid(grid: Grid, density = 0.3): void {
	const length = grid.data.length;

	for (let index = 0; index < length; index++) {
		grid.data[index] = Math.random() < density ? 1 : 0;
	}
}
