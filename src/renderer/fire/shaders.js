/**
 * Fire shaders for Luffy — V3
 * Approach: organic fire FIRST, subtle humanoid envelope as gentle width modulation
 * No hard SDF shapes — the fire suggests a form, not defines one
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
uniform float uHumanoid;
uniform float uGlowRadius;

varying vec2 vUv;
varying vec3 vPosition;

// --- Noise ---
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

float fbm(vec3 p) {
  float v = 0.0, a = 0.5, f = 1.0;
  for (int i = 0; i < 6; i++) {
    v += a * snoise(p * f);
    f *= 2.1; a *= 0.47;
  }
  return v;
}

float turbulence(vec3 p) {
  float v = 0.0, a = 0.5, f = 1.0;
  for (int i = 0; i < 5; i++) {
    v += a * abs(snoise(p * f));
    f *= 2.0; a *= 0.5;
  }
  return v;
}

// Gentle humanoid width envelope — NOT a hard SDF
// Returns a width multiplier at each height
float humanoidEnvelope(float y) {
  // Smooth width variation: wider at shoulders, narrow at neck, round at head
  // y is 0..1 from bottom to top
  
  // Base: gentle taper (wide bottom → narrow top, like a candle flame)
  float base = mix(0.45, 0.15, y * y);
  
  // Humanoid modulation (subtle!)
  // Torso: wide and stable (y: 0.1-0.45)
  float torso = 0.42 * smoothstep(0.0, 0.15, y) * smoothstep(0.55, 0.4, y);
  // Shoulders: slight widening (y: 0.45-0.6)
  float shoulders = 0.48 * smoothstep(0.38, 0.5, y) * smoothstep(0.65, 0.55, y);
  // Neck: pinch (y: 0.6-0.72)
  float neck = 0.2 * smoothstep(0.55, 0.65, y) * smoothstep(0.75, 0.68, y);
  // Head: round bulge (y: 0.72-0.88)
  float head = 0.3 * smoothstep(0.68, 0.76, y) * smoothstep(0.92, 0.82, y);
  
  float humanoid = max(max(torso, shoulders), max(neck, head));
  // Blend: use humanoid when uHumanoid > 0, else use base taper
  return mix(base, humanoid, uHumanoid);
}

void main() {
  vec2 uv = vUv;
  float time = uTime * uFlickerSpeed;
  
  // --- Flame envelope ---
  float x = uv.x - 0.5; // centered x: -0.5 to 0.5
  float y = uv.y;
  
  // Width at this height
  float envWidth = humanoidEnvelope(y);
  
  // Soft flame mask based on distance from center vs envelope width
  float xDist = abs(x);
  float flameMask = smoothstep(envWidth + 0.08, envWidth * 0.3, xDist);
  
  // Top fadeout
  flameMask *= smoothstep(1.0, 0.75, y);
  // Bottom fadeout
  flameMask *= smoothstep(0.0, 0.1, y);
  
  // --- Animated fire noise ---
  // Large-scale billowing
  vec3 nc1 = vec3(x * 4.5, y * 5.0 - time * 1.6, time * 0.25);
  float n1 = fbm(nc1);
  
  // Medium detail
  vec3 nc2 = vec3(x * 8.0 + 2.3, y * 7.0 - time * 2.2, time * 0.4 + 5.0);
  float n2 = fbm(nc2);
  
  // Fine wispy detail
  vec3 nc3 = vec3(x * 14.0 + 7.0, y * 12.0 - time * 3.0, time * 0.6 + 11.0);
  float n3 = turbulence(nc3);
  
  // --- Combine ---
  float flame = flameMask;
  // Noise distortion on edges — more at top (fire licks upward)
  flame += n1 * uFlickerIntensity * (0.4 + y * 0.8);
  // Fine texture
  flame += n2 * 0.08;
  flame += n3 * 0.05 * flameMask;
  
  // Soft threshold
  flame = smoothstep(0.08, 0.6, flame);
  
  // Audio reactivity
  flame *= 1.0 + uAudioLevel * 0.35;
  
  // Pulse
  if (uPulseSpeed > 0.0) {
    flame *= 1.0 + sin(uTime * uPulseSpeed * 6.28) * 0.12;
  }
  
  // --- Color ---
  // Core intensity: strongest at center-bottom, fading toward edges
  float coreMask = smoothstep(0.35, 0.8, flame);
  coreMask *= smoothstep(0.0, 0.35, y) * smoothstep(0.8, 0.5, y); // vertical band
  coreMask *= smoothstep(envWidth * 0.8, 0.0, xDist); // horizontal center
  
  vec3 color = uColor;
  
  // Hot white-yellow center
  color = mix(color, vec3(1.0, 0.9, 0.6), coreMask * 0.5);
  // Core color (blue-white for thinking, subtle blue for idle)
  color = mix(color, uCoreColor, coreMask * 0.6);
  
  // Tips: slightly brighter orange-yellow at flame tips
  float tipGlow = smoothstep(0.6, 0.85, y) * flame * 0.3;
  color += vec3(0.15, 0.06, 0.0) * tipGlow;
  
  // Edge darkening (outer fire = darker/redder)
  float edgeDark = smoothstep(0.5, 0.15, flame);
  color = mix(color, uColor * vec3(0.6, 0.25, 0.1), edgeDark * 0.4);
  
  // Subtle noise-based color variation
  color += vec3(0.06, 0.02, 0.0) * n2 * flame;
  
  // --- Warm glow halo ---
  float glowDist = length(vec2(x, y - 0.4));
  float glow = exp(-glowDist * glowDist / (uGlowRadius * uGlowRadius + 0.001)) * 0.12;
  
  // --- Alpha ---
  float alpha = flame;
  alpha *= smoothstep(0.0, 0.06, flame); // extra soft edge
  alpha = clamp(alpha, 0.0, 1.0);
  alpha = max(alpha, glow * 0.4); // glow halo
  
  // Color for glow region
  color = mix(uColor * 0.4, color, step(0.01, flame));
  
  gl_FragColor = vec4(color, alpha);
}
`;
