/**
 * Pure mathematical module for skew-symmetric matrices and Lie algebra so(3).
 * Framework-agnostic (zero Three.js or DOM dependencies).
 */

/**
 * hat: R^3 -> so(3), the skew-symmetric cross-product matrix operator (wedge/hat map).
 * For a vector w = [wx, wy, wz], hat(w) produces:
 * [  0, -wz,  wy ]
 * [ wz,   0, -wx ]
 * [-wy,  wx,   0 ]
 *
 * @param {number[]|[number, number, number]} w - 3D vector [wx, wy, wz]
 * @returns {number[][]} 3x3 skew-symmetric matrix
 */
export function hat(w) {
  const wx = w[0] || 0;
  const wy = w[1] || 0;
  const wz = w[2] || 0;
  return [
    [  0, -wz,  wy],
    [ wz,   0, -wx],
    [-wy,  wx,   0]
  ];
}

/**
 * Multiplies two 3x3 matrices: C = A * B.
 * @param {number[][]} A - 3x3 matrix
 * @param {number[][]} B - 3x3 matrix
 * @returns {number[][]} 3x3 product matrix
 */
export function matMul3(A, B) {
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
 * Computes the transpose of a 3x3 matrix: At = A^T.
 * @param {number[][]} A - 3x3 matrix
 * @returns {number[][]} 3x3 transposed matrix
 */
export function transpose3(A) {
  return [
    [A[0][0], A[1][0], A[2][0]],
    [A[0][1], A[1][1], A[2][1]],
    [A[0][2], A[1][2], A[2][2]]
  ];
}

/**
 * Multiplies a 3x3 matrix by a 3D vector: u = A * v.
 * @param {number[][]} A - 3x3 matrix
 * @param {number[]} v - 3D vector [vx, vy, vz]
 * @returns {number[]} 3D transformed vector [ux, uy, uz]
 */
export function matVec3(A, v) {
  const vx = v[0] || 0;
  const vy = v[1] || 0;
  const vz = v[2] || 0;

  return [
    A[0][0] * vx + A[0][1] * vy + A[0][2] * vz,
    A[1][0] * vx + A[1][1] * vy + A[1][2] * vz,
    A[2][0] * vx + A[2][1] * vy + A[2][2] * vz
  ];
}

/**
 * Inverse hat operator: so(3) -> R^3
 * @param {number[][]} S - 3x3 skew-symmetric matrix
 * @returns {number[]} 3D vector [wx, wy, wz]
 */
export function unhat(S) {
  return [
    S[2][1], // wx
    S[0][2], // wy
    S[1][0]  // wz
  ];
}
