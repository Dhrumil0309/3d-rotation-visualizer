import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { computeR } from '../rotation.js';
import { hat, matMul3, transpose3, matVec3 } from '../math/skew.js';
import { createVectorArrow, createTextSprite, updateArrowFromVector } from './shared-arrow-utils.js';

let scene, camera, renderer, controls;
let viewportElem;
let isRunning = false;
let animFrameId = null;

// 3D Visual Objects
let omegaArrow, rOmegaArrow;
let labelOmega, labelROmega;

// DOM references
let wxInput, wyInput, wzInput;
let yawSlider, pitchSlider, rollSlider;
let yawNum, pitchNum, rollNum;
let resetBtn;

// KaTeX Display Containers
let katexStep1El, katexStep2El, katexStep3El;
let katexRhsStep1El, katexRhsStep2El;
let katexComparisonSummaryEl;
let comparisonCardEl, adjointBadgeEl;

/**
 * Converts a 3x3 matrix into a textbook-quality LaTeX \begin{bmatrix} string.
 * - Formats all numbers to exactly 3 decimal places.
 * - Uses \phantom{-} for non-negative numbers to align decimals and minus signs vertically.
 * - For skew-symmetric matrices, dims the main diagonal zeros with subtle gray color.
 *
 * @param {number[][]} mat - 3x3 matrix
 * @param {Object} [options]
 * @param {boolean} [options.dimDiagonal=false] - Whether to dim main diagonal zeros
 * @param {string} [options.diagColor="#64748b"] - Color for dimmed diagonal zeros
 * @param {string} [options.colorAll=null] - Optional uniform color for all numbers (e.g. green for zero error matrix)
 * @returns {string}
 */
export function matrixToLatex(mat, options = {}) {
  const { dimDiagonal = false, diagColor = '#64748b', colorAll = null } = options;
  const rows = [];

  for (let i = 0; i < 3; i++) {
    const cols = [];
    for (let j = 0; j < 3; j++) {
      let val = mat[i][j];
      if (Math.abs(val) < 0.0005) val = 0.0; // avoid negative zero (-0.000)

      const isNeg = val < 0;
      const absFormatted = Math.abs(val).toFixed(3);
      let numStr = isNeg ? `-${absFormatted}` : `\\phantom{-}${absFormatted}`;

      if (colorAll) {
        numStr = `\\textcolor{${colorAll}}{${numStr}}`;
      } else if (dimDiagonal && i === j) {
        numStr = `\\textcolor{${diagColor}}{${numStr}}`;
      }

      cols.push(numStr);
    }
    rows.push(cols.join(' & '));
  }

  return `\\begin{bmatrix}\n  ${rows.join(' \\\\\n  ')}\n\\end{bmatrix}`;
}

/**
 * Converts a 3D vector into a column vector LaTeX string.
 * @param {number[]} vec - [x, y, z]
 * @returns {string}
 */
export function vectorToLatex(vec) {
  const rows = vec.map(v => {
    let val = Math.abs(v) < 0.0005 ? 0.0 : v;
    const isNeg = val < 0;
    const absFormatted = Math.abs(val).toFixed(3);
    return isNeg ? `-${absFormatted}` : `\\phantom{-}${absFormatted}`;
  });

  return `\\begin{bmatrix} ${rows[0]} \\\\ ${rows[1]} \\\\ ${rows[2]} \\end{bmatrix}`;
}

/**
 * Renders static KaTeX labels (e.g. lemma statement) on load.
 */
export function initKaTeXLabels() {
  if (typeof window.katex === 'undefined') return;

  const lemmaEl = document.getElementById('katex-lemma');
  if (lemmaEl) {
    try {
      window.katex.render('R\\,\\hat{\\omega}\\,R^T = \\widehat{(R\\,\\omega)}', lemmaEl, {
        displayMode: true,
        throwOnError: false
      });
    } catch (err) {
      console.warn('KaTeX render failed for lemma banner:', err);
    }
  }
}

/**
 * Reads omega vector from inputs.
 * @returns {number[]} [wx, wy, wz]
 */
function readOmega() {
  const wx = parseFloat(wxInput?.value) || 0;
  const wy = parseFloat(wyInput?.value) || 0;
  const wz = parseFloat(wzInput?.value) || 0;
  return [wx, wy, wz];
}

/**
 * Reads rotation angles in degrees from sliders.
 * @returns {{ yaw: number, pitch: number, roll: number }}
 */
function readEulerAngles() {
  const yaw = parseFloat(yawSlider?.value) || 0;
  const pitch = parseFloat(pitchSlider?.value) || 0;
  const roll = parseFloat(rollSlider?.value) || 0;
  return { yaw, pitch, roll };
}

/**
 * Computes the full adjoint proof steps and renders dynamic KaTeX matrices.
 */
export function updateAdjointProof() {
  const omega = readOmega();
  const { yaw, pitch, roll } = readEulerAngles();

  // 1. Compute Rotation Matrix R and Transpose
  const R = computeR(yaw, pitch, roll);
  const Rt = transpose3(R);

  // 2. LHS Derivation
  // Step 1: \hat{\omega}
  const what = hat(omega);
  // Step 2: R * \hat{\omega}
  const Rwhat = matMul3(R, what);
  // Step 3: (R * \hat{\omega}) * R^T = LHS
  const lhs = matMul3(Rwhat, Rt);

  // 3. RHS Derivation
  // Step 1: R * \omega
  const Romega = matVec3(R, omega);
  // Step 2: \widehat{(R\omega)} = RHS
  const rhs = hat(Romega);

  // 4. Compute Error Matrix (LHS - RHS)
  const errorMatrix = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];
  let maxAbsDiff = 0;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const diff = lhs[i][j] - rhs[i][j];
      errorMatrix[i][j] = diff;
      const absDiff = Math.abs(diff);
      if (absDiff > maxAbsDiff) maxAbsDiff = absDiff;
    }
  }

  const isMatch = maxAbsDiff < 1e-6;

  // 5. Dynamic KaTeX Matrix Rendering
  if (typeof window.katex !== 'undefined') {
    // LHS Step 1: \hat{\omega}
    if (katexStep1El) {
      const tex = `\\hat{\\omega} = ${matrixToLatex(what, { dimDiagonal: true })}`;
      window.katex.render(tex, katexStep1El, { displayMode: true, throwOnError: false });
    }

    // LHS Step 2: R * \hat{\omega}
    if (katexStep2El) {
      const tex = `R \\cdot \\hat{\\omega} = ${matrixToLatex(Rwhat)}`;
      window.katex.render(tex, katexStep2El, { displayMode: true, throwOnError: false });
    }

    // LHS Step 3: (R * \hat{\omega}) * R^T (LHS Result)
    if (katexStep3El) {
      const tex = `(R \\cdot \\hat{\\omega}) R^T = ${matrixToLatex(lhs)}`;
      window.katex.render(tex, katexStep3El, { displayMode: true, throwOnError: false });
    }

    // RHS Step 1: R * \omega
    if (katexRhsStep1El) {
      const tex = `R \\,\\vec{\\omega} = ${vectorToLatex(Romega)}`;
      window.katex.render(tex, katexRhsStep1El, { displayMode: true, throwOnError: false });
    }

    // RHS Step 2: \widehat{(R\omega)} (RHS Result)
    if (katexRhsStep2El) {
      const tex = `\\widehat{(R\\,\\omega)} = ${matrixToLatex(rhs, { dimDiagonal: true })}`;
      window.katex.render(tex, katexRhsStep2El, { displayMode: true, throwOnError: false });
    }

    // Summary Equation: LHS - RHS = Error Matrix ≈ 0
    if (katexComparisonSummaryEl) {
      const lhsLatex = matrixToLatex(lhs);
      const rhsLatex = matrixToLatex(rhs, { dimDiagonal: true });
      const errLatex = matrixToLatex(errorMatrix, { colorAll: isMatch ? '#34c759' : '#ff3b30' });

      const summaryTex = `\\underbrace{${lhsLatex}}_{\\text{LHS: } R\\hat{\\omega}R^T} \\;-\\; \\underbrace{${rhsLatex}}_{\\text{RHS: } \\widehat{(R\\omega)}} \\;=\\; \\underbrace{${errLatex}}_{\\text{Error Matrix } \\mathbf{E}} \\;\\equiv\\; \\mathbf{0}`;
      window.katex.render(summaryTex, katexComparisonSummaryEl, { displayMode: true, throwOnError: false });
    }
  }

  // 6. Visual Badge & Container Glow
  if (comparisonCardEl) {
    if (isMatch) {
      comparisonCardEl.classList.add('match-glow');
      comparisonCardEl.classList.remove('mismatch-glow');
    } else {
      comparisonCardEl.classList.remove('match-glow');
      comparisonCardEl.classList.add('mismatch-glow');
    }
  }

  if (adjointBadgeEl) {
    if (isMatch) {
      adjointBadgeEl.className = 'proof-badge match pulse-subtle';
      adjointBadgeEl.textContent = '✅ IDENTICAL — R ω̂ Rᵀ = (Rω⃗)^';
    } else {
      adjointBadgeEl.className = 'proof-badge mismatch';
      adjointBadgeEl.textContent = `❌ MISMATCH (max |Δ| = ${maxAbsDiff.toExponential(2)})`;
    }
  }

  // 7. Update 3D Preview Viewport
  const vOmega = new THREE.Vector3(omega[0], omega[1], omega[2]);
  const vROmega = new THREE.Vector3(Romega[0], Romega[1], Romega[2]);

  updateArrowFromVector(omegaArrow, vOmega);
  updateArrowFromVector(rOmegaArrow, vROmega);

  if (labelOmega) labelOmega.position.copy(vOmega.clone().addScaledVector(vOmega.clone().normalize(), 0.35));
  if (labelROmega) labelROmega.position.copy(vROmega.clone().addScaledVector(vROmega.clone().normalize(), 0.35));
}

/**
 * Resets Proof 2 inputs to default values.
 */
export function resetProof2() {
  if (wxInput) wxInput.value = '1.0';
  if (wyInput) wyInput.value = '2.0';
  if (wzInput) wzInput.value = '1.5';

  if (yawSlider) yawSlider.value = '30';
  if (pitchSlider) pitchSlider.value = '45';
  if (rollSlider) rollSlider.value = '15';

  if (yawNum) yawNum.value = '30.0';
  if (pitchNum) pitchNum.value = '45.0';
  if (rollNum) rollNum.value = '15.0';

  updateAdjointProof();
}

/**
 * Handles resize for the Proof 2 3D preview canvas.
 */
export function handleProof2Resize() {
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
 * Initializes the lightweight 3D Preview scene for Proof 2.
 */
function initScene() {
  viewportElem = document.getElementById('proof2-viewport');
  if (!viewportElem) return;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0c12);

  // Camera
  const aspect = (viewportElem.clientWidth || 1) / (viewportElem.clientHeight || 1);
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  camera.position.set(4.8, 3.8, 5.8);

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
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(8, 12, 8);
  scene.add(keyLight);

  // Grid
  const grid = new THREE.GridHelper(10, 20, 0x222938, 0x141824);
  grid.position.y = -0.01;
  scene.add(grid);

  // Arrows
  omegaArrow = createVectorArrow(new THREE.Vector3(1, 2, 1.5), new THREE.Vector3(0,0,0), 2.5, 0xff00e5);
  rOmegaArrow = createVectorArrow(new THREE.Vector3(1, 2, 1.5), new THREE.Vector3(0,0,0), 2.5, 0x00e5ff);
  scene.add(omegaArrow);
  scene.add(rOmegaArrow);

  // Labels
  labelOmega = createTextSprite('ω⃗', '#ff00e5', 'rgba(255, 0, 229, 0.15)', '#ff00e5');
  labelROmega = createTextSprite('Rω⃗', '#00e5ff', 'rgba(0, 229, 255, 0.15)', '#00e5ff');
  scene.add(labelOmega);
  scene.add(labelROmega);

  // Origin point
  const originMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  );
  scene.add(originMesh);

  // Setup DOM references & listeners
  setupUI();

  // Resize listener
  const resizeObserver = new ResizeObserver(handleProof2Resize);
  resizeObserver.observe(viewportElem);

  // Initialize KaTeX static labels
  initKaTeXLabels();

  // Initial calculation & KaTeX render
  updateAdjointProof();
}

/**
 * Binds UI inputs and sets up KaTeX element targets.
 */
function setupUI() {
  wxInput = document.getElementById('proof2-wx');
  wyInput = document.getElementById('proof2-wy');
  wzInput = document.getElementById('proof2-wz');

  yawSlider = document.getElementById('proof2-yaw');
  pitchSlider = document.getElementById('proof2-pitch');
  rollSlider = document.getElementById('proof2-roll');

  yawNum = document.getElementById('proof2-yaw-num');
  pitchNum = document.getElementById('proof2-pitch-num');
  rollNum = document.getElementById('proof2-roll-num');

  resetBtn = document.getElementById('proof2-reset-btn');
  adjointBadgeEl = document.getElementById('proof2-badge');
  comparisonCardEl = document.getElementById('proof2-comparison-card');

  // KaTeX targets
  katexStep1El = document.getElementById('katex-step1');
  katexStep2El = document.getElementById('katex-step2');
  katexStep3El = document.getElementById('katex-step3');

  katexRhsStep1El = document.getElementById('katex-rhs-step1');
  katexRhsStep2El = document.getElementById('katex-rhs-step2');

  katexComparisonSummaryEl = document.getElementById('katex-comparison-summary');

  // Vector input listeners
  [wxInput, wyInput, wzInput].forEach(inp => {
    if (inp) {
      inp.addEventListener('input', updateAdjointProof);
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
        updateAdjointProof();
      });
    }
    if (num) {
      num.addEventListener('input', () => {
        const val = parseFloat(num.value);
        if (!isNaN(val) && slider) {
          slider.value = Math.max(-180, Math.min(180, val)).toString();
          updateAdjointProof();
        }
      });
    }
  });

  if (resetBtn) resetBtn.addEventListener('click', resetProof2);
}

/**
 * Render loop for Proof 2 3D preview.
 */
function animateProof2() {
  if (!isRunning) return;
  animFrameId = requestAnimationFrame(animateProof2);

  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
}

/**
 * Starts/resumes Proof 2.
 */
export function startProof2() {
  if (!scene) {
    initScene();
  }
  isRunning = true;
  handleProof2Resize();
  initKaTeXLabels();
  updateAdjointProof();
  if (!animFrameId) {
    animFrameId = requestAnimationFrame(animateProof2);
  }
}

/**
 * Pauses Proof 2 render loop.
 */
export function stopProof2() {
  isRunning = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}
