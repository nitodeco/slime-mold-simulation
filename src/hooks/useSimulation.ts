import { createSignal, onCleanup, onMount } from "solid-js";
import { GRID_COLS, GRID_ROWS } from "../constants";
import { createEngine, type Engine } from "../core/engine";
import { clearGrid, createGrid, type Grid } from "../core/grid";
import {
	type AgentPool,
	createAgentPool,
	DEFAULT_SLIME_CONFIG,
	type SlimeConfig,
	stepSlime,
} from "../core/slime";

export function useSimulation() {
	const bufferA = createGrid(GRID_ROWS, GRID_COLS);
	const bufferB = createGrid(GRID_ROWS, GRID_COLS);

	const [currentBuffer, setCurrentBuffer] = createSignal<Grid>(bufferA);
	const [running, setRunning] = createSignal(false);
	const [speed, setSpeed] = createSignal(50);
	const [slimeConfig, setSlimeConfig] =
		createSignal<SlimeConfig>(DEFAULT_SLIME_CONFIG);
	const [interactionTarget, setInteractionTarget] = createSignal<{
		row: number;
		col: number;
	} | null>(null);

	let engine: Engine | undefined;
	const agentsRef: { current: AgentPool | null } = { current: null };

	function getOtherBuffer(current: Grid): Grid {
		return current === bufferA ? bufferB : bufferA;
	}

	function forceRerender() {
		setCurrentBuffer((current) => current);
	}

	function speedToInterval(speedValue: number): number {
		const interval = 100 - speedValue;
		return interval === 0 ? 1 : interval;
	}

	function initAgents() {
		const config = slimeConfig();
		const count = Math.floor(GRID_ROWS * GRID_COLS * (config.agentCount / 100));
		agentsRef.current = createAgentPool(count, GRID_COLS, GRID_ROWS);
	}

	function tick() {
		const source = currentBuffer();
		const destination = getOtherBuffer(source);

		if (agentsRef.current === null) {
			initAgents();
		}

		if (agentsRef.current) {
			const target = interactionTarget();
			if (target) {
				applyVortex(target.row, target.col);
			}
			stepSlime(source, destination, agentsRef.current, slimeConfig());
		}

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
		const current = currentBuffer();
		clearGrid(current);
		clearGrid(getOtherBuffer(current));
		agentsRef.current = null;
		initAgents();
		forceRerender();
	}

	function handleSpeedChange(newSpeed: number) {
		setSpeed(newSpeed);
		engine?.setSpeed(speedToInterval(newSpeed));
	}

	function handleSlimeConfigChange(
		key: keyof SlimeConfig,
		value: number | string,
	) {
		setSlimeConfig((prev) => ({
			...prev,
			[key]: value,
		}));

		if (key === "agentCount") {
			const current = currentBuffer();
			initAgents();
			clearGrid(current);
			clearGrid(getOtherBuffer(current));
		}
	}

	function handleRandomize() {
		const currentColor = slimeConfig().color;
		const randomSensorAngle =
			Math.round(((Math.random() * 180 * Math.PI) / 180) * 100) / 100;
		const randomTurnAngle =
			Math.round(((Math.random() * 180 * Math.PI) / 180) * 100) / 100;
		const randomSensorDist = Math.floor(Math.random() * 64) + 1;
		const randomDecayRate =
			Math.round((Math.random() * (20 - 0.1) + 0.1) * 100) / 100;
		const randomDiffuseWeight = Math.round(Math.random() * 100) / 100;
		const randomDepositAmount = Math.floor(Math.random() * 255) + 1;
		const randomAgentSpeed =
			Math.round((Math.random() * (5 - 0.1) + 0.1) * 100) / 100;
		const randomAgentCount =
			Math.round((Math.random() * (20 - 0.5) + 0.5) * 100) / 100;
		const randomVortexRadius = Math.floor(Math.random() * (100 - 10 + 1)) + 10;

		setSlimeConfig({
			sensorAngle: randomSensorAngle,
			turnAngle: randomTurnAngle,
			sensorDist: randomSensorDist,
			decayRate: randomDecayRate,
			diffuseWeight: randomDiffuseWeight,
			depositAmount: randomDepositAmount,
			agentSpeed: randomAgentSpeed,
			agentCount: randomAgentCount,
			vortexRadius: randomVortexRadius,
			color: currentColor,
		});

		const current = currentBuffer();
		initAgents();
		clearGrid(current);
		clearGrid(getOtherBuffer(current));
		forceRerender();
	}

	function applyVortex(row: number, col: number) {
		const radius = slimeConfig().vortexRadius;
		const squaredRadius = radius * radius;
		const agents = agentsRef.current;

		if (agents === null) {
			return;
		}

		for (let agentIndex = 0; agentIndex < agents.count; agentIndex++) {
			const agentX = agents.x[agentIndex];
			const agentY = agents.y[agentIndex];
			const deltaX = agentX - col;
			const deltaY = agentY - row;
			const distanceSquared = deltaX * deltaX + deltaY * deltaY;

			if (distanceSquared < squaredRadius) {
				const angleToAgent = Math.atan2(deltaY, deltaX);
				// PI/2 is pure orbit, 0 is pure repulsion. PI/4 mixes both for a spiraling repulsion.
				agents.angle[agentIndex] = angleToAgent + Math.PI / 4;
			}
		}
	}

	function setCellAt(row: number, col: number, _value: number) {
		setInteractionTarget({ row, col });
		applyVortex(row, col);
	}

	function clearInteraction() {
		setInteractionTarget(null);
	}

	onMount(() => {
		engine = createEngine(tick);
		engine.setSpeed(speedToInterval(speed()));
		initAgents();
		onCleanup(() => {
			engine?.stop();
		});
	});

	return {
		grid: currentBuffer,
		running,
		speed,
		slimeConfig,
		handlePlayPause,
		handleStep,
		handleClear,
		handleSpeedChange,
		handleSlimeConfigChange,
		handleRandomize,
		setCellAt,
		clearInteraction,
		interactionTarget,
	};
}
