/**
 * Procedural humanoid mesh for fire spirit
 * Low-poly on purpose — vertex displacement will make it organic
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Create a rough humanoid shape from merged primitives
 * @returns {THREE.BufferGeometry} merged geometry
 */
export function createHumanoidGeometry() {
  const parts = [];
  
  // Head — sphere
  const head = new THREE.SphereGeometry(0.14, 16, 12);
  head.translate(0, 1.55, 0);
  parts.push(head);
  
  // Neck — small cylinder
  const neck = new THREE.CylinderGeometry(0.06, 0.08, 0.12, 8);
  neck.translate(0, 1.38, 0);
  parts.push(neck);
  
  // Torso — tapered capsule-like shape (upper body wider)
  const upperTorso = new THREE.CylinderGeometry(0.18, 0.22, 0.35, 12);
  upperTorso.translate(0, 1.15, 0);
  parts.push(upperTorso);
  
  const lowerTorso = new THREE.CylinderGeometry(0.22, 0.16, 0.3, 12);
  lowerTorso.translate(0, 0.83, 0);
  parts.push(lowerTorso);
  
  // Hips
  const hips = new THREE.CylinderGeometry(0.16, 0.14, 0.15, 10);
  hips.translate(0, 0.6, 0);
  parts.push(hips);
  
  // Shoulders — small spheres for smooth connection
  const shoulderL = new THREE.SphereGeometry(0.09, 8, 8);
  shoulderL.translate(-0.26, 1.22, 0);
  parts.push(shoulderL);
  
  const shoulderR = new THREE.SphereGeometry(0.09, 8, 8);
  shoulderR.translate(0.26, 1.22, 0);
  parts.push(shoulderR);
  
  // Upper arms
  const upperArmL = new THREE.CylinderGeometry(0.055, 0.05, 0.3, 8);
  upperArmL.rotateZ(0.15);
  upperArmL.translate(-0.3, 1.0, 0);
  parts.push(upperArmL);
  
  const upperArmR = new THREE.CylinderGeometry(0.055, 0.05, 0.3, 8);
  upperArmR.rotateZ(-0.15);
  upperArmR.translate(0.3, 1.0, 0);
  parts.push(upperArmR);
  
  // Lower arms
  const lowerArmL = new THREE.CylinderGeometry(0.045, 0.04, 0.28, 8);
  lowerArmL.rotateZ(0.1);
  lowerArmL.translate(-0.33, 0.72, 0);
  parts.push(lowerArmL);
  
  const lowerArmR = new THREE.CylinderGeometry(0.045, 0.04, 0.28, 8);
  lowerArmR.rotateZ(-0.1);
  lowerArmR.translate(0.33, 0.72, 0);
  parts.push(lowerArmR);
  
  // Hands — small spheres
  const handL = new THREE.SphereGeometry(0.045, 8, 6);
  handL.translate(-0.34, 0.56, 0);
  parts.push(handL);
  
  const handR = new THREE.SphereGeometry(0.045, 8, 6);
  handR.translate(0.34, 0.56, 0);
  parts.push(handR);
  
  // Upper legs
  const legL = new THREE.CylinderGeometry(0.07, 0.06, 0.38, 8);
  legL.translate(-0.1, 0.34, 0);
  parts.push(legL);
  
  const legR = new THREE.CylinderGeometry(0.07, 0.06, 0.38, 8);
  legR.translate(0.1, 0.34, 0);
  parts.push(legR);
  
  // Lower legs  
  const lowerLegL = new THREE.CylinderGeometry(0.055, 0.045, 0.35, 8);
  lowerLegL.translate(-0.1, 0.0, 0);
  parts.push(lowerLegL);
  
  const lowerLegR = new THREE.CylinderGeometry(0.055, 0.045, 0.35, 8);
  lowerLegR.translate(0.1, 0.0, 0);
  parts.push(lowerLegR);
  
  // Merge all
  const merged = mergeGeometries(parts, false);
  
  // Center vertically so feet are near y=0
  merged.translate(0, -0.15, 0);
  
  // Compute normals for displacement
  merged.computeVertexNormals();
  
  return merged;
}

/**
 * Create straw hat geometry (torus brim + flat cylinder crown)
 */
export function createStrawHatGeometry() {
  const parts = [];
  
  // Brim — flattened torus
  const brim = new THREE.TorusGeometry(0.2, 0.04, 8, 24);
  brim.rotateX(Math.PI / 2);
  parts.push(brim);
  
  // Crown — short cylinder  
  const crown = new THREE.CylinderGeometry(0.12, 0.13, 0.1, 16);
  crown.translate(0, 0.05, 0);
  parts.push(crown);
  
  // Top — flat disc
  const top = new THREE.CircleGeometry(0.12, 16);
  top.rotateX(-Math.PI / 2);
  top.translate(0, 0.1, 0);
  parts.push(top);
  
  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  return merged;
}
