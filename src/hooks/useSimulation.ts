import { createSignal, onCleanup, onMount } from "solid-js";
import { GRID_COLS, GRID_ROWS } from "../constants";
import { createEngine, type Engine } from "../core/engine";
import {
	clearGrid,
	createGrid,
	type Grid,
	randomizeGrid,
	setCell,
} from "../core/grid";
import { getStepFunction, type RuleName } from "../core/rules";

export function useSimulation() {
	const bufferA = createGrid(GRID_ROWS, GRID_COLS);
	const bufferB = createGrid(GRID_ROWS, GRID_COLS);

	const [currentBuffer, setCurrentBuffer] = createSignal<Grid>(bufferA);
	const [rule, setRule] = createSignal<RuleName>("conway");
	const [running, setRunning] = createSignal(false);
	const [speed, setSpeed] = createSignal(100);

	let engine: Engine | undefined;

	function tick() {
		const stepFunction = getStepFunction(rule());

		const source = currentBuffer();
		const destination = source === bufferA ? bufferB : bufferA;

		stepFunction(source, destination);
		setCurrentBuffer(destination);
	}

	function handlePlayPause() {
		if (!engine) {
			return;
		}

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
		clearGrid(currentBuffer());
		setCurrentBuffer(currentBuffer() === bufferA ? bufferA : bufferB);
	}

	function handleRandom() {
		randomizeGrid(currentBuffer(), 0.3);
		setCurrentBuffer(currentBuffer() === bufferA ? bufferA : bufferB);
	}

	function handleSpeedChange(newSpeed: number) {
		setSpeed(newSpeed);
		engine?.setSpeed(newSpeed);
	}

	function handleRuleChange(newRule: RuleName) {
		setRule(newRule);
	}

	function setCellAt(row: number, col: number, value: number) {
		setCell(currentBuffer(), row, col, value);
		setCurrentBuffer(currentBuffer() === bufferA ? bufferA : bufferB);
	}

	onMount(() => {
		engine = createEngine(tick);
		onCleanup(() => {
			engine?.stop();
		});
	});

	return {
		grid: currentBuffer,
		rule,
		running,
		speed,
		handlePlayPause,
		handleStep,
		handleClear,
		handleRandom,
		handleSpeedChange,
		handleRuleChange,
		setCellAt,
	};
}
