struct ColorGradient {
  low: vec4<f32>,
  mid: vec4<f32>,
  high: vec4<f32>,
}

struct RenderConfig {
  size: vec2<f32>,
  species1: ColorGradient,
  species2: ColorGradient,
  species3: ColorGradient,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

const SCALE: f32 = 1000.0;

@group(0) @binding(0) var gridTexture: texture_2d<u32>;
@group(0) @binding(1) var<uniform> config: RenderConfig;

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );

  var uvs = array<vec2<f32>, 3>(
    vec2<f32>(0.0, 1.0),
    vec2<f32>(2.0, 1.0),
    vec2<f32>(0.0, -1.0)
  );

  var output: VertexOutput;
  output.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
  output.uv = uvs[vertexIndex];
  return output;
}

fn getGradientColor(intensity: f32, gradient: ColorGradient) -> vec3<f32> {
  let curved = pow(intensity, 2.2);
  
  if (curved < 0.5) {
    return mix(gradient.low.rgb, gradient.mid.rgb, curved * 2.0);
  } else {
    return mix(
      gradient.mid.rgb,
      gradient.high.rgb,
      (curved - 0.5) * 2.0
    );
  }
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let uv = input.uv;

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
  }

  let texCoord = uv * config.size - 0.5;
  let texelCoord = floor(texCoord);
  let fraction = fract(texCoord);
  
  let x0 = u32(clamp(texelCoord.x, 0.0, config.size.x - 1.0));
  let x1 = u32(clamp(texelCoord.x + 1.0, 0.0, config.size.x - 1.0));
  let y0 = u32(clamp(texelCoord.y, 0.0, config.size.y - 1.0));
  let y1 = u32(clamp(texelCoord.y + 1.0, 0.0, config.size.y - 1.0));
  
  let texel00 = textureLoad(gridTexture, vec2u(x0, y0), 0);
  let texel10 = textureLoad(gridTexture, vec2u(x1, y0), 0);
  let texel01 = textureLoad(gridTexture, vec2u(x0, y1), 0);
  let texel11 = textureLoad(gridTexture, vec2u(x1, y1), 0);
  
  let val1 = mix(
    mix(f32(texel00.r), f32(texel10.r), fraction.x),
    mix(f32(texel01.r), f32(texel11.r), fraction.x),
    fraction.y
  ) / SCALE;
  let val2 = mix(
    mix(f32(texel00.g), f32(texel10.g), fraction.x),
    mix(f32(texel01.g), f32(texel11.g), fraction.x),
    fraction.y
  ) / SCALE;
  let val3 = mix(
    mix(f32(texel00.b), f32(texel10.b), fraction.x),
    mix(f32(texel01.b), f32(texel11.b), fraction.x),
    fraction.y
  ) / SCALE;

  let intensity1 = clamp(val1 / 255.0, 0.0, 1.0);
  let intensity2 = clamp(val2 / 255.0, 0.0, 1.0);
  let intensity3 = clamp(val3 / 255.0, 0.0, 1.0);

  let baseColor = vec3<f32>(0.0, 0.0, 0.0);
  
  let color1 = getGradientColor(intensity1, config.species1);
  let color2 = getGradientColor(intensity2, config.species2);
  let color3 = getGradientColor(intensity3, config.species3);

  var finalColor = baseColor;
  finalColor = mix(finalColor, color1, intensity1);
  finalColor = max(finalColor, mix(baseColor, color2, intensity2)); // Max blend to prevent washout
  finalColor = max(finalColor, mix(baseColor, color3, intensity3));

  return vec4<f32>(finalColor, 1.0);
}
