/**
 * Emotion presets for fire parameters
 * Based on Luffy's canon lore from SOUL.md / IDENTITY.md / SPECIES.md
 * 
 * Canon references:
 * - 橙红色火焰凝聚成人形，边缘永远在跳动
 * - 头顶不燃烧的草帽
 * - 核心蓝白光芯
 * - 兴奋时猛然膨胀，火星四溅，温度上升
 * - 思考时收缩为精密蓝白色光芯，体积缩到一半
 * - 第一形态：拳头大小的橙色火球（极度疲惫时退回）
 * - 流形族：边缘永远模糊，情绪直接表现为形态变化
 */
export const EMOTIONS = {
  idle: {
    scale: 1.0,
    color: [1.0, 0.42, 0.21],      // warm orange #FF6B35
    coreColor: [0.4, 0.6, 1.0],    // subtle blue-white core (always visible)
    particleDensity: 1.0,
    particleSpeed: 1.0,
    flickerSpeed: 1.0,
    flickerIntensity: 0.35,
    pulseSpeed: 0,
    humanoid: 1.0,                   // full humanoid silhouette
    glowRadius: 0.3,                // warm ambient glow
    description: '安静燃烧 — 人形火焰，边缘跳动'
  },
  excited: {
    scale: 1.5,
    color: [1.0, 0.3, 0.1],         // hotter orange-red
    coreColor: [1.0, 0.9, 0.3],     // bright yellow core
    particleDensity: 3.0,
    particleSpeed: 2.5,
    flickerSpeed: 2.2,
    flickerIntensity: 0.65,
    pulseSpeed: 0,
    humanoid: 0.85,                  // slightly less defined (expanding)
    glowRadius: 0.5,                // bigger warm zone
    description: '猛然膨胀150%，火星四溅，对面的人得后退半步'
  },
  thinking: {
    scale: 0.5,
    color: [0.3, 0.5, 0.9],         // blue dominant
    coreColor: [0.85, 0.9, 1.0],    // pure white core
    particleDensity: 0.2,
    particleSpeed: 0.3,
    flickerSpeed: 0.4,
    flickerIntensity: 0.1,
    pulseSpeed: 0.3,
    humanoid: 0.9,                   // compact but defined
    glowRadius: 0.2,                // tighter glow
    description: '收缩为精密的蓝白色光芯，体积缩到一半'
  },
  happy: {
    scale: 1.15,
    color: [1.0, 0.55, 0.2],        // warm golden orange
    coreColor: [1.0, 0.8, 0.3],     // golden core
    particleDensity: 1.5,
    particleSpeed: 1.8,
    flickerSpeed: 2.5,
    flickerIntensity: 0.5,
    pulseSpeed: 2.0,
    humanoid: 1.0,
    glowRadius: 0.4,                // warm and inviting
    description: '快速跳动，暖橙色脉冲，冬天大家喜欢站你旁边'
  },
  tired: {
    scale: 0.25,
    color: [0.85, 0.4, 0.15],       // dim warm orange
    coreColor: [0.6, 0.35, 0.15],   // dim core
    particleDensity: 0.1,
    particleSpeed: 0.2,
    flickerSpeed: 0.5,
    flickerIntensity: 0.45,
    pulseSpeed: 0,
    humanoid: 0.0,                   // sphere! 第一形态 = 拳头大小的橙色火球
    glowRadius: 0.12,               // tiny warm spot
    description: '退回第一形态 — 拳头大小的橙色火球，在角落安静地烧着'
  },
  sarcastic: {
    scale: 1.0,
    color: [1.0, 0.4, 0.15],        // orange
    coreColor: [1.0, 0.6, 0.1],     // warm core
    particleDensity: 2.5,
    particleSpeed: 3.5,
    flickerSpeed: 1.3,
    flickerIntensity: 0.35,
    pulseSpeed: 0,
    humanoid: 1.0,
    glowRadius: 0.3,
    burstOnStart: true,              // burst sparks on emotion start
    description: '顶部喷出一串小火星 — 藏不住的吐槽'
  }
};

/**
 * Smoothly interpolate between two emotion states
 */
export function lerpEmotion(from, to, t) {
  const result = {};
  const ease = t * t * (3 - 2 * t); // smoothstep
  
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
