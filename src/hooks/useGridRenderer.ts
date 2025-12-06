import { onCleanup, onMount } from "solid-js";
import {
	CELL_SIZE,
	GRID_COLS,
	GRID_ROWS,
	TOTAL_HEIGHT,
	TOTAL_WIDTH,
} from "../constants";
import type { Grid } from "../core/grid";
import type { SlimeConfig } from "../core/slime";
import { hexToRgb } from "../utils/color";
import type { Viewport } from "./useViewport";

let cachedColor = "";
let basePixelValue = 0;

export function useGridRenderer(
	canvasRef: () => HTMLCanvasElement | undefined,
	grid: () => Grid,
	viewport: () => Viewport,
	canvasSize: () => { width: number; height: number },
	slimeConfig: () => SlimeConfig,
	interactionTarget: () => { row: number; col: number } | null,
) {
	const offscreen = new OffscreenCanvas(GRID_COLS, GRID_ROWS);
	const offscreenCtx = offscreen.getContext("2d", {
		willReadFrequently: false,
	});
	const imageData = offscreenCtx?.createImageData(GRID_COLS, GRID_ROWS);
	const data32 = imageData ? new Uint32Array(imageData.data.buffer) : null;

	function renderGrid() {
		const canvas = canvasRef();
		if (!canvas) {
			return;
		}

		const ctx = canvas.getContext("2d");

		if (!ctx) {
			return;
		}

		const { width, height } = canvasSize();
		const { x, y, zoom } = viewport();

		ctx.fillStyle = "#0a0a0f";
		ctx.fillRect(0, 0, width, height);

		const currentGrid = grid();

		if (offscreenCtx && imageData && data32) {
			const gridData = currentGrid.data;
			const color = slimeConfig().color;

			if (color !== cachedColor) {
				const { r, g, b } = hexToRgb(color);
				basePixelValue = (b << 16) | (g << 8) | r;
				cachedColor = color;
			}

			const gridLength = gridData.length;
			for (let index = 0; index < gridLength; index++) {
				const alpha = gridData[index];
				data32[index] = (alpha << 24) | basePixelValue;
			}

			offscreenCtx.putImageData(imageData, 0, 0);

			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(
				offscreen,
				0,
				0,
				GRID_COLS,
				GRID_ROWS,
				x,
				y,
				TOTAL_WIDTH * zoom,
				TOTAL_HEIGHT * zoom,
			);
		}

		const target = interactionTarget();
		if (target) {
			const { col, row } = target;
			const radius = slimeConfig().vortexRadius * CELL_SIZE * zoom;
			const centerX = x + (col * CELL_SIZE + CELL_SIZE / 2) * zoom;
			const centerY = y + (row * CELL_SIZE + CELL_SIZE / 2) * zoom;

			ctx.beginPath();
			ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
			ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
			ctx.lineWidth = 2;
			ctx.stroke();
		}
	}

	onMount(() => {
		let animationFrameId: number;

		function loop() {
			renderGrid();
			animationFrameId = requestAnimationFrame(loop);
		}
		loop();

		onCleanup(() => {
			cancelAnimationFrame(animationFrameId);
		});
	});
}
