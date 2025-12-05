export type Grid = number[][];

export function createGrid(rows: number, cols: number): Grid {
	const grid: Grid = [];
	for (let row = 0; row < rows; row++) {
		grid[row] = [];
		for (let col = 0; col < cols; col++) {
			grid[row][col] = 0;
		}
	}
	return grid;
}

export function clearGrid(grid: Grid): void {
	for (let row = 0; row < grid.length; row++) {
		for (let col = 0; col < grid[row].length; col++) {
			grid[row][col] = 0;
		}
	}
}

export function toggleCell(grid: Grid, row: number, col: number): void {
	if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
		grid[row][col] = grid[row][col] === 0 ? 1 : 0;
	}
}

export function setCell(grid: Grid, row: number, col: number, value: number): void {
	if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
		grid[row][col] = value;
	}
}

export function cloneGrid(grid: Grid): Grid {
	return grid.map((row) => [...row]);
}

export function countNeighbors(grid: Grid, row: number, col: number): number {
	const rows = grid.length;
	const cols = grid[0].length;
	let count = 0;

	for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
		for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
			if (deltaRow === 0 && deltaCol === 0) continue;

			const neighborRow = (row + deltaRow + rows) % rows;
			const neighborCol = (col + deltaCol + cols) % cols;

			if (grid[neighborRow][neighborCol] >= 1) {
				count++;
			}
		}
	}

	return count;
}

export function randomizeGrid(grid: Grid, density = 0.3): void {
	for (let row = 0; row < grid.length; row++) {
		for (let col = 0; col < grid[row].length; col++) {
			grid[row][col] = Math.random() < density ? 1 : 0;
		}
	}
}

