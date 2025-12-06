const TABLE_SIZE = 4_096;
const TABLE_MASK = TABLE_SIZE - 1;
const TWO_PI = Math.PI * 2;
const INDEX_FACTOR = TABLE_SIZE / TWO_PI;

const sinTable = new Float32Array(TABLE_SIZE);
const cosTable = new Float32Array(TABLE_SIZE);

for (let index = 0; index < TABLE_SIZE; index++) {
	const angle = (index / TABLE_SIZE) * TWO_PI;
	sinTable[index] = Math.sin(angle);
	cosTable[index] = Math.cos(angle);
}

export function fastSin(angle: number): number {
	const normalized = angle % TWO_PI;
	const positiveAngle = normalized < 0 ? normalized + TWO_PI : normalized;
	const index = (positiveAngle * INDEX_FACTOR) & TABLE_MASK;

	return sinTable[index];
}

export function fastCos(angle: number): number {
	const normalized = angle % TWO_PI;
	const positiveAngle = normalized < 0 ? normalized + TWO_PI : normalized;
	const index = (positiveAngle * INDEX_FACTOR) & TABLE_MASK;

	return cosTable[index];
}
