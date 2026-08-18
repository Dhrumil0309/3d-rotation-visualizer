/**
 * Pure mathematical module for rigid-body rotational kinematics.
 * Framework-agnostic (no Three.js or DOM dependencies).
 */

/**
 * Computes elemental rotation matrix Rz(psi) about the Z axis.
 * @param {number} psi - Yaw angle in radians
 * @returns {number[][]} 3x3 rotation matrix
 */
export function computeRz(psi) {
  const c = Math.cos(psi);
  const s = Math.sin(psi);
  return [
    [c, -s, 0],
    [s,  c, 0],
    [0,  0, 1]
  ];
}

/**
 * Computes elemental rotation matrix Ry(theta) about the Y axis.
 * @param {number} theta - Pitch angle in radians
 * @returns {number[][]} 3x3 rotation matrix
 */
export function computeRy(theta) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return [
    [ c, 0, s],
    [ 0, 1, 0],
    [-s, 0, c]
  ];
}

/**
 * Computes elemental rotation matrix Rx(phi) about the X axis.
 * @param {number} phi - Roll angle in radians
 * @returns {number[][]} 3x3 rotation matrix
 */
export function computeRx(phi) {
  const c = Math.cos(phi);
  const s = Math.sin(phi);
  return [
    [1, 0,  0],
    [0, c, -s],
    [0, s,  c]
  ];
}

/**
 * Multiplies two 3x3 matrices: C = A * B.
 * @param {number[][]} A - 3x3 matrix
 * @param {number[][]} B - 3x3 matrix
 * @returns {number[][]} 3x3 product matrix
 */
export function multiply3x3(A, B) {
  const C = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let sum = 0;
      for (let k = 0; k < 3; k++) {
        sum += A[i][k] * B[k][j];
      }
      C[i][j] = sum;
    }
  }

  return C;
}

/**
 * Composes intrinsic Z-Y-X rotation matrix: R = Rz(psi) * Ry(theta) * Rx(phi).
 * @param {number} psi - Yaw in radians (about Z)
 * @param {number} theta - Pitch in radians (about Y)
 * @param {number} phi - Roll in radians (about X)
 * @returns {number[][]} 3x3 composite rotation matrix
 */
export function composeZYX(psi, theta, phi) {
  const Rz = computeRz(psi);
  const Ry = computeRy(theta);
  const Rx = computeRx(phi);

  const RyRx = (typeof math !== 'undefined' && math.multiply)
    ? math.multiply(Ry, Rx)
    : multiply3x3(Ry, Rx);

  const R = (typeof math !== 'undefined' && math.multiply)
    ? math.multiply(Rz, RyRx)
    : multiply3x3(Rz, RyRx);

  return R;
}

/**
 * Computes trace of a 3x3 matrix.
 * tr(R) = R11 + R22 + R33
 * @param {number[][]} R - 3x3 rotation matrix
 * @returns {number} Matrix trace
 */
export function computeTrace(R) {
  return R[0][0] + R[1][1] + R[2][2];
}

/**
 * Computes the determinant of a 3x3 matrix.
 * det(R) = R00(R11*R22 - R12*R21) - R01(R10*R22 - R12*R20) + R02(R10*R21 - R11*R20)
 * @param {number[][]} R - 3x3 matrix
 * @returns {number} Determinant
 */
export function computeDeterminant3x3(R) {
  return (
    R[0][0] * (R[1][1] * R[2][2] - R[1][2] * R[2][1]) -
    R[0][1] * (R[1][0] * R[2][2] - R[1][2] * R[2][0]) +
    R[0][2] * (R[1][0] * R[2][1] - R[1][1] * R[2][0])
  );
}

/**
 * Computes the principal rotation angle theta_p from matrix trace:
 * tr(R) = 1 + 2*cos(theta_p) => cos(theta_p) = (tr(R) - 1) / 2
 * theta_p = acos((tr(R) - 1) / 2)
 *
 * @param {number[][]} R - 3x3 rotation matrix
 * @returns {{ radians: number, degrees: number }} Principal angle in rad and deg
 */
export function computePrincipalAngle(R) {
  const tr = computeTrace(R);
  let cosTheta = (tr - 1.0) / 2.0;

  // Numerical safeguard: clamp to [-1.0, 1.0] to prevent NaN from floating-point inaccuracies
  if (cosTheta > 1.0) cosTheta = 1.0;
  if (cosTheta < -1.0) cosTheta = -1.0;

  const rad = Math.acos(cosTheta);
  const deg = rad * (180.0 / Math.PI);

  return { radians: rad, degrees: deg };
}

/**
 * Computes the unit rotation axis vector (l, m, n) / Direction Cosines
 * relating the Body Frame to the Ground Frame (Euler axis-angle representation).
 *
 * @param {number[][]} R - 3x3 rotation matrix
 * @param {number} thetaRad - Principal rotation angle in radians
 * @returns {{ l: number, m: number, n: number }} Normalized direction cosines
 */
export function computeRotationAxis(R, thetaRad) {
  const sinTheta = Math.sin(thetaRad);

  // If angle is near 0, axis is arbitrary; return default (0, 0, 1)
  if (Math.abs(sinTheta) < 1e-5 || thetaRad < 1e-5) {
    return { l: 0, m: 0, n: 1 };
  }

  // If angle is near 180 degrees (pi), sinTheta approaches 0
  if (Math.PI - thetaRad < 1e-4) {
    let lx = Math.sqrt(Math.max(0, (R[0][0] + 1) / 2));
    let my = Math.sqrt(Math.max(0, (R[1][1] + 1) / 2));
    let nz = Math.sqrt(Math.max(0, (R[2][2] + 1) / 2));

    if (R[0][1] < 0) my = -my;
    if (R[0][2] < 0) nz = -nz;

    const len = Math.hypot(lx, my, nz) || 1;
    return { l: lx / len, m: my / len, n: nz / len };
  }

  // Standard case: R - R^T = 2 * sin(theta) * [u]_x
  let l = (R[2][1] - R[1][2]) / (2.0 * sinTheta);
  let m = (R[0][2] - R[2][0]) / (2.0 * sinTheta);
  let n = (R[1][0] - R[0][1]) / (2.0 * sinTheta);

  const len = Math.hypot(l, m, n);
  if (len > 1e-7) {
    l /= len;
    m /= len;
    n /= len;
  } else {
    l = 0;
    m = 0;
    n = 1;
  }

  return { l, m, n };
}

/**
 * Computes 3x3 rotation matrix from an axis (l, m, n) and angle theta (Rodrigues formula).
 * @param {number} l - X component of axis
 * @param {number} m - Y component of axis
 * @param {number} n - Z component of axis
 * @param {number} thetaRad - Rotation angle in radians
 * @returns {number[][]} 3x3 rotation matrix
 */
export function rotationMatrixFromAxisAngle(l, m, n, thetaRad) {
  let len = Math.hypot(l, m, n);
  if (len < 1e-7) {
    l = 0; m = 0; n = 1; len = 1;
  } else {
    l /= len; m /= len; n /= len;
  }

  const c = Math.cos(thetaRad);
  const s = Math.sin(thetaRad);
  const v = 1.0 - c;

  return [
    [l * l * v + c,     l * m * v - n * s, l * n * v + m * s],
    [l * m * v + n * s, m * m * v + c,     m * n * v - l * s],
    [l * n * v - m * s, m * n * v + l * s, n * n * v + c    ]
  ];
}

/**
 * Extracts intrinsic Z-Y-X Euler angles (Yaw, Pitch, Roll) in degrees from rotation matrix R.
 * @param {number[][]} R - 3x3 rotation matrix
 * @returns {{ yawDeg: number, pitchDeg: number, rollDeg: number }}
 */
export function extractEulerZYX(R) {
  let pitchRad, yawRad, rollRad;

  // R[2][0] = -sin(pitch)
  const sinPitch = -R[2][0];
  const cosPitch = Math.hypot(R[0][0], R[1][0]);

  if (cosPitch > 1e-6) {
    pitchRad = Math.atan2(sinPitch, cosPitch);
    yawRad = Math.atan2(R[1][0], R[0][0]);
    rollRad = Math.atan2(R[2][1], R[2][2]);
  } else {
    // Gimbal lock
    pitchRad = sinPitch > 0 ? Math.PI / 2 : -Math.PI / 2;
    rollRad = 0;
    yawRad = Math.atan2(-R[0][1], R[1][1]);
  }

  const toDeg = 180.0 / Math.PI;
  return {
    yawDeg: yawRad * toDeg,
    pitchDeg: pitchRad * toDeg,
    rollDeg: rollRad * toDeg
  };
}
