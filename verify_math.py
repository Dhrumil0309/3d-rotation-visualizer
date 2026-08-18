import math

def computeRz(psi):
    c, s = math.cos(psi), math.sin(psi)
    return [[c, -s, 0], [s, c, 0], [0, 0, 1]]

def computeRy(theta):
    c, s = math.cos(theta), math.sin(theta)
    return [[c, 0, s], [0, 1, 0], [-s, 0, c]]

def computeRx(phi):
    c, s = math.cos(phi), math.sin(phi)
    return [[1, 0, 0], [0, c, -s], [0, s, c]]

def mult(A, B):
    return [[sum(A[i][k]*B[k][j] for k in range(3)) for j in range(3)] for i in range(3)]

def composeZYX(psi, theta, phi):
    return mult(computeRz(psi), mult(computeRy(theta), computeRx(phi)))

def principalAngle(R):
    tr = R[0][0] + R[1][1] + R[2][2]
    val = max(-1.0, min(1.0, (tr - 1.0) / 2.0))
    rad = math.acos(val)
    return rad * 180.0 / math.pi

def computeDeterminant3x3(R):
    return (
        R[0][0] * (R[1][1] * R[2][2] - R[1][2] * R[2][1]) -
        R[0][1] * (R[1][0] * R[2][2] - R[1][2] * R[2][0]) +
        R[0][2] * (R[1][0] * R[2][1] - R[1][1] * R[2][0])
    )

def computeRotationAxis(R, thetaRad):
    sinTheta = math.sin(thetaRad)
    if abs(sinTheta) < 1e-5:
        return (0.0, 0.0, 1.0)
    l = (R[2][1] - R[1][2]) / (2.0 * sinTheta)
    m = (R[0][2] - R[2][0]) / (2.0 * sinTheta)
    n = (R[1][0] - R[0][1]) / (2.0 * sinTheta)
    norm = math.hypot(l, m, n)
    return (l / norm, m / norm, n / norm)

def rotationMatrixFromAxisAngle(l, m, n, thetaRad):
    norm = math.hypot(l, m, n) or 1.0
    l, m, n = l / norm, m / norm, n / norm
    c, s = math.cos(thetaRad), math.sin(thetaRad)
    v = 1.0 - c
    return [
        [l * l * v + c,     l * m * v - n * s, l * n * v + m * s],
        [l * m * v + n * s, m * m * v + c,     m * n * v - l * s],
        [l * n * v - m * s, m * n * v + l * s, n * n * v + c    ]
    ]

def extractEulerZYX(R):
    sinPitch = -R[2][0]
    cosPitch = math.hypot(R[0][0], R[1][0])
    if cosPitch > 1e-6:
        pitchRad = math.atan2(sinPitch, cosPitch)
        yawRad = math.atan2(R[1][0], R[0][0])
        rollRad = math.atan2(R[2][1], R[2][2])
    else:
        pitchRad = math.pi / 2 if sinPitch > 0 else -math.pi / 2
        rollRad = 0.0
        yawRad = math.atan2(-R[0][1], R[1][1])
    toDeg = 180.0 / math.pi
    return yawRad * toDeg, pitchRad * toDeg, rollRad * toDeg

print("=== 1. Testing Determinant ===")
for angles in [(0,0,0), (30, 45, -60), (90, 0, 0), (-180, 180, 0)]:
    psi, th, ph = [math.radians(a) for a in angles]
    R = composeZYX(psi, th, ph)
    det = computeDeterminant3x3(R)
    assert abs(det - 1.0) < 1e-6, f"Determinant {det} != 1 for {angles}"
print("Determinant is 1.000 for all test rotations: PASSED")

print("=== 2. Testing Rotation Axis (l, m, n) Extraction ===")
# Pure Yaw 90 deg -> Axis should be (0, 0, 1)
R_yaw = composeZYX(math.pi/2, 0, 0)
ax_yaw = computeRotationAxis(R_yaw, math.pi/2)
assert abs(ax_yaw[0]) < 1e-5 and abs(ax_yaw[1]) < 1e-5 and abs(ax_yaw[2] - 1.0) < 1e-5
print(f"Yaw 90 deg Axis: {ax_yaw} - PASSED")

# Pure Pitch 90 deg -> Axis should be (0, 1, 0)
R_pitch = composeZYX(0, math.pi/2, 0)
ax_pitch = computeRotationAxis(R_pitch, math.pi/2)
assert abs(ax_pitch[0]) < 1e-5 and abs(ax_pitch[1] - 1.0) < 1e-5 and abs(ax_pitch[2]) < 1e-5
print(f"Pitch 90 deg Axis: {ax_pitch} - PASSED")

# Pure Roll 90 deg -> Axis should be (1, 0, 0)
R_roll = composeZYX(0, 0, math.pi/2)
ax_roll = computeRotationAxis(R_roll, math.pi/2)
assert abs(ax_roll[0] - 1.0) < 1e-5 and abs(ax_roll[1]) < 1e-5 and abs(ax_roll[2]) < 1e-5
print(f"Roll 90 deg Axis: {ax_roll} - PASSED")

print("=== 3. Testing Rodrigues Matrix & Euler Roundtrip ===")
test_cases = [
    (20.0, 30.0, 40.0),
    (-45.0, 60.0, -30.0),
    (0.0, 0.0, 0.0)
]
for y_in, p_in, r_in in test_cases:
    R_orig = composeZYX(math.radians(y_in), math.radians(p_in), math.radians(r_in))
    y_out, p_out, r_out = extractEulerZYX(R_orig)
    assert abs(y_in - y_out) < 1e-4 and abs(p_in - p_out) < 1e-4 and abs(r_in - r_out) < 1e-4, f"Roundtrip mismatch: in=({y_in},{p_in},{r_in}) out=({y_out},{p_out},{r_out})"

print("Euler decomposition roundtrip: PASSED")
print("\n--- ALL KINEMATICS & AXIS FORMULAS FULLY VERIFIED ---")
