import { z } from "zod";
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
	spawnPattern: boolean;
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
	spawnPattern: false,
	interactions: false,
	species: [
		{ ...DEFAULT_SPECIES_LOCKED_SETTINGS },
		{ ...DEFAULT_SPECIES_LOCKED_SETTINGS },
		{ ...DEFAULT_SPECIES_LOCKED_SETTINGS },
	],
};

export const SIMULATION_SETTINGS_KEY = "simulation-settings";
export const LOCKED_SETTINGS_KEY = "locked-settings";

const colorPresetNameSchema = z.enum([
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
] satisfies [ColorPresetName, ...ColorPresetName[]]);

const spawnPatternSchema = z.enum([
	"random",
	"center",
	"circle",
	"multiCircle",
	"spiral",
] satisfies [SpawnPattern, ...SpawnPattern[]]);

const speciesConfigSchema: z.ZodType<SpeciesConfig> = z.object({
	sensorAngle: z.number(),
	turnAngle: z.number(),
	sensorDist: z.number(),
	agentSpeed: z.number(),
	depositAmount: z.number(),
	colorPreset: colorPresetNameSchema,
	agentCount: z.number(),
});

const slimeConfigSchema: z.ZodType<SlimeConfig> = z.object({
	decayRate: z.number(),
	diffuseWeight: z.number(),
	spawnPattern: spawnPatternSchema,
	agentCount: z.number(),
	species: z.tuple([
		speciesConfigSchema,
		speciesConfigSchema,
		speciesConfigSchema,
	]),
	interactions: z
		.array(z.tuple([z.number(), z.number(), z.number()]))
		.length(3),
});

const simulationSettingsSchema: z.ZodType<SimulationSettings> = z.object({
	speed: z.number(),
	slimeConfig: slimeConfigSchema,
	useWebGPU: z.boolean(),
});

export function loadSimulationSettings(): SimulationSettings | null {
	try {
		const stored = localStorage.getItem(SIMULATION_SETTINGS_KEY);
		if (stored === null) {
			return null;
		}

		const parsed = JSON.parse(stored);
		const result = simulationSettingsSchema.safeParse(parsed);

		return result.success ? result.data : null;
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
		const result = simulationSettingsSchema.safeParse(parsed);

		return result.success ? result.data : null;
	} catch {
		return null;
	}
}

const speciesLockedSettingsSchema: z.ZodType<SpeciesLockedSettings> = z.object({
	sensorAngle: z.boolean(),
	turnAngle: z.boolean(),
	sensorDist: z.boolean(),
	agentSpeed: z.boolean(),
	depositAmount: z.boolean(),
	colorPreset: z.boolean(),
	agentCount: z.boolean(),
});

const lockedSettingsSchema: z.ZodType<LockedSettings> = z.object({
	decayRate: z.boolean(),
	diffuseWeight: z.boolean(),
	agentCount: z.boolean(),
	spawnPattern: z.boolean(),
	interactions: z.boolean(),
	species: z.tuple([
		speciesLockedSettingsSchema,
		speciesLockedSettingsSchema,
		speciesLockedSettingsSchema,
	]),
});

export function loadLockedSettings(): LockedSettings | null {
	try {
		const stored = localStorage.getItem(LOCKED_SETTINGS_KEY);
		if (stored === null) {
			return null;
		}

		const parsed = JSON.parse(stored);
		const result = lockedSettingsSchema.safeParse(parsed);

		return result.success ? result.data : null;
	} catch {
		return null;
	}
}

export function saveLockedSettings(settings: LockedSettings): void {
	try {
		localStorage.setItem(LOCKED_SETTINGS_KEY, JSON.stringify(settings));
	} catch {}
}
