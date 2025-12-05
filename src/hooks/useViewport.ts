import { createSignal, onCleanup, onMount } from "solid-js";
import { TOTAL_HEIGHT, TOTAL_WIDTH } from "../constants";

export interface Viewport {
	x: number;
	y: number;
	zoom: number;
}

const DEFAULT_ZOOM = 1.5;

export function useViewport() {
	const [viewport, setViewport] = createSignal<Viewport>({
		x: window.innerWidth / 2 - (TOTAL_WIDTH * DEFAULT_ZOOM) / 2,
		y: window.innerHeight / 2 - (TOTAL_HEIGHT * DEFAULT_ZOOM) / 2,
		zoom: DEFAULT_ZOOM,
	});

	const [canvasSize, setCanvasSize] = createSignal({
		width: window.innerWidth,
		height: window.innerHeight,
	});

	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		const zoomSensitivity = 0.001;
		const delta = -event.deltaY * zoomSensitivity;
		const currentViewport = viewport();
		const newZoom = Math.min(Math.max(0.1, currentViewport.zoom + delta), 5);

		const mouseX = event.clientX;
		const mouseY = event.clientY;

		const worldX = (mouseX - currentViewport.x) / currentViewport.zoom;
		const worldY = (mouseY - currentViewport.y) / currentViewport.zoom;

		const newX = mouseX - worldX * newZoom;
		const newY = mouseY - worldY * newZoom;

		setViewport({ x: newX, y: newY, zoom: newZoom });
	}

	function handleKeyDown(event: KeyboardEvent) {
		const panSpeed = 20;
		switch (event.key) {
			case "ArrowUp":
				setViewport((v) => ({ ...v, y: v.y + panSpeed }));
				break;
			case "ArrowDown":
				setViewport((v) => ({ ...v, y: v.y - panSpeed }));
				break;
			case "ArrowLeft":
				setViewport((v) => ({ ...v, x: v.x + panSpeed }));
				break;
			case "ArrowRight":
				setViewport((v) => ({ ...v, x: v.x - panSpeed }));
				break;
		}
	}

	onMount(() => {
		const handleResize = () => {
			setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
		};
		window.addEventListener("resize", handleResize);
		window.addEventListener("keydown", handleKeyDown);

		onCleanup(() => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("keydown", handleKeyDown);
		});
	});

	return {
		viewport,
		setViewport,
		canvasSize,
		handleWheel,
	};
}
