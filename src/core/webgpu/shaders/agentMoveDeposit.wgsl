struct SpeciesParams {
  sensorAngle: f32,
  turnAngle: f32,
  sensorDist: f32,
  agentSpeed: f32,
  depositAmount: f32,
  pad1: f32,
  pad2: f32,
  pad3: f32,
}

struct Config {
  width: u32,
  height: u32,
  decayRate: f32,
  diffuseWeight: f32,
  agentCount: u32,
  frameSeed: f32,
  pad1: f32,
  pad2: f32,
  
  species: array<SpeciesParams, 3>,
  interactions: array<vec4<f32>, 3>, // 3x3 matrix, each row padded to vec4
}

const SCALE: f32 = 1000.0;

@group(0) @binding(0) var<storage, read> sourceGrid: array<vec4<u32>>;
@group(0) @binding(1) var<storage, read_write> positionsX: array<f32>;
@group(0) @binding(2) var<storage, read_write> positionsY: array<f32>;
@group(0) @binding(3) var<storage, read_write> angles: array<f32>;
@group(0) @binding(4) var<storage, read_write> species: array<u32>;
@group(0) @binding(5) var<storage, read_write> destGrid: array<atomic<u32>>; // Actually 4x size
@group(0) @binding(6) var<uniform> config: Config;

fn hash(seed: u32) -> f32 {
  var state = seed;
  state = state ^ 2747636419u;
  state = state * 2654435769u;
  state = state ^ (state >> 16u);
  state = state * 2654435769u;
  state = state ^ (state >> 16u);
  state = state * 2654435769u;
  return f32(state) / 4294967295.0;
}

fn sense(agentX: f32, agentY: f32, angle: f32, angleOffset: f32, sensorDist: f32, speciesIdx: u32) -> f32 {
  let sensorAngle = angle + angleOffset;
  let sensorX = agentX + cos(sensorAngle) * sensorDist;
  let sensorY = agentY + sin(sensorAngle) * sensorDist;

  let wrappedX = u32(sensorX) & (config.width - 1u);
  let wrappedY = u32(sensorY) & (config.height - 1u);
  let index = wrappedY * config.width + wrappedX;
  
  let cellValues = sourceGrid[index];
  let interactions = config.interactions[speciesIdx];
  
  let sensedValue = 
    (f32(cellValues.x) * interactions.x) + 
    (f32(cellValues.y) * interactions.y) + 
    (f32(cellValues.z) * interactions.z);
    
  return sensedValue / SCALE;
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let agentIndex = globalId.x;

  if (agentIndex >= config.agentCount) {
    return;
  }

  let speciesIdx = species[agentIndex];
  let params = config.species[speciesIdx];

  let agentX = positionsX[agentIndex];
  let agentY = positionsY[agentIndex];
  var agentAngle = angles[agentIndex];

  let leftSensor = sense(agentX, agentY, agentAngle, -params.sensorAngle, params.sensorDist, speciesIdx);
  let centerSensor = sense(agentX, agentY, agentAngle, 0.0, params.sensorDist, speciesIdx);
  let rightSensor = sense(agentX, agentY, agentAngle, params.sensorAngle, params.sensorDist, speciesIdx);

  let randomValue = hash(agentIndex + u32(config.frameSeed * 1000.0));

  if (centerSensor >= leftSensor && centerSensor >= rightSensor) {
  } else if (leftSensor > rightSensor) {
    agentAngle -= params.turnAngle;
  } else if (rightSensor > leftSensor) {
    agentAngle += params.turnAngle;
  } else {
    agentAngle += (randomValue - 0.5) * 2.0 * params.turnAngle;
  }

  var newX = agentX + cos(agentAngle) * params.agentSpeed;
  var newY = agentY + sin(agentAngle) * params.agentSpeed;

  let widthF = f32(config.width);
  let heightF = f32(config.height);

  if (newX < 0.0) { newX += widthF; }
  if (newX >= widthF) { newX -= widthF; }
  if (newY < 0.0) { newY += heightF; }
  if (newY >= heightF) { newY -= heightF; }

  positionsX[agentIndex] = newX;
  positionsY[agentIndex] = newY;
  angles[agentIndex] = agentAngle;

  let pixelX = u32(floor(newX));
  let pixelY = u32(floor(newY));
  let pixelIndex = pixelY * config.width + pixelX;
  
  // destGrid is effectively array<atomic<u32>> where index is pixelIndex * 4 + channel
  let channelIndex = pixelIndex * 4u + speciesIdx;
  let depositU32 = u32(params.depositAmount * SCALE);
  
  atomicAdd(&destGrid[channelIndex], depositU32);
}
