import type { SpawnPattern } from "../../core/slime";
import { Popover } from "../Popover";

interface SpawnPatternControlProps {
	enabledSpawnPatterns: () => SpawnPattern[];
	onSpawnPatternsChange: (patterns: SpawnPattern[]) => void;
}

const SPAWN_PATTERN_OPTIONS: { value: SpawnPattern; label: string }[] = [
	{ value: "center", label: "Center" },
	{ value: "circle", label: "Circle" },
	{ value: "multiCircle", label: "Multi-Circle" },
	{ value: "spiral", label: "Spiral" },
];

export const SpawnPatternControl = (props: SpawnPatternControlProps) => {
	function handleToggle(pattern: SpawnPattern) {
		const current = props.enabledSpawnPatterns();
		const isEnabled = current.includes(pattern);
		let newPatterns: SpawnPattern[];

		if (isEnabled) {
			if (current.length === 1) {
				return;
			}
			newPatterns = current.filter((p) => p !== pattern);
		} else {
			newPatterns = [...current, pattern];
		}

		props.onSpawnPatternsChange(newPatterns);
	}

	function getDisplayLabel(): string {
		const enabled = props.enabledSpawnPatterns();
		if (enabled.length === SPAWN_PATTERN_OPTIONS.length) {
			return "All";
		}
		if (enabled.length === 1) {
			const option = SPAWN_PATTERN_OPTIONS.find(
				(opt) => opt.value === enabled[0],
			);
			return option?.label ?? "1 selected";
		}
		return `${enabled.length} selected`;
	}

	return (
		<Popover
			trigger={({ toggle }) => (
				<button
					type="button"
					onClick={toggle}
					class="glass-button flex items-center gap-2 h-[36px] px-3 rounded-xl"
				>
					<span class="text-gray-200 text-[10px] uppercase tracking-wider font-medium">
						Spawn
					</span>
					<span class="text-gray-300 text-xs">{getDisplayLabel()}</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-gray-400"
						aria-hidden="true"
					>
						<polyline points="6 9 12 15 18 9" />
					</svg>
				</button>
			)}
		>
			{() => (
				<div class="flex flex-col gap-2 min-w-[160px]">
					{SPAWN_PATTERN_OPTIONS.map((option) => {
						const isEnabled = props
							.enabledSpawnPatterns()
							.includes(option.value);
						return (
							<label class="flex items-center gap-2.5 cursor-pointer px-1 py-1 rounded-lg hover:bg-white/5 transition-colors">
								<input
									type="checkbox"
									checked={isEnabled}
									onChange={() => handleToggle(option.value)}
									class="w-4 h-4 rounded cursor-pointer accent-gray-500"
								/>
								<span class="text-gray-200 text-sm">{option.label}</span>
							</label>
						);
					})}
				</div>
			)}
		</Popover>
	);
};
