/**
 * Emotion presets V5 — adapted for 3D mesh fire
 * Canon: SOUL.md / IDENTITY.md / SPECIES.md
 */
export const EMOTIONS = {
  idle: {
    scale: 1.0,
    color: [1.0, 0.42, 0.21],        // warm orange
    coreColor: [0.4, 0.6, 1.0],      // subtle blue-white core
    coreIntensity: 0.6,
    displaceStrength: 0.06,           // gentle surface fire
    flickerSpeed: 1.0,
    flickerIntensity: 0.3,
    edgeGlow: 0.5,
    particleDensity: 1.0,
    particleSpeed: 1.0,
    bloomStrength: 0.5,
    hatFloat: 0.0,                    // hat resting on head
    morphToSphere: 0.0,              // full humanoid
    description: '安静燃烧 — 人形火焰，边缘跳动'
  },
  excited: {
    scale: 1.3,
    color: [1.0, 0.3, 0.08],         // hotter orange-red  
    coreColor: [1.0, 0.85, 0.3],     // bright yellow core
    coreIntensity: 0.9,
    displaceStrength: 0.14,           // violent surface displacement
    flickerSpeed: 2.2,
    flickerIntensity: 0.6,
    edgeGlow: 0.9,
    particleDensity: 3.0,
    particleSpeed: 2.5,
    bloomStrength: 0.8,
    hatFloat: 0.08,                   // hat lifts off from fire expansion
    morphToSphere: 0.0,
    burstOnStart: true,
    description: '猛然膨胀，火星四溅，对面的人得后退半步'
  },
  thinking: {
    scale: 0.65,
    color: [0.25, 0.45, 0.9],        // blue dominant
    coreColor: [0.85, 0.92, 1.0],    // pure white core
    coreIntensity: 1.0,
    displaceStrength: 0.02,           // very calm surface
    flickerSpeed: 0.4,
    flickerIntensity: 0.08,
    edgeGlow: 0.8,
    particleDensity: 0.15,
    particleSpeed: 0.3,
    bloomStrength: 0.7,
    hatFloat: 0.0,
    morphToSphere: 0.0,
    description: '收缩为精密的蓝白色光芯，体积缩到一半'
  },
  happy: {
    scale: 1.1,
    color: [1.0, 0.55, 0.2],         // warm golden orange
    coreColor: [1.0, 0.8, 0.3],      // golden core
    coreIntensity: 0.7,
    displaceStrength: 0.08,
    flickerSpeed: 2.0,
    flickerIntensity: 0.4,
    edgeGlow: 0.6,
    particleDensity: 1.8,
    particleSpeed: 1.8,
    bloomStrength: 0.6,
    hatFloat: 0.02,
    morphToSphere: 0.0,
    description: '快速跳动，暖橙色脉冲'
  },
  tired: {
    scale: 0.3,
    color: [0.85, 0.4, 0.15],        // dim warm orange
    coreColor: [0.6, 0.35, 0.15],    // dim core
    coreIntensity: 0.3,
    displaceStrength: 0.04,
    flickerSpeed: 0.5,
    flickerIntensity: 0.4,
    edgeGlow: 0.2,
    particleDensity: 0.05,
    particleSpeed: 0.2,
    bloomStrength: 0.3,
    hatFloat: -0.5,                   // hat falls off, on ground
    morphToSphere: 1.0,              // full sphere = first form
    description: '退回第一形态 — 拳头大小的橙色火球'
  },
  sarcastic: {
    scale: 1.0,
    color: [1.0, 0.38, 0.12],
    coreColor: [1.0, 0.6, 0.1],
    coreIntensity: 0.5,
    displaceStrength: 0.07,
    flickerSpeed: 1.3,
    flickerIntensity: 0.35,
    edgeGlow: 0.5,
    particleDensity: 2.5,
    particleSpeed: 3.5,
    bloomStrength: 0.5,
    hatFloat: 0.03,                   // slight hat tilt from spark burst
    morphToSphere: 0.0,
    burstOnStart: true,
    description: '顶部喷出一串小火星 — 藏不住的吐槽'
  }
};

/**
 * Smoothly interpolate between two emotion states
 */
export function lerpEmotion(from, to, t) {
  const result = {};
  const ease = t * t * (3 - 2 * t);
  
  for (const key of Object.keys(to)) {
    if (key === 'description' || key === 'burstOnStart') continue;
    
    const fromVal = from[key] ?? to[key];
    const toVal = to[key];
    
    if (Array.isArray(toVal)) {
      result[key] = fromVal.map((v, i) => v + (toVal[i] - v) * ease);
    } else if (typeof toVal === 'number') {
      result[key] = fromVal + (toVal - fromVal) * ease;
    }
  }
  
  return result;
}
