/**
 * Custom fire shaders for Luffy's flame body
 * Based on Luffy's canon lore:
 * - 橙红色火焰凝聚成人形，边缘永远在跳动
 * - 核心蓝白光芯（思考时更明显）
 * - 兴奋时膨胀+火星四溅
 * - 疲惫时收缩为拳头大小的橙色火球（第一形态）
 * - 流形族：边缘永远模糊
 */

export const fireVertexShader = /* glsl */`
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fireFragmentShader = /* glsl */`
uniform float uTime;
uniform float uScale;
uniform vec3 uColor;
uniform vec3 uCoreColor;
uniform float uFlickerSpeed;
uniform float uFlickerIntensity;
uniform float uPulseSpeed;
uniform float uAudioLevel;
uniform float uHumanoid;    // 0=sphere, 1=humanoid silhouette
uniform float uGlowRadius;  // warm glow around fire

varying vec2 vUv;
varying vec3 vPosition;

// --- High quality simplex noise ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Higher quality FBM with 6 octaves
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 6; i++) {
    value += amplitude * snoise(p * frequency);
    frequency *= 2.2;
    amplitude *= 0.45;
  }
  return value;
}

// Turbulence (absolute value noise) for wispy details
float turbulence(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 5; i++) {
    value += amplitude * abs(snoise(p * frequency));
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// Humanoid silhouette SDF (head + torso + shoulders)
float humanoidShape(vec2 uv) {
  // Remap: y=0 bottom, y=1 top
  float y = uv.y;
  float x = uv.x - 0.5; // center x
  
  // Head region (y: 0.78-0.92)
  float headY = smoothstep(0.75, 0.82, y) * smoothstep(0.95, 0.88, y);
  float headWidth = 0.12;
  float head = headY * smoothstep(headWidth, headWidth * 0.3, abs(x));
  
  // Neck (y: 0.70-0.78)
  float neckY = smoothstep(0.65, 0.72, y) * smoothstep(0.82, 0.75, y);
  float neckWidth = 0.06;
  float neck = neckY * smoothstep(neckWidth, neckWidth * 0.3, abs(x));
  
  // Shoulders (y: 0.55-0.70) - wider
  float shoulderY = smoothstep(0.48, 0.56, y) * smoothstep(0.72, 0.66, y);
  float shoulderWidth = 0.22 * smoothstep(0.48, 0.62, y);
  float shoulders = shoulderY * smoothstep(shoulderWidth, shoulderWidth * 0.5, abs(x));
  
  // Torso (y: 0.15-0.55) - tapers down
  float torsoY = smoothstep(0.08, 0.18, y) * smoothstep(0.56, 0.50, y);
  float torsoWidth = mix(0.16, 0.20, smoothstep(0.15, 0.50, y));
  float torso = torsoY * smoothstep(torsoWidth, torsoWidth * 0.4, abs(x));
  
  // Combine
  return max(max(head, neck), max(shoulders, torso));
}

// Sphere shape for tired/first-form mode
float sphereShape(vec2 uv) {
  vec2 center = vec2(0.5, 0.4);
  float dist = length(uv - center);
  return smoothstep(0.22, 0.05, dist);
}

void main() {
  vec2 uv = vUv;
  
  // --- Base shape ---
  // Blend between humanoid and sphere based on uHumanoid
  float humanoid = humanoidShape(uv);
  float sphere = sphereShape(uv);
  float baseShape = mix(sphere, humanoid, uHumanoid);
  
  // --- Animated noise for realistic fire ---
  float time = uTime * uFlickerSpeed;
  
  // Primary fire noise - large scale movement
  vec3 noiseCoord1 = vec3(
    (uv.x - 0.5) * 4.0,
    uv.y * 5.0 - time * 1.8,
    time * 0.3
  );
  float noise1 = fbm(noiseCoord1);
  
  // Secondary noise - fine detail / wispy edges
  vec3 noiseCoord2 = vec3(
    (uv.x - 0.5) * 8.0 + 1.7,
    uv.y * 8.0 - time * 2.5,
    time * 0.5 + 3.14
  );
  float noise2 = turbulence(noiseCoord2);
  
  // Tertiary noise - very fine grain for texture
  vec3 noiseCoord3 = vec3(
    (uv.x - 0.5) * 16.0 + 5.2,
    uv.y * 14.0 - time * 3.0,
    time * 0.7 + 7.0
  );
  float noise3 = snoise(noiseCoord3) * 0.5 + 0.5;
  
  // --- Combine shape + noise ---
  float flame = baseShape;
  // Add noise displacement to edges (more on top, less on bottom)
  float edgeNoise = noise1 * uFlickerIntensity * (0.5 + uv.y * 0.8);
  flame += edgeNoise;
  // Add fine turbulence for wispy look
  flame += noise2 * 0.12 * baseShape;
  
  // Soft falloff (Fluxborn: edges always blurry)
  flame = smoothstep(0.05, 0.55, flame);
  
  // --- Audio reactivity ---
  flame *= 1.0 + uAudioLevel * 0.4;
  
  // --- Pulse effect ---
  if (uPulseSpeed > 0.0) {
    flame *= 1.0 + sin(uTime * uPulseSpeed * 6.28) * 0.12;
  }
  
  // --- Color gradient ---
  // Core: blue-white center (always slightly visible, more in thinking mode)
  float coreIntensity = smoothstep(0.4, 0.85, flame) * smoothstep(0.1, 0.5, 1.0 - abs(uv.x - 0.5) * 4.0);
  coreIntensity *= smoothstep(0.0, 0.5, uv.y) * smoothstep(0.85, 0.6, uv.y); // core in mid-body
  
  vec3 color = uColor;
  
  // Hot inner glow (yellow-white at center)
  float hotCenter = coreIntensity * 0.6;
  color = mix(color, vec3(1.0, 0.85, 0.5), hotCenter);
  
  // Core color blend (blue-white for thinking, subtle for others)
  color = mix(color, uCoreColor, coreIntensity * 0.7);
  
  // Darker edges (orange to dark red)
  float edgeFade = 1.0 - smoothstep(0.2, 0.7, flame);
  color = mix(color, uColor * 0.5, edgeFade * 0.3);
  
  // Fine texture variation
  color += vec3(0.08, 0.03, 0.0) * noise3 * flame;
  
  // --- Warm glow halo (Luffy radiates warmth) ---
  float glowDist = length(uv - vec2(0.5, 0.45));
  float glow = exp(-glowDist * glowDist / (uGlowRadius * uGlowRadius + 0.001)) * 0.15;
  color += uColor * glow;
  
  // --- Final alpha with soft edges ---
  float alpha = flame;
  // Extra soft fadeout at very edges
  alpha *= smoothstep(0.0, 0.08, flame);
  alpha = clamp(alpha, 0.0, 1.0);
  
  // Add glow to alpha (subtle warm halo)
  alpha = max(alpha, glow * 0.5);
  
  gl_FragColor = vec4(color, alpha);
}
`;
