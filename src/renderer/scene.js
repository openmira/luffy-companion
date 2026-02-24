import * as THREE from 'three';
import { fireVertexShader, fireFragmentShader } from './fire/shaders.js';
import { SparkParticles } from './fire/particles.js';
import { EMOTIONS, lerpEmotion } from './fire/emotions.js';

/**
 * Main 3D scene: fire spirit Luffy
 */
export class LuffyScene {
  constructor(container) {
    this.container = container;
    this.clock = new THREE.Clock();
    this.currentEmotion = 'idle';
    this.targetEmotion = 'idle';
    this.emotionTransition = 1.0;
    this.emotionParams = { ...EMOTIONS.idle };
    this.audioLevel = 0;
    
    this._initScene();
    this._initFire();
    this._initParticles();
    this._initLighting();
    this._bindEvents();
    this._animate();
  }
  
  _initScene() {
    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(
      50, 
      window.innerWidth / window.innerHeight,
      0.1, 
      100
    );
    this.camera.position.set(0, 0.5, 2.5);
    this.camera.lookAt(0, 0.5, 0);
    
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true, // for transparent background (desktop pet mode)
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0a0a0a, 1);
    this.container.appendChild(this.renderer.domElement);
  }
  
  _initFire() {
    // Fire plane with custom shader
    const geometry = new THREE.PlaneGeometry(1.2, 2.0, 1, 1);
    
    this.fireUniforms = {
      uTime: { value: 0 },
      uScale: { value: 1.0 },
      uColor: { value: new THREE.Vector3(1.0, 0.42, 0.21) },
      uCoreColor: { value: new THREE.Vector3(0.4, 0.6, 1.0) },
      uFlickerSpeed: { value: 1.0 },
      uFlickerIntensity: { value: 0.35 },
      uPulseSpeed: { value: 0.0 },
      uAudioLevel: { value: 0.0 },
      uHumanoid: { value: 1.0 },
      uGlowRadius: { value: 0.3 },
    };
    
    const material = new THREE.ShaderMaterial({
      vertexShader: fireVertexShader,
      fragmentShader: fireFragmentShader,
      uniforms: this.fireUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    
    this.fireMesh = new THREE.Mesh(geometry, material);
    this.fireMesh.position.set(0, 0.5, 0);
    this.scene.add(this.fireMesh);
  }
  
  _initParticles() {
    this.sparks = new SparkParticles(80);
    this.sparks.mesh.position.set(0, 0.3, 0);
    this.scene.add(this.sparks.mesh);
  }
  
  _initLighting() {
    // Fire glow light
    this.fireLight = new THREE.PointLight(0xff6b35, 2, 5);
    this.fireLight.position.set(0, 0.5, 0.5);
    this.scene.add(this.fireLight);
    
    // Subtle ambient
    const ambient = new THREE.AmbientLight(0x111111);
    this.scene.add(ambient);
  }
  
  _bindEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
  
  /**
   * Set emotion with smooth transition
   */
  setEmotion(emotion) {
    if (!EMOTIONS[emotion] || emotion === this.targetEmotion) return;
    
    this.currentEmotion = this.targetEmotion;
    this.targetEmotion = emotion;
    this.emotionTransition = 0;
    
    // Burst effect for sarcastic
    if (EMOTIONS[emotion].burstOnStart) {
      this.sparks.burst(30);
    }
  }
  
  /**
   * Set audio level (0-1) for speech-driven animation
   */
  setAudioLevel(level) {
    this.audioLevel = Math.max(0, Math.min(1, level));
  }
  
  _updateEmotionParams(dt) {
    if (this.emotionTransition < 1.0) {
      this.emotionTransition = Math.min(1.0, this.emotionTransition + dt * 1.5);
      const from = EMOTIONS[this.currentEmotion];
      const to = EMOTIONS[this.targetEmotion];
      this.emotionParams = lerpEmotion(from, to, this.emotionTransition);
    }
  }
  
  _animate() {
    const dt = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();
    
    // Update emotion interpolation
    this._updateEmotionParams(dt);
    const p = this.emotionParams;
    
    // Update fire shader uniforms
    this.fireUniforms.uTime.value = elapsed;
    this.fireUniforms.uScale.value = p.scale;
    this.fireUniforms.uColor.value.set(p.color[0], p.color[1], p.color[2]);
    this.fireUniforms.uCoreColor.value.set(p.coreColor[0], p.coreColor[1], p.coreColor[2]);
    this.fireUniforms.uFlickerSpeed.value = p.flickerSpeed;
    this.fireUniforms.uFlickerIntensity.value = p.flickerIntensity;
    this.fireUniforms.uPulseSpeed.value = p.pulseSpeed;
    this.fireUniforms.uAudioLevel.value = this.audioLevel;
    this.fireUniforms.uHumanoid.value = p.humanoid ?? 1.0;
    this.fireUniforms.uGlowRadius.value = p.glowRadius ?? 0.3;
    
    // Scale the fire mesh
    this.fireMesh.scale.set(p.scale, p.scale, 1);
    
    // Update fire light intensity/color based on emotion
    this.fireLight.intensity = 1 + p.scale;
    this.fireLight.color.setRGB(p.color[0], p.color[1] * 0.5, p.color[2] * 0.3);
    
    // Update particles
    this.sparks.update(dt, {
      particleDensity: p.particleDensity,
      particleSpeed: p.particleSpeed,
    });
    this.sparks.mesh.scale.set(p.scale, p.scale, 1);
    
    // Render
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this._animate());
  }
  
  dispose() {
    this.renderer.dispose();
    this.sparks.dispose();
  }
}
