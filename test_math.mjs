import {
  computeRz,
  computeRy,
  computeRx,
  composeZYX,
  computeTrace,
  computePrincipalAngle
} from './src/rotation.js';

console.log('=== Running Kinematics Math Verification ===');

// 1. Identity
const R_id = composeZYX(0, 0, 0);
console.log('R_id:', JSON.stringify(R_id));
const tr_id = computeTrace(R_id);
const p_id = computePrincipalAngle(R_id);
console.log(`Identity: Trace = ${tr_id}, Angle = ${p_id.degrees.toFixed(4)}°`);
if (Math.abs(p_id.degrees) > 1e-6) throw new Error('Identity angle failed');

// 2. Pure Yaw 90 deg (about Z)
const R_yaw90 = composeZYX(Math.PI / 2, 0, 0);
const p_yaw90 = computePrincipalAngle(R_yaw90);
console.log(`Yaw 90°: Angle = ${p_yaw90.degrees.toFixed(4)}°`);
if (Math.abs(p_yaw90.degrees - 90) > 1e-6) throw new Error('Yaw 90° failed');

// 3. Pure Pitch 90 deg (about Y)
const R_pitch90 = composeZYX(0, Math.PI / 2, 0);
const p_pitch90 = computePrincipalAngle(R_pitch90);
console.log(`Pitch 90°: Angle = ${p_pitch90.degrees.toFixed(4)}°`);
if (Math.abs(p_pitch90.degrees - 90) > 1e-6) throw new Error('Pitch 90° failed');

// 4. Pure Roll 90 deg (about X)
const R_roll90 = composeZYX(0, 0, Math.PI / 2);
const p_roll90 = computePrincipalAngle(R_roll90);
console.log(`Roll 90°: Angle = ${p_roll90.degrees.toFixed(4)}°`);
if (Math.abs(p_roll90.degrees - 90) > 1e-6) throw new Error('Roll 90° failed');

// 5. Boundary testing: ±180 deg
for (const ang of [-180, -90, 0, 90, 180]) {
  const rad = (ang * Math.PI) / 180;
  const R = composeZYX(rad, rad, rad);
  const p = computePrincipalAngle(R);
  if (isNaN(p.degrees) || isNaN(p.radians)) {
    throw new Error(`NaN encountered at angle ${ang}°`);
  }
  console.log(`Angle test (${ang}°, ${ang}°, ${ang}°): Principal Angle = ${p.degrees.toFixed(2)}°`);
}

// 6. Test elemental matrices formulas
const Rz_90 = computeRz(Math.PI / 2);
if (Math.abs(Rz_90[0][1] - (-1)) > 1e-6 || Math.abs(Rz_90[1][0] - 1) > 1e-6) {
  throw new Error('Rz formula check failed');
}

const Ry_90 = computeRy(Math.PI / 2);
if (Math.abs(Ry_90[0][2] - 1) > 1e-6 || Math.abs(Ry_90[2][0] - (-1)) > 1e-6) {
  throw new Error('Ry formula check failed');
}

const Rx_90 = computeRx(Math.PI / 2);
if (Math.abs(Rx_90[1][2] - (-1)) > 1e-6 || Math.abs(Rx_90[2][1] - 1) > 1e-6) {
  throw new Error('Rx formula check failed');
}

console.log('=== All Math Verification Checks PASSED! ===');
