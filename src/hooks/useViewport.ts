import { createSignal, onCleanup, onMount } from "solid-js";

export interface Viewport {
	x: number;
	y: number;
	zoom: number;
}

export function useViewport() {
	// Static viewport, no zooming or panning
	const [viewport, setViewport] = createSignal<Viewport>({
		x: 0,
		y: 0,
		zoom: 1,
	});

	const [canvasSize, setCanvasSize] = createSignal({
		width: window.innerWidth,
		height: window.innerHeight,
	});

	onMount(() => {
		const handleResize = () => {
			setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
		};
		window.addEventListener("resize", handleResize);

		onCleanup(() => {
			window.removeEventListener("resize", handleResize);
		});
	});

	return {
		viewport,
		setViewport,
		canvasSize,
	};
}
