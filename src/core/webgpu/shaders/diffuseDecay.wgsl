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
  interactions: array<vec4<f32>, 3>,
}

@group(0) @binding(0) var<storage, read> source: array<vec4<u32>>;
@group(0) @binding(1) var<storage, read_write> destination: array<vec4<u32>>;
@group(0) @binding(2) var<uniform> config: Config;

const SCALE: f32 = 1000.0;
const TILE_SIZE: u32 = 16u;
const TILE_WITH_HALO: u32 = 18u;

var<workgroup> tile: array<vec3<f32>, 324>;

@compute @workgroup_size(16, 16)
fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let width = config.width;
  let height = config.height;
  let colsMask = width - 1u;
  let rowsMask = height - 1u;

  let tileBaseX = workgroupId.x * TILE_SIZE;
  let tileBaseY = workgroupId.y * TILE_SIZE;

  let localX = localId.x;
  let localY = localId.y;
  let linearLocalId = localY * TILE_SIZE + localX;

  if (linearLocalId < 162u) {
    let haloIdx1 = linearLocalId;
    let haloX1 = haloIdx1 % TILE_WITH_HALO;
    let haloY1 = haloIdx1 / TILE_WITH_HALO;
    let globalX1 = (tileBaseX + haloX1 - 1u) & colsMask;
    let globalY1 = (tileBaseY + haloY1 - 1u) & rowsMask;
    let val1 = source[globalY1 * width + globalX1];
    tile[haloIdx1] = vec3<f32>(f32(val1.x), f32(val1.y), f32(val1.z));

    let haloIdx2 = linearLocalId + 162u;
    if (haloIdx2 < 324u) {
      let haloX2 = haloIdx2 % TILE_WITH_HALO;
      let haloY2 = haloIdx2 / TILE_WITH_HALO;
      let globalX2 = (tileBaseX + haloX2 - 1u) & colsMask;
      let globalY2 = (tileBaseY + haloY2 - 1u) & rowsMask;
      let val2 = source[globalY2 * width + globalX2];
      tile[haloIdx2] = vec3<f32>(f32(val2.x), f32(val2.y), f32(val2.z));
    }
  }

  workgroupBarrier();

  let cellX = globalId.x;
  let cellY = globalId.y;

  if (cellX >= width || cellY >= height) {
    return;
  }

  let tileX = localX + 1u;
  let tileY = localY + 1u;

  let topLeft = tile[(tileY - 1u) * TILE_WITH_HALO + (tileX - 1u)];
  let topCenter = tile[(tileY - 1u) * TILE_WITH_HALO + tileX];
  let topRight = tile[(tileY - 1u) * TILE_WITH_HALO + (tileX + 1u)];
  let midLeft = tile[tileY * TILE_WITH_HALO + (tileX - 1u)];
  let midCenter = tile[tileY * TILE_WITH_HALO + tileX];
  let midRight = tile[tileY * TILE_WITH_HALO + (tileX + 1u)];
  let botLeft = tile[(tileY + 1u) * TILE_WITH_HALO + (tileX - 1u)];
  let botCenter = tile[(tileY + 1u) * TILE_WITH_HALO + tileX];
  let botRight = tile[(tileY + 1u) * TILE_WITH_HALO + (tileX + 1u)];

  let sum = topLeft + topCenter + topRight
          + midLeft + midCenter + midRight
          + botLeft + botCenter + botRight;

  let original = midCenter;
  let blurred = sum / 9.0;
  let diffused = original * (1.0 - config.diffuseWeight) + blurred * config.diffuseWeight;
  let decayed = diffused - vec3<f32>(config.decayRate * SCALE);
  let clamped = clamp(decayed, vec3<f32>(0.0), vec3<f32>(255.0 * SCALE));

  destination[cellY * width + cellX] = vec4<u32>(u32(clamped.x), u32(clamped.y), u32(clamped.z), 0u);
}
