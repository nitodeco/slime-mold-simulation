import { createSignal } from "solid-js";
import { CELL_SIZE, GRID_COLS, GRID_ROWS } from "../constants";
import type { Viewport } from "./useViewport";

export function useCanvasInteraction(
	viewport: () => Viewport,
	setCellAt: (row: number, col: number, value: number) => void,
	onInteractionEnd?: () => void,
) {
	const [isDrawing, setIsDrawing] = createSignal(false);

	function getCellFromEvent(
		clientX: number,
		clientY: number,
	): { row: number; col: number } {
		// Zoom is always 1, x/y always 0, but we keep reading from viewport just in case
		const { x, y, zoom } = viewport();
		const worldX = (clientX - x) / zoom;
		const worldY = (clientY - y) / zoom;

		const col = Math.floor(worldX / CELL_SIZE);
		const row = Math.floor(worldY / CELL_SIZE);

		return { row, col };
	}

	function handleMouseDown(event: MouseEvent) {
		if (event.button === 0) {
			setIsDrawing(true);
			const { row, col } = getCellFromEvent(event.clientX, event.clientY);

			if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
				setCellAt(row, col, 1);
			}
		}
	}

	function handleMouseMove(event: MouseEvent) {
		if (isDrawing()) {
			const { row, col } = getCellFromEvent(event.clientX, event.clientY);

			// We don't check bounds here because the vortex effect in setCellAt handles agents outside exact cell bounds nicely
			// and we want continuous updates even if not changing cells for the vortex effect
			setCellAt(row, col, 1);
		}
	}

	function handleMouseUp() {
		if (isDrawing()) {
			onInteractionEnd?.();
		}
		setIsDrawing(false);
	}

	return {
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
	};
}
