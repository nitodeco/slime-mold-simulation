function ceilPowerOfTwo(value: number): number {
	return 2 ** Math.ceil(Math.log2(value));
}

export const CELL_SIZE = 1;
export const GRID_COLS = ceilPowerOfTwo(window.innerWidth);
export const GRID_ROWS = ceilPowerOfTwo(window.innerHeight);
export const GRID_COLS_MASK = GRID_COLS - 1;
export const GRID_ROWS_MASK = GRID_ROWS - 1;
export const TOTAL_WIDTH = GRID_COLS * CELL_SIZE;
export const TOTAL_HEIGHT = GRID_ROWS * CELL_SIZE;
