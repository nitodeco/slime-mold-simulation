export interface Engine {
	start: () => void;
	stop: () => void;
	setSpeed: (intervalMs: number) => void;
	isRunning: () => boolean;
}

export function createEngine(tick: () => void): Engine {
	let intervalId: number | null = null;
	let speed = 100;

	function start() {
		if (intervalId !== null) {
			return;
		}

		intervalId = window.setInterval(tick, speed);
	}

	function stop() {
		if (intervalId === null) {
			return;
		}

		window.clearInterval(intervalId);
		intervalId = null;
	}

	function setSpeed(intervalMs: number) {
		speed = intervalMs;
		if (intervalId !== null) {
			stop();
			start();
		}
	}

	function isRunning() {
		return intervalId !== null;
	}

	return { start, stop, setSpeed, isRunning };
}
