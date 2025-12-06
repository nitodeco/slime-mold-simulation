import { For } from "solid-js";
import { getColorPreset, type SlimeConfig } from "../../core/slime";
import { Popover } from "../Popover";

interface InteractionMatrixProps {
	config: SlimeConfig;
	onChange: (row: number, col: number, value: number) => void;
}

export const InteractionMatrix = (props: InteractionMatrixProps) => {
	const interactionPresets = [
		{
			name: "Cooperative",
			matrix: [
				[1, 0.5, 0.5],
				[0.5, 1, 0.5],
				[0.5, 0.5, 1],
			],
		},
		{
			name: "Competitive",
			matrix: [
				[1, -0.5, -0.5],
				[-0.5, 1, -0.5],
				[-0.5, -0.5, 1],
			],
		},
		{
			name: "Neutral",
			matrix: [
				[1, 0, 0],
				[0, 1, 0],
				[0, 0, 1],
			],
		},
		{
			name: "Predator/Prey",
			matrix: [
				[1, 1, 0], // S1 likes S2
				[-1, 1, 0], // S2 hates S1
				[0, 0, 1], // S3 neutral
			],
		},
	];

	const getCellColor = (value: number) => {
		if (value > 0) return `rgba(0, 255, 100, ${Math.abs(value)})`;
		if (value < 0) return `rgba(255, 50, 50, ${Math.abs(value)})`;
		return "transparent";
	};

	const applyPreset = (matrix: number[][], close: () => void) => {
		for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
			for (let colIndex = 0; colIndex < 3; colIndex++) {
				props.onChange(rowIndex, colIndex, matrix[rowIndex][colIndex]);
			}
		}
		close();
	};

	return (
		<div class="flex flex-col gap-4 bg-gray-900/30 p-3 rounded-sm border border-gray-700/50">
			<div class="flex items-center justify-between">
				<div class="text-xs font-bold text-gray-400 uppercase tracking-wider">
					Interactions
				</div>
				<Popover
					trigger={({ toggle }) => (
						<button
							type="button"
							onClick={toggle}
							class="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300"
						>
							Presets
						</button>
					)}
				>
					{({ close }) => (
						<div class="flex flex-col gap-1 min-w-[120px]">
							<For each={interactionPresets}>
								{(preset) => (
									<button
										type="button"
										onClick={() => applyPreset(preset.matrix, close)}
										class="text-left px-2 py-1 text-xs hover:bg-gray-700 rounded-sm text-gray-300 hover:text-white transition-colors"
									>
										{preset.name}
									</button>
								)}
							</For>
						</div>
					)}
				</Popover>
			</div>

			<div class="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 items-center">
				<div class="col-start-2 text-center text-[10px] text-gray-500 font-mono">
					S1
				</div>
				<div class="text-center text-[10px] text-gray-500 font-mono">S2</div>
				<div class="text-center text-[10px] text-gray-500 font-mono">S3</div>

				<For each={[0, 1, 2]}>
					{(row) => {
						const rowColor = getColorPreset(
							props.config.species[row].colorPreset,
						).mid;
						return (
							<>
								<div class="flex items-center justify-center">
									<div
										class="w-2 h-2 rounded-full"
										style={{ background: rowColor }}
										title={`Species ${row + 1}`}
									/>
								</div>
								<For each={[0, 1, 2]}>
									{(col) => {
										const val = props.config.interactions[row][col];
										return (
											<div class="relative group">
												<input
													type="number"
													min="-1"
													max="1"
													step="0.1"
													value={val}
													onInput={(e) =>
														props.onChange(
															row,
															col,
															Number.parseFloat(e.currentTarget.value),
														)
													}
													class="w-full bg-gray-800 text-center text-xs p-1 rounded border border-gray-700 focus:border-blue-500 outline-none appearance-none"
													style={{
														"border-color": getCellColor(val),
													}}
												/>
											</div>
										);
									}}
								</For>
							</>
						);
					}}
				</For>
			</div>
			<div class="text-[10px] text-gray-500 text-center italic">
				Row species attracted to (positive) or repelled by (negative) Column
				species
			</div>
		</div>
	);
};
