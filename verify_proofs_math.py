import math
import random

# --- 1. Rotation math from rotation.js ---
def computeRz(psi):
    c, s = math.cos(psi), math.sin(psi)
    return [[c, -s, 0], [s, c, 0], [0, 0, 1]]

def computeRy(theta):
    c, s = math.cos(theta), math.sin(theta)
    return [[c, 0, s], [0, 1, 0], [-s, 0, c]]

def computeRx(phi):
    c, s = math.cos(phi), math.sin(phi)
    return [[1, 0, 0], [0, c, -s], [0, s, c]]

def matMul3(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(3)) for j in range(3)] for i in range(3)]

def composeZYX(psi, theta, phi):
    return matMul3(computeRz(psi), matMul3(computeRy(theta), computeRx(phi)))

def computeR(yawDeg, pitchDeg, rollDeg):
    return composeZYX(math.radians(yawDeg), math.radians(pitchDeg), math.radians(rollDeg))

def matVec3(A, v):
    return [
        A[0][0] * v[0] + A[0][1] * v[1] + A[0][2] * v[2],
        A[1][0] * v[0] + A[1][1] * v[1] + A[1][2] * v[2],
        A[2][0] * v[0] + A[2][1] * v[1] + A[2][2] * v[2]
    ]

def transpose3(A):
    return [[A[j][i] for j in range(3)] for i in range(3)]

def crossProduct(a, b):
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ]

def hat(w):
    return [
        [    0, -w[2],  w[1]],
        [ w[2],     0, -w[0]],
        [-w[1],  w[0],     0]
    ]

print("=== 1. Testing Proof 1: Cross Product Equivariance ===")
random.seed(42)
for trial in range(20):
    v = [random.uniform(-5, 5) for _ in range(3)]
    w = [random.uniform(-5, 5) for _ in range(3)]
    yaw = random.uniform(-180, 180)
    pitch = random.uniform(-180, 180)
    roll = random.uniform(-180, 180)

    R = computeR(yaw, pitch, roll)

    # LHS: R(v x w)
    vw = crossProduct(v, w)
    lhs = matVec3(R, vw)

    # RHS: R(v) x R(w)
    Rv = matVec3(R, v)
    Rw = matVec3(R, w)
    rhs = crossProduct(Rv, Rw)

    err = math.sqrt(sum((lhs[i] - rhs[i])**2 for i in range(3)))
    assert err < 1e-10, f"Trial {trial} failed: err = {err}"

print("Proof 1: Cross Product Equivariance R(v x w) == R(v) x R(w) PASSED (20 random trials)!")

print("=== 2. Testing Proof 2: Skew-Symmetric Adjoint Identity ===")
for trial in range(20):
    w = [random.uniform(-5, 5) for _ in range(3)]
    yaw = random.uniform(-180, 180)
    pitch = random.uniform(-180, 180)
    roll = random.uniform(-180, 180)

    R = computeR(yaw, pitch, roll)
    Rt = transpose3(R)

    # LHS: R * hat(w) * R^T
    what = hat(w)
    Rwhat = matMul3(R, what)
    lhs = matMul3(Rwhat, Rt)

    # RHS: hat(R * w)
    Rw = matVec3(R, w)
    rhs = hat(Rw)

    max_diff = max(abs(lhs[i][j] - rhs[i][j]) for i in range(3) for j in range(3))
    assert max_diff < 1e-10, f"Trial {trial} failed: max_diff = {max_diff}"

print("Proof 2: Skew-Symmetric Adjoint R hat(w) R^T == hat(Rw) PASSED (20 random trials)!")
print("\n--- ALL KINEMATICS PROOFS MATHEMATICS 100% VERIFIED ---")
