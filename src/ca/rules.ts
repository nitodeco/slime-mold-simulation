import { type Grid, cloneGrid, countNeighbors } from "./grid";

export type RuleName = "conway" | "highlife" | "seeds" | "briansbrain";

export function stepConway(grid: Grid): Grid {
	const rows = grid.length;
	const cols = grid[0].length;
	const newGrid = cloneGrid(grid);

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const neighbors = countNeighbors(grid, row, col);
			const isAlive = grid[row][col] === 1;

			if (isAlive) {
				newGrid[row][col] = neighbors === 2 || neighbors === 3 ? 1 : 0;
			} else {
				newGrid[row][col] = neighbors === 3 ? 1 : 0;
			}
		}
	}

	return newGrid;
}

export function stepHighLife(grid: Grid): Grid {
	const rows = grid.length;
	const cols = grid[0].length;
	const newGrid = cloneGrid(grid);

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const neighbors = countNeighbors(grid, row, col);
			const isAlive = grid[row][col] === 1;

			if (isAlive) {
				newGrid[row][col] = neighbors === 2 || neighbors === 3 ? 1 : 0;
			} else {
				newGrid[row][col] = neighbors === 3 || neighbors === 6 ? 1 : 0;
			}
		}
	}

	return newGrid;
}

export function stepSeeds(grid: Grid): Grid {
	const rows = grid.length;
	const cols = grid[0].length;
	const newGrid = cloneGrid(grid);

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const neighbors = countNeighbors(grid, row, col);
			const isAlive = grid[row][col] === 1;

			if (isAlive) {
				newGrid[row][col] = 0;
			} else {
				newGrid[row][col] = neighbors === 2 ? 1 : 0;
			}
		}
	}

	return newGrid;
}

export function stepBriansBrain(grid: Grid): Grid {
	const rows = grid.length;
	const cols = grid[0].length;
	const newGrid = cloneGrid(grid);

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const state = grid[row][col];

			if (state === 1) {
				newGrid[row][col] = 2;
			} else if (state === 2) {
				newGrid[row][col] = 0;
			} else {
				let aliveNeighbors = 0;
				for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
					for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
						if (deltaRow === 0 && deltaCol === 0) continue;
						const neighborRow = (row + deltaRow + rows) % rows;
						const neighborCol = (col + deltaCol + cols) % cols;
						if (grid[neighborRow][neighborCol] === 1) {
							aliveNeighbors++;
						}
					}
				}
				newGrid[row][col] = aliveNeighbors === 2 ? 1 : 0;
			}
		}
	}

	return newGrid;
}

export function getStepFunction(
	rule: RuleName,
): (grid: Grid) => Grid {
	switch (rule) {
		case "conway":
			return stepConway;
		case "highlife":
			return stepHighLife;
		case "seeds":
			return stepSeeds;
		case "briansbrain":
			return stepBriansBrain;
	}
}

