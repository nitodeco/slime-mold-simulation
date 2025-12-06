export interface Engine {
	start: () => void;
	stop: () => void;
	setSpeed: (intervalMs: number) => void;
	isRunning: () => boolean;
}

export function createEngine(tick: () => void): Engine {
	let running = false;
	let lastTime = 0;
	let accumulator = 0;
	let targetInterval = 100;
	let animationFrameId: number | null = null;

	const MAX_TICKS_PER_FRAME = 4;

	function loop(currentTime: number) {
		if (!running) {
			return;
		}

		const deltaTime = currentTime - lastTime;
		lastTime = currentTime;
		accumulator += deltaTime;

		let ticksThisFrame = 0;
		while (
			accumulator >= targetInterval &&
			ticksThisFrame < MAX_TICKS_PER_FRAME
		) {
			tick();
			accumulator -= targetInterval;
			ticksThisFrame++;
		}

		if (accumulator > targetInterval * MAX_TICKS_PER_FRAME) {
			accumulator = 0;
		}

		animationFrameId = requestAnimationFrame(loop);
	}

	function start() {
		if (running) {
			return;
		}

		running = true;
		lastTime = performance.now();
		accumulator = 0;
		animationFrameId = requestAnimationFrame(loop);
	}

	function stop() {
		if (!running) {
			return;
		}

		running = false;
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	}

	function setSpeed(intervalMs: number) {
		targetInterval = intervalMs;
	}

	function isRunning() {
		return running;
	}

	return { start, stop, setSpeed, isRunning };
}
