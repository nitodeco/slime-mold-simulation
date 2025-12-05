import { createSignal } from "solid-js";
import { CELL_SIZE, GRID_COLS, GRID_ROWS } from "../constants";
import type { Viewport } from "./useViewport";

export function useCanvasInteraction(
	viewport: () => Viewport,
	setCellAt: (row: number, col: number, value: number) => void,
	setViewport: (updater: (v: Viewport) => Viewport) => void,
) {
	const [isDrawing, setIsDrawing] = createSignal(false);
	const [isPanning, setIsPanning] = createSignal(false);
	const [lastMousePos, setLastMousePos] = createSignal({ x: 0, y: 0 });

	function getCellFromEvent(
		clientX: number,
		clientY: number,
	): { row: number; col: number } {
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
		} else if (event.button === 1 || event.button === 2) {
			event.preventDefault();
			setIsPanning(true);
			setLastMousePos({ x: event.clientX, y: event.clientY });
		}
	}

	function handleMouseMove(event: MouseEvent) {
		if (isPanning()) {
			const dx = event.clientX - lastMousePos().x;
			const dy = event.clientY - lastMousePos().y;
			
			setViewport((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
			setLastMousePos({ x: event.clientX, y: event.clientY });
		} else if (isDrawing()) {
			const { row, col } = getCellFromEvent(event.clientX, event.clientY);

			if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
				setCellAt(row, col, 1);
			}
		}
	}

	function handleMouseUp() {
		setIsDrawing(false);
		setIsPanning(false);
	}

	return {
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
	};
}
