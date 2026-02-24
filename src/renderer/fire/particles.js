import * as THREE from 'three';

/**
 * Spark/ember particle system for the fire
 * Round particles with glow trail, float upward and fade
 */

// Generate a soft circle texture for round particles
function createSparkTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.2, 'rgba(255, 200, 100, 0.9)');
  gradient.addColorStop(0.5, 'rgba(255, 120, 40, 0.4)');
  gradient.addColorStop(1.0, 'rgba(255, 60, 10, 0.0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export class SparkParticles {
  constructor(count = 80) {
    this.count = count;
    this.velocities = [];
    this.lifetimes = [];
    this.ages = [];
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      this._resetParticle(i, positions, sizes, colors);
      this.ages[i] = Math.random() * this.lifetimes[i]; // stagger
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    this.sparkTexture = createSparkTexture();
    
    const material = new THREE.PointsMaterial({
      size: 0.06,
      map: this.sparkTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    
    this.mesh = new THREE.Points(geometry, material);
    this.geometry = geometry;
    this.material = material;
  }
  
  _resetParticle(i, positions, sizes, colors) {
    const i3 = i * 3;
    
    // Start near the fire center, biased upward
    positions[i3] = (Math.random() - 0.5) * 0.25;
    positions[i3 + 1] = 0.2 + Math.random() * 0.6;
    positions[i3 + 2] = (Math.random() - 0.5) * 0.08;
    
    sizes[i] = Math.random() * 0.04 + 0.015;
    
    // Orange to yellow sparks
    colors[i3] = 1.0;
    colors[i3 + 1] = 0.35 + Math.random() * 0.5;
    colors[i3 + 2] = Math.random() * 0.15;
    
    this.velocities[i] = {
      x: (Math.random() - 0.5) * 0.4,
      y: 0.6 + Math.random() * 1.8,
      z: (Math.random() - 0.5) * 0.2,
    };
    
    this.lifetimes[i] = 0.5 + Math.random() * 1.5;
    this.ages[i] = 0;
  }
  
  update(dt, params = {}) {
    const { particleDensity = 1, particleSpeed = 1 } = params;
    
    const positions = this.geometry.attributes.position.array;
    const sizes = this.geometry.attributes.size.array;
    const colors = this.geometry.attributes.color.array;
    
    for (let i = 0; i < this.count; i++) {
      this.ages[i] += dt;
      
      // Skip particles beyond density threshold
      if (i >= this.count * Math.min(particleDensity, 1)) {
        sizes[i] = 0;
        continue;
      }
      
      if (this.ages[i] >= this.lifetimes[i]) {
        this._resetParticle(i, positions, sizes, colors);
        continue;
      }
      
      const life = this.ages[i] / this.lifetimes[i];
      const i3 = i * 3;
      
      // Move upward with drift + slight deceleration
      const speedFade = 1.0 - life * 0.3;
      positions[i3] += this.velocities[i].x * dt * particleSpeed * speedFade;
      positions[i3 + 1] += this.velocities[i].y * dt * particleSpeed * speedFade;
      positions[i3 + 2] += this.velocities[i].z * dt * particleSpeed * speedFade;
      
      // Add gentle sway
      positions[i3] += Math.sin(this.ages[i] * 3.0 + i) * dt * 0.1;
      
      // Size: grow slightly then shrink
      const sizeLife = life < 0.2 ? life / 0.2 : 1.0 - (life - 0.2) / 0.8;
      sizes[i] = (0.02 + Math.random() * 0.015) * sizeLife;
      
      // Color shift: bright orange → red → dim
      const alpha = 1.0 - life * life; // quadratic fade
      colors[i3] = alpha;
      colors[i3 + 1] = 0.4 * alpha * alpha;
      colors[i3 + 2] = 0.08 * alpha * alpha * alpha;
    }
    
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }
  
  /**
   * Burst effect: emit a bunch of sparks at once
   */
  burst(count = 25) {
    const positions = this.geometry.attributes.position.array;
    const sizes = this.geometry.attributes.size.array;
    const colors = this.geometry.attributes.color.array;
    
    for (let i = 0; i < Math.min(count, this.count); i++) {
      this._resetParticle(i, positions, sizes, colors);
      this.velocities[i].y *= 3;
      this.velocities[i].x *= 2.5;
      this.ages[i] = 0;
    }
  }
  
  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.sparkTexture.dispose();
  }
}
