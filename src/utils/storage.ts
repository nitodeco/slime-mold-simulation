import type {
	ColorPresetName,
	SlimeConfig,
	SpawnPattern,
	SpeciesConfig,
} from "../core/slime";

export interface SimulationSettings {
	speed: number;
	slimeConfig: SlimeConfig;
	useWebGPU: boolean;
}

export interface SpeciesLockedSettings {
	sensorAngle: boolean;
	turnAngle: boolean;
	sensorDist: boolean;
	agentSpeed: boolean;
	depositAmount: boolean;
	colorPreset: boolean;
	agentCount: boolean;
}

export interface LockedSettings {
	decayRate: boolean;
	diffuseWeight: boolean;
	agentCount: boolean;
	enabledSpawnPatterns: SpawnPattern[];
	interactions: boolean;
	species: [
		SpeciesLockedSettings,
		SpeciesLockedSettings,
		SpeciesLockedSettings,
	];
}

export const DEFAULT_SPECIES_LOCKED_SETTINGS: SpeciesLockedSettings = {
	sensorAngle: false,
	turnAngle: false,
	sensorDist: false,
	agentSpeed: false,
	depositAmount: false,
	colorPreset: false,
	agentCount: false,
};

export const DEFAULT_LOCKED_SETTINGS: LockedSettings = {
	decayRate: false,
	diffuseWeight: false,
	agentCount: false,
	enabledSpawnPatterns: ["center", "circle", "multiCircle", "spiral"],
	interactions: false,
	species: [
		{ ...DEFAULT_SPECIES_LOCKED_SETTINGS },
		{ ...DEFAULT_SPECIES_LOCKED_SETTINGS },
		{ ...DEFAULT_SPECIES_LOCKED_SETTINGS },
	],
};

export const SIMULATION_SETTINGS_KEY = "simulation-settings";
export const LOCKED_SETTINGS_KEY = "locked-settings";

const VALID_COLOR_PRESET_NAMES: readonly ColorPresetName[] = [
	"neon",
	"ocean",
	"ember",
	"toxic",
	"void",
	"sunset",
	"forest",
	"arctic",
	"lava",
	"plasma",
	"aurora",
	"fire",
] as const;

const VALID_SPAWN_PATTERNS: readonly SpawnPattern[] = [
	"random",
	"center",
	"circle",
	"multiCircle",
	"spiral",
] as const;

function isValidColorPresetName(value: unknown): value is ColorPresetName {
	return (
		typeof value === "string" &&
		VALID_COLOR_PRESET_NAMES.includes(value as ColorPresetName)
	);
}

function isValidSpawnPattern(value: unknown): value is SpawnPattern {
	return (
		typeof value === "string" &&
		VALID_SPAWN_PATTERNS.includes(value as SpawnPattern)
	);
}

function isValidSpeciesConfig(value: unknown): value is SpeciesConfig {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const config = value as Record<string, unknown>;

	return (
		typeof config.sensorAngle === "number" &&
		typeof config.turnAngle === "number" &&
		typeof config.sensorDist === "number" &&
		typeof config.agentSpeed === "number" &&
		typeof config.depositAmount === "number" &&
		isValidColorPresetName(config.colorPreset) &&
		typeof config.agentCount === "number"
	);
}

function isValidSlimeConfig(value: unknown): value is SlimeConfig {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const config = value as Record<string, unknown>;

	if (
		typeof config.decayRate !== "number" ||
		typeof config.diffuseWeight !== "number" ||
		typeof config.agentCount !== "number"
	) {
		return false;
	}

	if (!Array.isArray(config.enabledSpawnPatterns)) {
		return false;
	}

	if (config.enabledSpawnPatterns.length === 0) {
		return false;
	}

	for (const pattern of config.enabledSpawnPatterns) {
		if (!isValidSpawnPattern(pattern)) {
			return false;
		}
	}

	if (!Array.isArray(config.species) || config.species.length !== 3) {
		return false;
	}

	if (
		!isValidSpeciesConfig(config.species[0]) ||
		!isValidSpeciesConfig(config.species[1]) ||
		!isValidSpeciesConfig(config.species[2])
	) {
		return false;
	}

	if (!Array.isArray(config.interactions) || config.interactions.length !== 3) {
		return false;
	}

	for (const interaction of config.interactions) {
		if (
			!Array.isArray(interaction) ||
			interaction.length !== 3 ||
			typeof interaction[0] !== "number" ||
			typeof interaction[1] !== "number" ||
			typeof interaction[2] !== "number"
		) {
			return false;
		}
	}

	return true;
}

function isValidSimulationSettings(
	value: unknown,
): value is SimulationSettings {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const settings = value as Record<string, unknown>;

	return (
		typeof settings.speed === "number" &&
		isValidSlimeConfig(settings.slimeConfig) &&
		typeof settings.useWebGPU === "boolean"
	);
}

function migrateSlimeConfig(config: Record<string, unknown>): void {
	if ("spawnPattern" in config && !("enabledSpawnPatterns" in config)) {
		const oldPattern = config.spawnPattern;
		if (isValidSpawnPattern(oldPattern)) {
			const patternsWithoutRandom = VALID_SPAWN_PATTERNS.filter(
				(pattern) => pattern !== "random",
			);
			config.enabledSpawnPatterns =
				oldPattern === "random"
					? patternsWithoutRandom
					: [oldPattern as SpawnPattern];
			delete config.spawnPattern;
		}
	}
}

export function loadSimulationSettings(): SimulationSettings | null {
	try {
		const stored = localStorage.getItem(SIMULATION_SETTINGS_KEY);
		if (stored === null) {
			return null;
		}

		const parsed = JSON.parse(stored);
		if (parsed?.slimeConfig) {
			migrateSlimeConfig(parsed.slimeConfig);
		}
		return isValidSimulationSettings(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

export function saveSimulationSettings(settings: SimulationSettings): void {
	try {
		localStorage.setItem(SIMULATION_SETTINGS_KEY, JSON.stringify(settings));
	} catch {}
}

export function encodeSimulationSettings(settings: SimulationSettings): string {
	return btoa(JSON.stringify(settings));
}

export function decodeSimulationSettings(
	encoded: string,
): SimulationSettings | null {
	try {
		const parsed = JSON.parse(atob(encoded));
		return isValidSimulationSettings(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

function isValidSpeciesLockedSettings(
	value: unknown,
): value is SpeciesLockedSettings {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const settings = value as Record<string, unknown>;

	return (
		typeof settings.sensorAngle === "boolean" &&
		typeof settings.turnAngle === "boolean" &&
		typeof settings.sensorDist === "boolean" &&
		typeof settings.agentSpeed === "boolean" &&
		typeof settings.depositAmount === "boolean" &&
		typeof settings.colorPreset === "boolean" &&
		typeof settings.agentCount === "boolean"
	);
}

function isValidLockedSettings(value: unknown): value is LockedSettings {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const settings = value as Record<string, unknown>;

	if (
		typeof settings.decayRate !== "boolean" ||
		typeof settings.diffuseWeight !== "boolean" ||
		typeof settings.agentCount !== "boolean" ||
		typeof settings.interactions !== "boolean"
	) {
		return false;
	}

	if (!Array.isArray(settings.enabledSpawnPatterns)) {
		return false;
	}

	for (const pattern of settings.enabledSpawnPatterns) {
		if (!isValidSpawnPattern(pattern)) {
			return false;
		}
	}

	if (!Array.isArray(settings.species) || settings.species.length !== 3) {
		return false;
	}

	return (
		isValidSpeciesLockedSettings(settings.species[0]) &&
		isValidSpeciesLockedSettings(settings.species[1]) &&
		isValidSpeciesLockedSettings(settings.species[2])
	);
}

function migrateLockedSettings(settings: Record<string, unknown>): void {
	if ("spawnPattern" in settings && !("enabledSpawnPatterns" in settings)) {
		const oldLocked = settings.spawnPattern;
		if (typeof oldLocked === "boolean") {
			if (oldLocked) {
				settings.enabledSpawnPatterns = [];
			} else {
				const patternsWithoutRandom = VALID_SPAWN_PATTERNS.filter(
					(pattern) => pattern !== "random",
				);
				settings.enabledSpawnPatterns = patternsWithoutRandom;
			}
			delete settings.spawnPattern;
		}
	}
}

export function loadLockedSettings(): LockedSettings | null {
	try {
		const stored = localStorage.getItem(LOCKED_SETTINGS_KEY);
		if (stored === null) {
			return null;
		}

		const parsed = JSON.parse(stored);
		migrateLockedSettings(parsed);
		return isValidLockedSettings(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

export function saveLockedSettings(settings: LockedSettings): void {
	try {
		localStorage.setItem(LOCKED_SETTINGS_KEY, JSON.stringify(settings));
	} catch {}
}
