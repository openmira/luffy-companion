import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { fireVertexShader, fireFragmentShader, hatVertexShader, hatFragmentShader } from './fire/shaders.js';
import { SparkParticles } from './fire/particles.js';
import { EMOTIONS, lerpEmotion } from './fire/emotions.js';
import { createHumanoidGeometry, createStrawHatGeometry } from './humanoid.js';

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
    this._initPostProcessing();
    this._initFireBody();
    this._initStrawHat();
    this._initCoreGlow();
    this._initParticles();
    this._initLighting();
    this._bindEvents();
    this._animate();
  }
  
  _initScene() {
    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 0.9, 3.0);
    this.camera.lookAt(0, 0.8, 0);
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x050505, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);
  }
  
  _initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Bloom — the key to making fire glow
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.2,   // strength
      0.4,   // radius
      0.3    // threshold (low = more bloom)
    );
    this.composer.addPass(this.bloomPass);
    
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }
  
  _initFireBody() {
    // Humanoid geometry
    this.humanoidGeom = createHumanoidGeometry();
    
    // Sphere geometry for tired/first-form morph
    this.sphereGeom = new THREE.SphereGeometry(0.15, 24, 18);
    this.sphereGeom.translate(0, 0.6, 0);
    this.sphereGeom.computeVertexNormals();
    
    // Store original positions for morphing
    this.humanoidPositions = new Float32Array(this.humanoidGeom.attributes.position.array);
    this.humanoidNormals = new Float32Array(this.humanoidGeom.attributes.normal.array);
    
    this.fireUniforms = {
      uTime: { value: 0 },
      uScale: { value: 1.0 },
      uColor: { value: new THREE.Vector3(1.0, 0.42, 0.21) },
      uCoreColor: { value: new THREE.Vector3(0.4, 0.6, 1.0) },
      uFlickerSpeed: { value: 1.0 },
      uFlickerIntensity: { value: 0.3 },
      uDisplaceStrength: { value: 0.06 },
      uCoreIntensity: { value: 0.6 },
      uAudioLevel: { value: 0.0 },
      uEdgeGlow: { value: 0.5 },
    };
    
    const fireMaterial = new THREE.ShaderMaterial({
      vertexShader: fireVertexShader,
      fragmentShader: fireFragmentShader,
      uniforms: this.fireUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    
    this.fireBody = new THREE.Mesh(this.humanoidGeom, fireMaterial);
    this.scene.add(this.fireBody);
    
    // Second layer: slightly larger, more transparent = outer flame haze
    const outerGeom = this.humanoidGeom.clone();
    const outerUniforms = {
      ...Object.fromEntries(
        Object.entries(this.fireUniforms).map(([k, v]) => [k, v])
      ),
      uDisplaceStrength: { value: 0.12 },
      uEdgeGlow: { value: 1.0 },
    };
    
    const outerMaterial = new THREE.ShaderMaterial({
      vertexShader: fireVertexShader,
      fragmentShader: fireFragmentShader,
      uniforms: outerUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    outerMaterial.uniforms.uFlickerIntensity = { value: 0.5 };
    
    this.outerFlame = new THREE.Mesh(outerGeom, outerMaterial);
    this.outerFlame.scale.set(1.08, 1.05, 1.08);
    this.scene.add(this.outerFlame);
    
    this.outerUniforms = outerUniforms;
  }
  
  _initStrawHat() {
    const hatGeom = createStrawHatGeometry();
    
    this.hatUniforms = {
      uHatColor: { value: new THREE.Vector3(0.85, 0.72, 0.45) }, // warm straw
      uFireLight: { value: 1.0 },
    };
    
    const hatMaterial = new THREE.ShaderMaterial({
      vertexShader: hatVertexShader,
      fragmentShader: hatFragmentShader,
      uniforms: this.hatUniforms,
    });
    
    this.hat = new THREE.Mesh(hatGeom, hatMaterial);
    this.hat.position.set(0, 1.55, 0); // on top of head
    this.scene.add(this.hat);
  }
  
  _initCoreGlow() {
    // Inner blue-white core sphere (chest area)
    const coreGeom = new THREE.SphereGeometry(0.08, 16, 12);
    const coreMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.4, 0.6, 1.0),
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    this.core = new THREE.Mesh(coreGeom, coreMat);
    this.core.position.set(0, 0.9, 0.05);
    this.scene.add(this.core);
    
    // Core point light
    this.coreLight = new THREE.PointLight(0x6699ff, 1.5, 2);
    this.coreLight.position.copy(this.core.position);
    this.scene.add(this.coreLight);
  }
  
  _initParticles() {
    this.sparks = new SparkParticles(120);
    this.sparks.mesh.position.set(0, 0.0, 0);
    this.scene.add(this.sparks.mesh);
  }
  
  _initLighting() {
    // Main fire glow
    this.fireLight = new THREE.PointLight(0xff6b35, 3, 8);
    this.fireLight.position.set(0, 0.8, 1.0);
    this.scene.add(this.fireLight);
    
    // Subtle rim light from behind
    const rimLight = new THREE.PointLight(0xff4400, 1, 4);
    rimLight.position.set(0, 1.0, -1.0);
    this.scene.add(rimLight);
    
    // Subtle ambient
    const ambient = new THREE.AmbientLight(0x0a0a0a);
    this.scene.add(ambient);
  }
  
  _bindEvents() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.composer.setSize(w, h);
      this.bloomPass.resolution.set(w, h);
    });
  }
  
  setEmotion(emotion) {
    if (!EMOTIONS[emotion] || emotion === this.targetEmotion) return;
    
    this.currentEmotion = this.targetEmotion;
    this.targetEmotion = emotion;
    this.emotionTransition = 0;
    
    if (EMOTIONS[emotion].burstOnStart) {
      this.sparks.burst(40);
    }
  }
  
  setAudioLevel(level) {
    this.audioLevel = Math.max(0, Math.min(1, level));
  }
  
  _updateEmotionParams(dt) {
    if (this.emotionTransition < 1.0) {
      this.emotionTransition = Math.min(1.0, this.emotionTransition + dt * 1.2);
      const from = EMOTIONS[this.currentEmotion];
      const to = EMOTIONS[this.targetEmotion];
      this.emotionParams = lerpEmotion(from, to, this.emotionTransition);
    }
  }
  
  _animate() {
    const dt = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();
    
    this._updateEmotionParams(dt);
    const p = this.emotionParams;
    
    // Update fire uniforms
    this.fireUniforms.uTime.value = elapsed;
    this.fireUniforms.uScale.value = p.scale;
    this.fireUniforms.uColor.value.set(p.color[0], p.color[1], p.color[2]);
    this.fireUniforms.uCoreColor.value.set(p.coreColor[0], p.coreColor[1], p.coreColor[2]);
    this.fireUniforms.uFlickerSpeed.value = p.flickerSpeed;
    this.fireUniforms.uFlickerIntensity.value = p.flickerIntensity;
    this.fireUniforms.uDisplaceStrength.value = p.displaceStrength;
    this.fireUniforms.uCoreIntensity.value = p.coreIntensity;
    this.fireUniforms.uAudioLevel.value = this.audioLevel;
    this.fireUniforms.uEdgeGlow.value = p.edgeGlow;
    
    // Outer flame follows inner but with more displacement
    this.outerUniforms.uTime.value = elapsed;
    this.outerUniforms.uColor.value = this.fireUniforms.uColor.value;
    this.outerUniforms.uCoreColor.value = this.fireUniforms.uCoreColor.value;
    this.outerUniforms.uFlickerSpeed.value = p.flickerSpeed;
    this.outerUniforms.uDisplaceStrength.value = p.displaceStrength * 1.8;
    this.outerUniforms.uCoreIntensity.value = p.coreIntensity * 0.3;
    this.outerUniforms.uAudioLevel.value = this.audioLevel;
    
    // Scale the body
    const s = p.scale;
    this.fireBody.scale.set(s, s, s);
    this.outerFlame.scale.set(s * 1.08, s * 1.05, s * 1.08);
    
    // Hat position: follows head, with float offset
    const hatBaseY = 1.55 * s;
    const hatFloat = p.hatFloat ?? 0;
    const hatBob = Math.sin(elapsed * 1.5) * 0.01; // gentle bob
    this.hat.position.y = hatBaseY + hatFloat + hatBob;
    this.hat.scale.set(s * 0.9, s * 0.9, s * 0.9);
    this.hat.visible = hatFloat > -0.3; // hide hat when it "falls off" (tired)
    
    // Core glow
    const coreY = 0.9 * s;
    this.core.position.y = coreY;
    this.core.material.color.set(p.coreColor[0], p.coreColor[1], p.coreColor[2]);
    this.core.material.opacity = 0.3 + p.coreIntensity * 0.5;
    const corePulse = 1.0 + Math.sin(elapsed * 3.0) * 0.1;
    this.core.scale.setScalar(s * corePulse);
    this.coreLight.position.y = coreY;
    this.coreLight.intensity = p.coreIntensity * 2.0;
    this.coreLight.color.set(p.coreColor[0], p.coreColor[1], p.coreColor[2]);
    
    // Fire light
    this.fireLight.intensity = 2 + s * 2;
    this.fireLight.color.setRGB(p.color[0], p.color[1] * 0.6, p.color[2] * 0.3);
    
    // Bloom strength tracks emotion
    this.bloomPass.strength = p.bloomStrength ?? 1.2;
    
    // Particles
    this.sparks.update(dt, {
      particleDensity: p.particleDensity,
      particleSpeed: p.particleSpeed,
    });
    this.sparks.mesh.scale.set(s, s, s);
    
    // Render with post-processing
    this.composer.render();
    requestAnimationFrame(() => this._animate());
  }
  
  dispose() {
    this.renderer.dispose();
    this.sparks.dispose();
  }
}
