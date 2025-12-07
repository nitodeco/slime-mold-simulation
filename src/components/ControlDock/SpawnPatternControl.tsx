import type { SpawnPattern } from "../../core/slime";
import { LockButton } from "../LockButton";

interface SpawnPatternControlProps {
	spawnPattern: () => SpawnPattern;
	locked: boolean;
	onSpawnPatternChange: (pattern: SpawnPattern) => void;
	onToggleLock: () => void;
}

const SPAWN_PATTERN_OPTIONS: { value: SpawnPattern; label: string }[] = [
	{ value: "random", label: "Random" },
	{ value: "center", label: "Center" },
	{ value: "circle", label: "Circle" },
	{ value: "multiCircle", label: "Multi-Circle" },
	{ value: "spiral", label: "Spiral" },
];

export const SpawnPatternControl = (props: SpawnPatternControlProps) => {
	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		props.onSpawnPatternChange(target.value as SpawnPattern);
	}

	return (
		<div class="glass-panel-subtle flex items-center gap-3 px-3 py-2 rounded-xl">
			<div class="flex items-center gap-1">
				<LockButton locked={props.locked} onToggle={props.onToggleLock} />
				<span class="text-gray-200 text-[10px] uppercase tracking-wider font-medium">
					Spawn
				</span>
			</div>
			<select
				value={props.spawnPattern()}
				onChange={handleChange}
				class="glass-input text-gray-200 text-xs px-2.5 py-1.5 rounded-xl cursor-pointer focus:outline-none appearance-none pr-7 transition-all"
				style={{
					"background-image": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
					"background-repeat": "no-repeat",
					"background-position": "right 8px center",
				}}
			>
				{SPAWN_PATTERN_OPTIONS.map((option) => (
					<option value={option.value} class="bg-gray-900">
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
};
