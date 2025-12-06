import { createSignal, onCleanup, onMount } from "solid-js";

function checkIsMobile(): boolean {
	return (
		window.matchMedia("(max-width: 768px)").matches ||
		window.matchMedia("(pointer: coarse)").matches
	);
}

export function useIsMobile() {
	const [isMobile, setIsMobile] = createSignal(checkIsMobile());

	onMount(() => {
		const mediaQueryList = window.matchMedia("(max-width: 768px)");
		const touchMediaQueryList = window.matchMedia("(pointer: coarse)");

		function updateIsMobile() {
			setIsMobile(checkIsMobile());
		}

		mediaQueryList.addEventListener("change", updateIsMobile);
		touchMediaQueryList.addEventListener("change", updateIsMobile);

		window.addEventListener("resize", updateIsMobile);

		onCleanup(() => {
			mediaQueryList.removeEventListener("change", updateIsMobile);
			touchMediaQueryList.removeEventListener("change", updateIsMobile);
			window.removeEventListener("resize", updateIsMobile);
		});
	});

	return isMobile;
}
