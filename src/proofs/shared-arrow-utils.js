import * as THREE from 'three';
import { createTextSprite } from '../frames.js';

/**
 * Creates a standard solid ArrowHelper with clean aesthetics.
 * @param {THREE.Vector3} dir - Direction vector (will be normalized)
 * @param {THREE.Vector3} origin - Origin vector
 * @param {number} length - Arrow length
 * @param {number|string} colorHex - Color hex
 * @param {number} headLength - Cone length
 * @param {number} headWidth - Cone width
 * @returns {THREE.ArrowHelper}
 */
export function createVectorArrow(
  dir,
  origin = new THREE.Vector3(0, 0, 0),
  length = 3.0,
  colorHex = 0x00e5ff,
  headLength = 0.5,
  headWidth = 0.25
) {
  const normDir = dir.lengthSq() > 1e-6 ? dir.clone().normalize() : new THREE.Vector3(0, 1, 0);
  const arrow = new THREE.ArrowHelper(normDir, origin, length, colorHex, headLength, headWidth);

  if (arrow.line && arrow.line.material) {
    arrow.line.material.linewidth = 3;
  }
  if (arrow.cone && arrow.cone.material) {
    arrow.cone.material.roughness = 0.3;
    arrow.cone.material.metalness = 0.2;
  }

  return arrow;
}

/**
 * Creates a ghost copy of an arrow with low opacity (0.25).
 * @param {THREE.Vector3} dir - Direction vector
 * @param {number} length - Arrow length
 * @param {number|string} colorHex - Color hex
 * @returns {THREE.ArrowHelper}
 */
export function createGhostArrow(dir, length = 3.0, colorHex = 0x888888) {
  const normDir = dir.lengthSq() > 1e-6 ? dir.clone().normalize() : new THREE.Vector3(0, 1, 0);
  const arrow = new THREE.ArrowHelper(
    normDir,
    new THREE.Vector3(0, 0, 0),
    length,
    colorHex,
    0.45,
    0.22
  );

  if (arrow.line && arrow.line.material) {
    arrow.line.material.transparent = true;
    arrow.line.material.opacity = 0.25;
    arrow.line.material.depthWrite = false;
  }
  if (arrow.cone && arrow.cone.material) {
    arrow.cone.material.transparent = true;
    arrow.cone.material.opacity = 0.25;
    arrow.cone.material.depthWrite = false;
  }

  return arrow;
}

/**
 * Creates a glowing/emissive arrow (e.g. for cross product vector).
 * @param {THREE.Vector3} dir
 * @param {number} length
 * @param {number|string} colorHex - Default yellow #ffee00
 * @returns {THREE.Group}
 */
export function createGlowingVectorArrow(dir, length = 3.0, colorHex = 0xffee00) {
  const group = new THREE.Group();
  const normDir = dir.lengthSq() > 1e-6 ? dir.clone().normalize() : new THREE.Vector3(0, 1, 0);

  const arrow = new THREE.ArrowHelper(
    normDir,
    new THREE.Vector3(0, 0, 0),
    length,
    colorHex,
    0.6,
    0.3
  );

  if (arrow.cone && arrow.cone.material) {
    arrow.cone.material.emissive = new THREE.Color(colorHex);
    arrow.cone.material.emissiveIntensity = 0.6;
    arrow.cone.material.roughness = 0.1;
  }
  group.add(arrow);

  // Tip point light for subtle 3D glow effect
  const tipLight = new THREE.PointLight(colorHex, 1.2, 3.0);
  tipLight.position.copy(normDir.clone().multiplyScalar(length));
  group.add(tipLight);

  group.userData = { arrow, tipLight };
  return group;
}

/**
 * Creates an outline / wireframe overlay arrow (e.g. for RHS cross product R(v) x R(w)).
 * @param {THREE.Vector3} dir
 * @param {number} length
 * @param {number|string} colorHex - Default orange #ff8800
 * @returns {THREE.ArrowHelper}
 */
export function createOutlineVectorArrow(dir, length = 3.0, colorHex = 0xff8800) {
  const normDir = dir.lengthSq() > 1e-6 ? dir.clone().normalize() : new THREE.Vector3(0, 1, 0);
  const arrow = new THREE.ArrowHelper(
    normDir,
    new THREE.Vector3(0, 0, 0),
    length,
    colorHex,
    0.65,
    0.34
  );

  if (arrow.cone && arrow.cone.material) {
    arrow.cone.material.wireframe = true;
    arrow.cone.material.transparent = true;
    arrow.cone.material.opacity = 0.85;
  }

  return arrow;
}

/**
 * Updates an arrow helper's direction and length dynamically.
 * @param {THREE.ArrowHelper} arrow
 * @param {THREE.Vector3} vec
 */
export function updateArrowFromVector(arrow, vec) {
  if (!arrow) return;
  const len = vec.length();
  if (len > 1e-5) {
    arrow.setDirection(vec.clone().normalize());
    arrow.setLength(len, Math.min(0.6, len * 0.25), Math.min(0.3, len * 0.15));
    arrow.visible = true;
  } else {
    arrow.visible = false;
  }
}

export { createTextSprite };
