/**
 * Emotion presets for fire parameters
 * Each emotion maps to visual properties of the flame
 */
export const EMOTIONS = {
  idle: {
    scale: 1.0,
    color: [1.0, 0.42, 0.21],      // warm orange #FF6B35
    coreColor: [0.23, 0.51, 0.96],  // blue-white core
    particleDensity: 1.0,
    particleSpeed: 1.0,
    flickerSpeed: 1.0,
    flickerIntensity: 0.3,
    pulseSpeed: 0,
    description: '安静燃烧'
  },
  excited: {
    scale: 1.5,
    color: [1.0, 0.3, 0.1],         // hotter orange-red
    coreColor: [1.0, 0.9, 0.3],     // bright yellow core
    particleDensity: 3.0,
    particleSpeed: 2.5,
    flickerSpeed: 2.0,
    flickerIntensity: 0.6,
    pulseSpeed: 0,
    description: '膨胀150%，火星四溅，色温升高'
  },
  thinking: {
    scale: 0.5,
    color: [0.23, 0.51, 0.96],      // blue-white
    coreColor: [0.8, 0.85, 1.0],    // pure white core
    particleDensity: 0.3,
    particleSpeed: 0.4,
    flickerSpeed: 0.3,
    flickerIntensity: 0.1,
    pulseSpeed: 0.5,
    description: '收缩50%，变蓝白，安静旋转'
  },
  happy: {
    scale: 1.1,
    color: [1.0, 0.55, 0.2],        // warm orange
    coreColor: [1.0, 0.8, 0.3],     // golden core
    particleDensity: 1.5,
    particleSpeed: 1.8,
    flickerSpeed: 2.5,
    flickerIntensity: 0.5,
    pulseSpeed: 2.0,
    description: '快速跳动，暖橙色脉冲'
  },
  tired: {
    scale: 0.3,
    color: [0.8, 0.35, 0.15],       // dim orange
    coreColor: [0.5, 0.3, 0.15],    // dim core
    particleDensity: 0.2,
    particleSpeed: 0.3,
    flickerSpeed: 0.5,
    flickerIntensity: 0.4,
    pulseSpeed: 0,
    description: '退化成拳头大火球，微微闪烁'
  },
  sarcastic: {
    scale: 1.0,
    color: [1.0, 0.4, 0.15],        // orange
    coreColor: [1.0, 0.6, 0.1],     // warm core
    particleDensity: 2.0,
    particleSpeed: 3.0,
    flickerSpeed: 1.2,
    flickerIntensity: 0.3,
    pulseSpeed: 0,
    burstOnStart: true,              // burst sparks on emotion start
    description: '顶部喷出一串小火星'
  }
};

/**
 * Smoothly interpolate between two emotion states
 */
export function lerpEmotion(from, to, t) {
  const result = {};
  const ease = t * t * (3 - 2 * t); // smoothstep
  
  for (const key of Object.keys(from)) {
    if (key === 'description' || key === 'burstOnStart') continue;
    
    if (Array.isArray(from[key])) {
      result[key] = from[key].map((v, i) => v + (to[key][i] - v) * ease);
    } else if (typeof from[key] === 'number') {
      result[key] = from[key] + (to[key] - from[key]) * ease;
    }
  }
  
  return result;
}
