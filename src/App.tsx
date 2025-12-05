import { createSignal, onCleanup, onMount } from "solid-js";
import { createEngine, type Engine } from "./ca/engine";
import { clearGrid, createGrid, type Grid, randomizeGrid, setCell } from "./ca/grid";
import { getStepFunction, type RuleName } from "./ca/rules";

const GRID_ROWS = 80;
const GRID_COLS = 120;
const CELL_SIZE = 8;
const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;
const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;

export default function App() {
	let canvasRef: HTMLCanvasElement | undefined;
	let engine: Engine | undefined;

	const [grid, setGrid] = createSignal<Grid>(createGrid(GRID_ROWS, GRID_COLS));
	const [rule, setRule] = createSignal<RuleName>("conway");
	const [running, setRunning] = createSignal(false);
	const [speed, setSpeed] = createSignal(100);
	const [isDrawing, setIsDrawing] = createSignal(false);

	function tick() {
		const stepFunction = getStepFunction(rule());
		setGrid(stepFunction(grid()));
	}

	function renderGrid() {
		const canvas = canvasRef;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const currentGrid = grid();

		ctx.fillStyle = "#0a0a0f";
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		for (let row = 0; row < GRID_ROWS; row++) {
			for (let col = 0; col < GRID_COLS; col++) {
				const state = currentGrid[row][col];
				if (state === 1) {
					ctx.fillStyle = "#e0e0e0";
					ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
				} else if (state === 2) {
					ctx.fillStyle = "#4a4a5a";
					ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
				}
			}
		}
	}

	function getCellFromEvent(event: MouseEvent): { row: number; col: number } {
		const canvas = canvasRef;
		if (!canvas) return { row: -1, col: -1 };

		const rect = canvas.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;

		const col = Math.floor(mouseX / CELL_SIZE);
		const row = Math.floor(mouseY / CELL_SIZE);

		return { row, col };
	}

	function handleMouseDown(event: MouseEvent) {
		setIsDrawing(true);
		const { row, col } = getCellFromEvent(event);
		const currentGrid = grid();
		setCell(currentGrid, row, col, 1);
		setGrid([...currentGrid]);
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDrawing()) return;
		const { row, col } = getCellFromEvent(event);
		const currentGrid = grid();
		setCell(currentGrid, row, col, 1);
		setGrid([...currentGrid]);
	}

	function handleMouseUp() {
		setIsDrawing(false);
	}

	function handlePlayPause() {
		if (!engine) return;

		if (running()) {
			engine.stop();
			setRunning(false);
		} else {
			engine.start();
			setRunning(true);
		}
	}

	function handleStep() {
		tick();
	}

	function handleClear() {
		const currentGrid = grid();
		clearGrid(currentGrid);
		setGrid([...currentGrid]);
	}

	function handleRandom() {
		const currentGrid = grid();
		randomizeGrid(currentGrid, 0.3);
		setGrid([...currentGrid]);
	}

	function handleSpeedChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newSpeed = Number.parseInt(target.value, 10);
		setSpeed(newSpeed);
		engine?.setSpeed(newSpeed);
	}

	function handleRuleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		setRule(target.value as RuleName);
	}

	onMount(() => {
		engine = createEngine(tick);

		let animationFrameId: number;

		function loop() {
			renderGrid();
			animationFrameId = requestAnimationFrame(loop);
		}

		loop();

		onCleanup(() => {
			cancelAnimationFrame(animationFrameId);
			engine?.stop();
		});
	});

	return (
		<div style={styles.container}>
			<h1 style={styles.title}>Cellular Automata Lab</h1>

			<canvas
				ref={canvasRef}
				width={CANVAS_WIDTH}
				height={CANVAS_HEIGHT}
				style={styles.canvas}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
			/>

			<div style={styles.controls}>
				<select value={rule()} onChange={handleRuleChange} style={styles.select}>
					<option value="conway">Conway's Game of Life</option>
					<option value="highlife">HighLife (B36/S23)</option>
					<option value="seeds">Seeds (B2/S)</option>
					<option value="briansbrain">Brian's Brain</option>
				</select>

				<button type="button" onClick={handlePlayPause} style={styles.button}>
					{running() ? "Pause" : "Play"}
				</button>

				<button type="button" onClick={handleStep} style={styles.button}>
					Step
				</button>

				<button type="button" onClick={handleClear} style={styles.button}>
					Clear
				</button>

				<button type="button" onClick={handleRandom} style={styles.button}>
					Random
				</button>

				<div style={styles.speedControl}>
					<label style={styles.label}>
						Speed: {speed()}ms
						<input
							type="range"
							min="10"
							max="500"
							value={speed()}
							onInput={handleSpeedChange}
							style={styles.slider}
						/>
					</label>
				</div>
			</div>
		</div>
	);
}

const styles: Record<string, string> = {
	container: `
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 100vh;
		background: #0a0a0f;
		color: #e0e0e0;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		padding: 2rem;
	`,
	title: `
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		letter-spacing: 0.05em;
		color: #a0a0b0;
	`,
	canvas: `
		border: 1px solid #2a2a3a;
		cursor: crosshair;
		margin-bottom: 1.5rem;
	`,
	controls: `
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		justify-content: center;
		max-width: 960px;
	`,
	select: `
		background: #1a1a2a;
		color: #e0e0e0;
		border: 1px solid #3a3a4a;
		padding: 0.5rem 1rem;
		font-family: inherit;
		font-size: 0.875rem;
		cursor: pointer;
	`,
	button: `
		background: #1a1a2a;
		color: #e0e0e0;
		border: 1px solid #3a3a4a;
		padding: 0.5rem 1rem;
		font-family: inherit;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 0.15s ease;
	`,
	speedControl: `
		display: flex;
		align-items: center;
		gap: 0.5rem;
	`,
	label: `
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #a0a0b0;
	`,
	slider: `
		width: 120px;
		cursor: pointer;
	`,
};

