import * as THREE from 'three';

/**
 * Spark/ember particle system for the fire
 * Particles float upward and fade out
 */
export class SparkParticles {
  constructor(count = 50) {
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
      this.ages[i] = Math.random() * this.lifetimes[i]; // stagger initial ages
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
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
    
    // Start near the fire center
    positions[i3] = (Math.random() - 0.5) * 0.3;
    positions[i3 + 1] = Math.random() * 0.5;
    positions[i3 + 2] = (Math.random() - 0.5) * 0.1;
    
    sizes[i] = Math.random() * 0.03 + 0.01;
    
    // Orange to yellow sparks
    colors[i3] = 1.0;
    colors[i3 + 1] = 0.3 + Math.random() * 0.5;
    colors[i3 + 2] = Math.random() * 0.2;
    
    this.velocities[i] = {
      x: (Math.random() - 0.5) * 0.5,
      y: 0.5 + Math.random() * 1.5,
      z: (Math.random() - 0.5) * 0.3,
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
      
      // Move upward with some drift
      positions[i3] += this.velocities[i].x * dt * particleSpeed;
      positions[i3 + 1] += this.velocities[i].y * dt * particleSpeed;
      positions[i3 + 2] += this.velocities[i].z * dt * particleSpeed;
      
      // Fade out
      const alpha = 1.0 - life;
      sizes[i] = (0.01 + Math.random() * 0.02) * alpha;
      
      // Color shift: orange → red → dim
      colors[i3] = alpha;
      colors[i3 + 1] = 0.3 * alpha * alpha;
      colors[i3 + 2] = 0.05 * alpha * alpha * alpha;
    }
    
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }
  
  /**
   * Burst effect: emit a bunch of sparks at once (for sarcastic emotion)
   */
  burst(count = 20) {
    const positions = this.geometry.attributes.position.array;
    const sizes = this.geometry.attributes.size.array;
    const colors = this.geometry.attributes.color.array;
    
    for (let i = 0; i < Math.min(count, this.count); i++) {
      this._resetParticle(i, positions, sizes, colors);
      this.velocities[i].y *= 3; // extra upward boost
      this.velocities[i].x *= 2;
      this.ages[i] = 0;
    }
  }
  
  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
