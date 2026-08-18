import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildGroundFrame, buildBodyFrame, buildEulerAxisHelper } from './frames.js';
import { initUI } from './ui.js';

let scene, camera, renderer, controls;
let viewportElem;
let groundFrameGroup, bodyFrameGroup, eulerAxisGroup;

const tempMatrix4 = new THREE.Matrix4();

/**
 * Applies the 3x3 rotation matrix R and translation offset (tx, ty, tz)
 * to the Body Frame Three.js group.
 *
 * @param {number[][]} R - 3x3 rotation matrix in row-major order
 * @param {{ x: number, y: number, z: number }} translation - Origin offset
 * @param {{ l: number, m: number, n: number }} axisVector - Principal rotation axis (l, m, n)
 * @param {number} thetaDeg - Principal rotation angle in degrees
 * @param {boolean} showAxis - Whether the principal rotation axis is visible
 */
export function applyToBodyFrame(R, translation = { x: 0, y: 0, z: 0 }, axisVector = null, thetaDeg = 0, showAxis = true) {
  if (!bodyFrameGroup) return;

  // 1. Apply 3x3 Rotation to Body Frame
  tempMatrix4.set(
    R[0][0], R[0][1], R[0][2], 0,
    R[1][0], R[1][1], R[1][2], 0,
    R[2][0], R[2][1], R[2][2], 0,
    0,       0,       0,       1
  );
  bodyFrameGroup.quaternion.setFromRotationMatrix(tempMatrix4);

  // 2. Apply Origin Translation
  bodyFrameGroup.position.set(translation.x, translation.y, translation.z);

  // 3. Update Euler Rotation Axis Helper
  if (eulerAxisGroup) {
    if (showAxis && Math.abs(thetaDeg) > 0.5 && axisVector) {
      eulerAxisGroup.visible = true;
      const dir = new THREE.Vector3(axisVector.l, axisVector.m, axisVector.n);
      if (dir.lengthSq() > 1e-4) {
        dir.normalize();
        const arrow = eulerAxisGroup.getObjectByName('eulerArrow');
        const label = eulerAxisGroup.getObjectByName('eulerLabel');
        if (arrow) arrow.setDirection(dir);
        if (label) label.position.copy(dir.clone().multiplyScalar(4.4));
      }
    } else {
      eulerAxisGroup.visible = false;
    }
  }
}

/**
 * Handles viewport resize to keep aspect ratio and canvas dimensions sharp.
 */
function handleResize() {
  if (!viewportElem || !renderer || !camera) return;

  const width = viewportElem.clientWidth;
  const height = viewportElem.clientHeight;

  if (width === 0 || height === 0) return;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

/**
 * Initializes the Three.js scene, camera, lighting, and coordinate frames.
 */
function initScene() {
  viewportElem = document.getElementById('viewport');
  if (!viewportElem) {
    console.error('Viewport element #viewport not found');
    return;
  }

  // 1. Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f1117);

  // 2. Camera
  const aspect = (viewportElem.clientWidth || 1) / (viewportElem.clientHeight || 1);
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  camera.position.set(6.2, 5.0, 7.5);

  // 3. Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(viewportElem.clientWidth, viewportElem.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  viewportElem.appendChild(renderer.domElement);

  // 4. OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 2.0;
  controls.maxDistance = 50.0;
  controls.target.set(0, 0, 0);

  // 5. Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(10, 15, 10);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x90a4ae, 0.7);
  fillLight.position.set(-10, -5, -10);
  scene.add(fillLight);

  // 6. Spatial Reference: Grid
  const gridHelper = new THREE.GridHelper(16, 32, 0x2e3440, 0x1a1e27);
  gridHelper.position.y = -0.01;
  scene.add(gridHelper);

  // 7. Coordinate Frames
  groundFrameGroup = buildGroundFrame();
  scene.add(groundFrameGroup);

  bodyFrameGroup = buildBodyFrame();
  scene.add(bodyFrameGroup);

  eulerAxisGroup = buildEulerAxisHelper();
  scene.add(eulerAxisGroup);

  // 8. Resize Observer
  const resizeObserver = new ResizeObserver(() => {
    handleResize();
  });
  resizeObserver.observe(viewportElem);
  window.addEventListener('resize', handleResize);

  // 9. Initialize UI controls & bind rotation callback
  initUI(applyToBodyFrame);

  // 10. Start Animation Loop
  animate();
}

/**
 * Animation and rendering loop.
 */
function animate() {
  requestAnimationFrame(animate);

  if (controls) {
    controls.update();
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Ensure DOM is ready before initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScene);
} else {
  initScene();
}
