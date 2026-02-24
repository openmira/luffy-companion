import { LuffyScene } from './renderer/scene.js';

// Initialize scene
const container = document.getElementById('app');
const luffy = new LuffyScene(container);

// Emotion button controls
const buttons = document.querySelectorAll('.emotion-btn');
buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const emotion = btn.dataset.emotion;
    luffy.setEmotion(emotion);
    
    // Update active state
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Keyboard shortcuts for emotions
document.addEventListener('keydown', (e) => {
  const map = {
    '1': 'idle',
    '2': 'excited',
    '3': 'thinking',
    '4': 'happy',
    '5': 'tired',
    '6': 'sarcastic',
  };
  if (map[e.key]) {
    luffy.setEmotion(map[e.key]);
    buttons.forEach(b => {
      b.classList.toggle('active', b.dataset.emotion === map[e.key]);
    });
  }
});

// Simulate audio level with mouse Y position (for testing)
document.addEventListener('mousemove', (e) => {
  const level = 1.0 - (e.clientY / window.innerHeight);
  luffy.setAudioLevel(level * 0.5);
});

console.log('🔥 Luffy Companion v0.1 — Phase 1 Fire Shader Demo');
console.log('Press 1-6 or click buttons to switch emotions');
