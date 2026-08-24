import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { computeR } from '../rotation.js';
import {
  createVectorArrow,
  createGhostArrow,
  createGlowingVectorArrow,
  createOutlineVectorArrow,
  createTextSprite,
  updateArrowFromVector
} from './shared-arrow-utils.js';

let scene, camera, renderer, controls;
let viewportElem;
let isRunning = false;
let animFrameId = null;

// Vectors state
let vBase = new THREE.Vector3(1.8, 1.2, 0.0);
let wBase = new THREE.Vector3(0.0, 1.5, 1.8);
let crossBase = new THREE.Vector3();

// 3D Objects
let liveVArrow, liveWArrow;
let ghostVArrow, ghostWArrow, ghostCrossArrow;
let liveLHSGroup, liveRHSOutlineArrow;
let labelV, labelW, labelLHS;

// Animation State
let isAnimating = false;
let animStartTime = 0;
const ANIM_DURATION = 1200; // ms
let qStart = new THREE.Quaternion();
let qTarget = new THREE.Quaternion();
let currentQuaternion = new THREE.Quaternion();

// DOM elements
let vxInput, vyInput, vzInput;
let wxInput, wyInput, wzInput;
let yawSlider, pitchSlider, rollSlider;
let yawNum, pitchNum, rollNum;
let animateBtn, resetBtn;
let readoutCross0, readoutLHS, readoutRHS, readoutBadge;

/**
 * Cubic ease-in-out curve for smooth kinematics transitions.
 * @param {number} t - Progress in [0, 1]
 * @returns {number} Eased progress
 */
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Reads vector input fields into vBase and wBase.
 */
function readVectorInputs() {
  const vx = parseFloat(vxInput?.value) || 0;
  const vy = parseFloat(vyInput?.value) || 0;
  const vz = parseFloat(vzInput?.value) || 0;

  const wx = parseFloat(wxInput?.value) || 0;
  const wy = parseFloat(wyInput?.value) || 0;
  const wz = parseFloat(wzInput?.value) || 0;

  vBase.set(vx, vy, vz);
  wBase.set(wx, wy, wz);
  crossBase.crossVectors(vBase, wBase);

  // Update static pre-rotation ghosts
  updateArrowFromVector(ghostVArrow, vBase);
  updateArrowFromVector(ghostWArrow, wBase);
  updateArrowFromVector(ghostCrossArrow, crossBase);
}

/**
 * Reads Euler slider values in degrees.
 * @returns {{ yaw: number, pitch: number, roll: number }}
 */
function readEulerAngles() {
  const yaw = parseFloat(yawSlider?.value) || 0;
  const pitch = parseFloat(pitchSlider?.value) || 0;
  const roll = parseFloat(rollSlider?.value) || 0;
  return { yaw, pitch, roll };
}

/**
 * Computes target Quaternion from Euler sliders using rotation.js computeR.
 */
function updateTargetQuaternion() {
  const { yaw, pitch, roll } = readEulerAngles();
  const R = computeR(yaw, pitch, roll);

  const m4 = new THREE.Matrix4().set(
    R[0][0], R[0][1], R[0][2], 0,
    R[1][0], R[1][1], R[1][2], 0,
    R[2][0], R[2][1], R[2][2], 0,
    0,       0,       0,       1
  );

  qTarget.setFromRotationMatrix(m4);
}

/**
 * Formats a vector (x, y, z) into 3 decimal places string: (x, y, z).
 * @param {THREE.Vector3} vec
 * @returns {string}
 */
function formatVec3(vec) {
  return `(${vec.x >= 0 ? ' ' : ''}${vec.x.toFixed(3)}, ${vec.y >= 0 ? ' ' : ''}${vec.y.toFixed(3)}, ${vec.z >= 0 ? ' ' : ''}${vec.z.toFixed(3)})`;
}

/**
 * Updates dynamic vector orientations and the live readout.
 * @param {THREE.Quaternion} qCurrent
 */
function updateProofMath(qCurrent) {
  // 1. Live vectors rotated by qCurrent
  const vLive = vBase.clone().applyQuaternion(qCurrent);
  const wLive = wBase.clone().applyQuaternion(qCurrent);

  // 2. LHS: R(v x w)
  const lhs = crossBase.clone().applyQuaternion(qCurrent);

  // 3. RHS: R(v) x R(w)
  const rhs = vLive.clone().cross(wLive);

  // 4. Update 3D Arrows
  updateArrowFromVector(liveVArrow, vLive);
  updateArrowFromVector(liveWArrow, wLive);

  if (liveLHSGroup) {
    const arrow = liveLHSGroup.userData.arrow;
    const light = liveLHSGroup.userData.tipLight;
    updateArrowFromVector(arrow, lhs);
    if (light) {
      light.position.copy(lhs);
    }
  }

  updateArrowFromVector(liveRHSOutlineArrow, rhs);

  // 5. Update Labels positions
  if (labelV) labelV.position.copy(vLive.clone().addScaledVector(vLive.clone().normalize(), 0.35));
  if (labelW) labelW.position.copy(wLive.clone().addScaledVector(wLive.clone().normalize(), 0.35));
  if (labelLHS) labelLHS.position.copy(lhs.clone().addScaledVector(lhs.clone().normalize(), 0.45));

  // 6. Genuine Verification: Euclidean distance |LHS - RHS|
  const diffNorm = lhs.distanceTo(rhs);
  const isMatch = diffNorm < 1e-5;

  // 7. Update Live Readout UI
  if (readoutCross0) readoutCross0.textContent = formatVec3(crossBase);
  if (readoutLHS) readoutLHS.textContent = formatVec3(lhs);
  if (readoutRHS) readoutRHS.textContent = formatVec3(rhs);

  if (readoutBadge) {
    if (isMatch) {
      readoutBadge.className = 'proof-badge match';
      readoutBadge.textContent = '✅ MATCH — R(v⃗×ω⃗) = R(v⃗)×R(ω⃗)';
    } else {
      readoutBadge.className = 'proof-badge mismatch';
      readoutBadge.textContent = `❌ MISMATCH (Δ = ${diffNorm.toExponential(2)})`;
    }
  }
}

/**
 * Triggers the completion success pulse animation on the glowing LHS vector.
 */
function triggerSuccessPulse() {
  if (!liveLHSGroup) return;
  const arrow = liveLHSGroup.userData.arrow;
  const tipLight = liveLHSGroup.userData.tipLight;

  if (readoutBadge) {
    readoutBadge.classList.add('pulse-glow');
    setTimeout(() => readoutBadge.classList.remove('pulse-glow'), 600);
  }

  let pulseStart = performance.now();
  function pulseLoop(now) {
    const elapsed = now - pulseStart;
    const t = Math.min(1.0, elapsed / 400);
    const scale = 1.0 + Math.sin(t * Math.PI) * 0.3;

    if (arrow && arrow.cone && arrow.cone.material) {
      arrow.cone.material.emissiveIntensity = 0.6 + Math.sin(t * Math.PI) * 1.5;
    }
    if (tipLight) {
      tipLight.intensity = 1.2 + Math.sin(t * Math.PI) * 2.5;
    }

    if (t < 1.0) {
      requestAnimationFrame(pulseLoop);
    } else {
      if (arrow && arrow.cone && arrow.cone.material) arrow.cone.material.emissiveIntensity = 0.6;
      if (tipLight) tipLight.intensity = 1.2;
    }
  }
  requestAnimationFrame(pulseLoop);
}

/**
 * Starts the SLERP rotation animation.
 */
export function startRotationAnimation() {
  if (isAnimating) return;

  readVectorInputs();
  updateTargetQuaternion();

  qStart.copy(currentQuaternion);
  animStartTime = performance.now();
  isAnimating = true;

  if (animateBtn) {
    animateBtn.disabled = true;
    animateBtn.textContent = 'Animating...';
  }
}

/**
 * Resets vector orientations and sliders to identity.
 */
export function resetProof1() {
  isAnimating = false;
  currentQuaternion.identity();
  qStart.identity();
  qTarget.identity();

  if (yawSlider) yawSlider.value = '0';
  if (pitchSlider) pitchSlider.value = '0';
  if (rollSlider) rollSlider.value = '0';

  if (yawNum) yawNum.value = '0.0';
  if (pitchNum) pitchNum.value = '0.0';
  if (rollNum) rollNum.value = '0.0';

  if (animateBtn) {
    animateBtn.disabled = false;
    animateBtn.textContent = '▶ Animate Rotation';
  }

  readVectorInputs();
  updateProofMath(currentQuaternion);
}

/**
 * Handles viewport resize for Proof 1 canvas.
 */
export function handleProof1Resize() {
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
 * Initializes the Three.js scene for Proof 1.
 */
function initScene() {
  viewportElem = document.getElementById('proof1-viewport');
  if (!viewportElem) return;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0c12);

  // Camera
  const aspect = (viewportElem.clientWidth || 1) / (viewportElem.clientHeight || 1);
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  camera.position.set(5.5, 4.2, 6.5);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(viewportElem.clientWidth, viewportElem.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  viewportElem.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 0, 0);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(10, 15, 10);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x8899aa, 0.8);
  fillLight.position.set(-10, -5, -10);
  scene.add(fillLight);

  // Grid
  const grid = new THREE.GridHelper(12, 24, 0x222938, 0x141824);
  grid.position.y = -0.01;
  scene.add(grid);

  // 1. Ghost Vectors (pre-rotation initial state)
  ghostVArrow = createGhostArrow(vBase, vBase.length(), 0x00e5ff);
  ghostWArrow = createGhostArrow(wBase, wBase.length(), 0xff00e5);
  ghostCrossArrow = createGhostArrow(crossBase, crossBase.length(), 0xffee00);
  scene.add(ghostVArrow);
  scene.add(ghostWArrow);
  scene.add(ghostCrossArrow);

  // 2. Live Rotating Vectors
  liveVArrow = createVectorArrow(vBase, new THREE.Vector3(0,0,0), vBase.length(), 0x00e5ff);
  liveWArrow = createVectorArrow(wBase, new THREE.Vector3(0,0,0), wBase.length(), 0xff00e5);
  scene.add(liveVArrow);
  scene.add(liveWArrow);

  // 3. Live LHS: R(v x w) (Glowing Yellow)
  liveLHSGroup = createGlowingVectorArrow(crossBase, crossBase.length(), 0xffee00);
  scene.add(liveLHSGroup);

  // 4. Live RHS: R(v) x R(w) (Orange Outline)
  liveRHSOutlineArrow = createOutlineVectorArrow(crossBase, crossBase.length(), 0xff8800);
  scene.add(liveRHSOutlineArrow);

  // 5. Labels
  labelV = createTextSprite('v⃗', '#00e5ff', 'rgba(0, 229, 255, 0.15)', '#00e5ff');
  labelW = createTextSprite('ω⃗', '#ff00e5', 'rgba(255, 0, 229, 0.15)', '#ff00e5');
  labelLHS = createTextSprite('R(v⃗×ω⃗)', '#ffee00', 'rgba(255, 238, 0, 0.2)', '#ffee00');
  scene.add(labelV);
  scene.add(labelW);
  scene.add(labelLHS);

  // Origin point
  const originMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  );
  scene.add(originMesh);

  // Resize listener
  const resizeObserver = new ResizeObserver(handleProof1Resize);
  resizeObserver.observe(viewportElem);

  // Bind UI Controls
  setupUI();

  // Initial update
  readVectorInputs();
  updateProofMath(currentQuaternion);
}

/**
 * Binds UI inputs for Proof 1.
 */
function setupUI() {
  vxInput = document.getElementById('proof1-vx');
  vyInput = document.getElementById('proof1-vy');
  vzInput = document.getElementById('proof1-vz');

  wxInput = document.getElementById('proof1-wx');
  wyInput = document.getElementById('proof1-wy');
  wzInput = document.getElementById('proof1-wz');

  yawSlider = document.getElementById('proof1-yaw');
  pitchSlider = document.getElementById('proof1-pitch');
  rollSlider = document.getElementById('proof1-roll');

  yawNum = document.getElementById('proof1-yaw-num');
  pitchNum = document.getElementById('proof1-pitch-num');
  rollNum = document.getElementById('proof1-roll-num');

  animateBtn = document.getElementById('proof1-animate-btn');
  resetBtn = document.getElementById('proof1-reset-btn');

  readoutCross0 = document.getElementById('proof1-readout-cross0');
  readoutLHS = document.getElementById('proof1-readout-lhs');
  readoutRHS = document.getElementById('proof1-readout-rhs');
  readoutBadge = document.getElementById('proof1-badge');

  // Vector inputs listeners
  [vxInput, vyInput, vzInput, wxInput, wyInput, wzInput].forEach(inp => {
    if (inp) {
      inp.addEventListener('input', () => {
        readVectorInputs();
        updateProofMath(currentQuaternion);
      });
    }
  });

  // Slider + Number pairs
  const eulerPairs = [
    { slider: yawSlider, num: yawNum },
    { slider: pitchSlider, num: pitchNum },
    { slider: rollSlider, num: rollNum }
  ];

  eulerPairs.forEach(({ slider, num }) => {
    if (slider) {
      slider.addEventListener('input', () => {
        if (num) num.value = parseFloat(slider.value).toFixed(1);
        if (!isAnimating) {
          updateTargetQuaternion();
          currentQuaternion.copy(qTarget);
          updateProofMath(currentQuaternion);
        }
      });
    }
    if (num) {
      num.addEventListener('input', () => {
        const val = parseFloat(num.value);
        if (!isNaN(val) && slider) {
          slider.value = Math.max(-180, Math.min(180, val)).toString();
          if (!isAnimating) {
            updateTargetQuaternion();
            currentQuaternion.copy(qTarget);
            updateProofMath(currentQuaternion);
          }
        }
      });
    }
  });

  if (animateBtn) animateBtn.addEventListener('click', startRotationAnimation);
  if (resetBtn) resetBtn.addEventListener('click', resetProof1);
}

/**
 * Main animation and render loop for Proof 1.
 */
function animateProof1(now) {
  if (!isRunning) return;
  animFrameId = requestAnimationFrame(animateProof1);

  if (isAnimating) {
    const elapsed = now - animStartTime;
    const progress = Math.min(1.0, elapsed / ANIM_DURATION);
    const easedT = easeInOutCubic(progress);

    // SLERP interpolation
    currentQuaternion.copy(qStart).slerp(qTarget, easedT);
    updateProofMath(currentQuaternion);

    if (progress >= 1.0) {
      isAnimating = false;
      if (animateBtn) {
        animateBtn.disabled = false;
        animateBtn.textContent = '▶ Animate Rotation';
      }
      triggerSuccessPulse();
    }
  }

  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
}

/**
 * Starts/resumes Proof 1 render loop.
 */
export function startProof1() {
  if (!scene) {
    initScene();
  }
  isRunning = true;
  handleProof1Resize();
  if (!animFrameId) {
    animFrameId = requestAnimationFrame(animateProof1);
  }
}

/**
 * Pauses Proof 1 render loop to conserve GPU cycles.
 */
export function stopProof1() {
  isRunning = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}
