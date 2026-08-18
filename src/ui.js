import {
  composeZYX,
  computePrincipalAngle,
  computeDeterminant3x3,
  computeRotationAxis,
  rotationMatrixFromAxisAngle,
  extractEulerZYX
} from './rotation.js';

// DOM element references
let yawSlider, pitchSlider, rollSlider;
let yawNum, pitchNum, rollNum;
let axisL, axisM, axisN;
let transXSlider, transYSlider, transZSlider;
let transXNum, transYNum, transZNum;
let matrixGridCells = [];
let detOutput, thetaOutput, resetBtn;
let togglePrincipalAxis;

let onRotationUpdateCallback = null;
let isUpdatingFromAxis = false;

/**
 * Formats a matrix cell number to 3 decimal places with aligned spacing.
 * @param {number} num
 * @returns {string}
 */
function formatMatrixCell(num) {
  if (Math.abs(num) < 0.0005) return ' 0.000';
  const str = num.toFixed(3);
  return num >= 0 ? ` ${str}` : str;
}

/**
 * Reads Euler angles in degrees from sliders/inputs.
 * @returns {{ yawDeg: number, pitchDeg: number, rollDeg: number }}
 */
export function getEulerAngles() {
  const yawDeg = parseFloat(yawSlider?.value) || 0;
  const pitchDeg = parseFloat(pitchSlider?.value) || 0;
  const rollDeg = parseFloat(rollSlider?.value) || 0;
  return { yawDeg, pitchDeg, rollDeg };
}

/**
 * Reads Translation origin offset (X, Y, Z).
 * @returns {{ x: number, y: number, z: number }}
 */
export function getTranslation() {
  const x = parseFloat(transXSlider?.value) || 0;
  const y = parseFloat(transYSlider?.value) || 0;
  const z = parseFloat(transZSlider?.value) || 0;
  return { x, y, z };
}

/**
 * Updates full application state from Euler Angles & Translation.
 * Synchronizes inputs, computes Matrix R, Determinant, Principal Angle, Axis (l,m,n),
 * and notifies 3D renderer.
 */
export function updateFromEuler() {
  if (isUpdatingFromAxis) return;

  const { yawDeg, pitchDeg, rollDeg } = getEulerAngles();

  // Two-way sync: Update number inputs if not currently focused
  if (document.activeElement !== yawNum && yawNum) yawNum.value = yawDeg.toFixed(1);
  if (document.activeElement !== pitchNum && pitchNum) pitchNum.value = pitchDeg.toFixed(1);
  if (document.activeElement !== rollNum && rollNum) rollNum.value = rollDeg.toFixed(1);

  // Convert to radians
  const psi = (yawDeg * Math.PI) / 180.0;
  const theta = (pitchDeg * Math.PI) / 180.0;
  const phi = (rollDeg * Math.PI) / 180.0;

  // 1. Composite Matrix R
  const R = composeZYX(psi, theta, phi);

  // 2. Render 3x3 Matrix Grid
  let cellIdx = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (matrixGridCells[cellIdx]) {
        matrixGridCells[cellIdx].textContent = formatMatrixCell(R[i][j]);
      }
      cellIdx++;
    }
  }

  // 3. Matrix Determinant
  const det = computeDeterminant3x3(R);
  if (detOutput) {
    const detDisplay = Math.abs(det - 1.0) < 1e-4 ? '1.000' : det.toFixed(3);
    detOutput.textContent = `det(R) = ${detDisplay}`;
  }

  // 4. Principal Rotation Angle
  const { radians: thetaRad, degrees: thetaDeg } = computePrincipalAngle(R);
  if (thetaOutput) {
    thetaOutput.textContent = `θ = ${thetaDeg.toFixed(1)}°`;
  }

  // 5. Direction Cosines / Rotation Axis (l, m, n)
  const axis = computeRotationAxis(R, thetaRad);
  if (document.activeElement !== axisL && axisL) axisL.value = axis.l.toFixed(3);
  if (document.activeElement !== axisM && axisM) axisM.value = axis.m.toFixed(3);
  if (document.activeElement !== axisN && axisN) axisN.value = axis.n.toFixed(3);

  // 6. Translation
  const translation = getTranslation();

  // 7. Principal Axis Visibility Toggle
  const showAxis = togglePrincipalAxis ? togglePrincipalAxis.checked : true;

  // 8. Notify 3D Scene
  if (onRotationUpdateCallback) {
    onRotationUpdateCallback(R, translation, axis, thetaDeg, showAxis);
  }
}

/**
 * Updates full application state from Direction Cosines / Rotation Axis (l, m, n).
 * Computes equivalent rotation matrix and updates Euler sliders.
 */
export function updateFromAxis() {
  const lRaw = parseFloat(axisL?.value) || 0;
  const mRaw = parseFloat(axisM?.value) || 0;
  const nRaw = parseFloat(axisN?.value) || 0;

  let len = Math.hypot(lRaw, mRaw, nRaw);
  if (len < 1e-6) return;

  const l = lRaw / len;
  const m = mRaw / len;
  const n = nRaw / len;

  // Retrieve current principal angle or default to 45 deg if currently 0
  const { yawDeg, pitchDeg, rollDeg } = getEulerAngles();
  const psi = (yawDeg * Math.PI) / 180.0;
  const theta = (pitchDeg * Math.PI) / 180.0;
  const phi = (rollDeg * Math.PI) / 180.0;
  const currentR = composeZYX(psi, theta, phi);
  let { radians: thetaRad } = computePrincipalAngle(currentR);

  if (thetaRad < 1e-4) {
    thetaRad = Math.PI / 4; // 45 degrees default when starting from zero
  }

  // Compute rotation matrix from axis and angle
  const R = rotationMatrixFromAxisAngle(l, m, n, thetaRad);

  // Extract Euler angles
  const euler = extractEulerZYX(R);

  isUpdatingFromAxis = true;

  // Update slider and number values
  if (yawSlider) yawSlider.value = euler.yawDeg.toFixed(1);
  if (pitchSlider) pitchSlider.value = euler.pitchDeg.toFixed(1);
  if (rollSlider) rollSlider.value = euler.rollDeg.toFixed(1);

  if (yawNum) yawNum.value = euler.yawDeg.toFixed(1);
  if (pitchNum) pitchNum.value = euler.pitchDeg.toFixed(1);
  if (rollNum) rollNum.value = euler.rollDeg.toFixed(1);

  isUpdatingFromAxis = false;

  // Update matrix, angle, and 3D
  updateFromEuler();
}

/**
 * Synchronizes translation slider and number inputs and notifies 3D scene.
 */
export function updateTranslation() {
  const { x, y, z } = getTranslation();

  if (document.activeElement !== transXNum && transXNum) transXNum.value = x.toFixed(1);
  if (document.activeElement !== transYNum && transYNum) transYNum.value = y.toFixed(1);
  if (document.activeElement !== transZNum && transZNum) transZNum.value = z.toFixed(1);

  updateFromEuler();
}

/**
 * Resets all sliders, translations, and rotation state to Identity.
 */
export function resetToIdentity() {
  if (yawSlider) yawSlider.value = '0';
  if (pitchSlider) pitchSlider.value = '0';
  if (rollSlider) rollSlider.value = '0';

  if (yawNum) yawNum.value = '0.0';
  if (pitchNum) pitchNum.value = '0.0';
  if (rollNum) rollNum.value = '0.0';

  if (axisL) axisL.value = '0.000';
  if (axisM) axisM.value = '0.000';
  if (axisN) axisN.value = '1.000';

  if (transXSlider) transXSlider.value = '0';
  if (transYSlider) transYSlider.value = '0';
  if (transZSlider) transZSlider.value = '0';

  if (transXNum) transXNum.value = '0.0';
  if (transYNum) transYNum.value = '0.0';
  if (transZNum) transZNum.value = '0.0';

  if (togglePrincipalAxis) togglePrincipalAxis.checked = true;

  updateFromEuler();
}

/**
 * Initializes UI event bindings and creates matrix grid cells.
 * @param {Function} onRotationChange - Callback (R, translation, axis, thetaDeg, showAxis) => void
 */
export function initUI(onRotationChange) {
  onRotationUpdateCallback = onRotationChange;

  // Euler inputs
  yawSlider = document.getElementById('yaw');
  pitchSlider = document.getElementById('pitch');
  rollSlider = document.getElementById('roll');

  yawNum = document.getElementById('yaw-num');
  pitchNum = document.getElementById('pitch-num');
  rollNum = document.getElementById('roll-num');

  // Axis direction cosines
  axisL = document.getElementById('axis-l');
  axisM = document.getElementById('axis-m');
  axisN = document.getElementById('axis-n');
  togglePrincipalAxis = document.getElementById('toggle-principal-axis');

  // Translation inputs
  transXSlider = document.getElementById('trans-x');
  transYSlider = document.getElementById('trans-y');
  transZSlider = document.getElementById('trans-z');

  transXNum = document.getElementById('trans-x-num');
  transYNum = document.getElementById('trans-y-num');
  transZNum = document.getElementById('trans-z-num');

  // Outputs & Buttons
  detOutput = document.getElementById('det-output');
  thetaOutput = document.getElementById('theta-output');
  resetBtn = document.getElementById('reset-btn');

  // Setup Matrix Grid
  const matrixGridContainer = document.getElementById('matrix-grid');
  if (matrixGridContainer) {
    matrixGridContainer.innerHTML = '';
    matrixGridCells = [];
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('span');
      cell.className = 'matrix-cell';
      cell.setAttribute('data-index', i.toString());
      cell.textContent = ' 0.000';
      matrixGridContainer.appendChild(cell);
      matrixGridCells.push(cell);
    }
  }

  // 1. Two-way Euler Sliders & Number inputs
  const eulerPairs = [
    { slider: yawSlider, num: yawNum },
    { slider: pitchSlider, num: pitchNum },
    { slider: rollSlider, num: rollNum }
  ];

  eulerPairs.forEach(({ slider, num }) => {
    if (slider) {
      slider.addEventListener('input', () => {
        if (num) num.value = parseFloat(slider.value).toFixed(1);
        updateFromEuler();
      });
    }
    if (num) {
      num.addEventListener('input', () => {
        const val = parseFloat(num.value);
        if (!isNaN(val) && slider) {
          slider.value = Math.max(-180, Math.min(180, val)).toString();
          updateFromEuler();
        }
      });
    }
  });

  // 2. Direction Cosines / Rotation Axis Inputs & Checkbox
  [axisL, axisM, axisN].forEach(input => {
    if (input) {
      input.addEventListener('input', updateFromAxis);
      input.addEventListener('change', updateFromAxis);
    }
  });

  if (togglePrincipalAxis) {
    togglePrincipalAxis.addEventListener('change', updateFromEuler);
  }

  // 3. Translation Sliders & Number inputs
  const transPairs = [
    { slider: transXSlider, num: transXNum },
    { slider: transYSlider, num: transYNum },
    { slider: transZSlider, num: transZNum }
  ];

  transPairs.forEach(({ slider, num }) => {
    if (slider) {
      slider.addEventListener('input', () => {
        if (num) num.value = parseFloat(slider.value).toFixed(1);
        updateTranslation();
      });
    }
    if (num) {
      num.addEventListener('input', () => {
        const val = parseFloat(num.value);
        if (!isNaN(val) && slider) {
          slider.value = Math.max(-10, Math.min(10, val)).toString();
          updateTranslation();
        }
      });
    }
  });

  // 4. Reset Button
  if (resetBtn) {
    resetBtn.addEventListener('click', resetToIdentity);
  }

  // Initial update
  updateFromEuler();
}
