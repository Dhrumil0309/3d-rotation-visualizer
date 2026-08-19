# 3D Rotational Kinematics Visualizer

**[View the Live Interactive App Here](https://dhrumil0309.github.io/3d-rotation-visualizer/)**

## Overview
Understanding spatial transformations is a critical foundation for mechanical engineering, robotics, and autonomous systems (such as localization and sensor fusion). This interactive web application serves as a real-time mathematical bridge between visual frame orientations and their underlying algebraic representations. 

Users can manually manipulate a rigid body frame relative to a fixed ground frame using Z-Y-X Euler angles, instantly outputting the corresponding rotation matrix, principal rotation parameters, and spatial translations.

## Key Features
* **Interactive 3D Rendering:** Smooth, real-time visualization of a fixed Ground Frame and a dynamic Body Frame using Three.js, complete with orbit, pan, and zoom controls.
* **Dynamic Matrix Algebra:** Real-time calculation and display of the $3 \times 3$ rotation matrix $R$ that maps the body frame to the reference frame.
* **Euler Angles vs. Principal Axis:** Demonstrates the difference between 3 sequential fundamental rotations (Yaw, Pitch, Roll) and the single 1-step transformation defined by Euler's Rotation Theorem.
* **Principal Axis Visualization:** Features a toggleable 3D vector representing the instantaneous axis of rotation $(l, m, n)$ required to align the frames perfectly.
* **Spatial Translation $SE(3)$:** Additional controls to apply X, Y, and Z origin offsets, expanding the visualization from pure rotation to a full rigid body transformation.
* **Mathematical Invariants:** Live readout of the matrix determinant to verify proper orthogonal rotations (where $\det(R) = 1$).

## Mathematical Background

### 1. Frame Transformation Matrix
A rotation matrix maps a vector from the Body Frame to the Ground Frame. For a Z-Y-X intrinsic rotation sequence (Yaw $\psi$, Pitch $\theta$, Roll $\phi$), the combined $3 \times 3$ rotation matrix $R$ is obtained by multiplying the fundamental rotation matrices:

$$ \mathbf{v}_{ground} = R_{Z}(\psi) R_{Y}(\theta) R_{X}(\phi) \mathbf{v}_{body} $$

Expanded using sine ($s$) and cosine ($c$), the matrix multiplication mapping the coordinates looks like this:

$$ \begin{bmatrix} x_{ground} \\ y_{ground} \\ z_{ground} \end{bmatrix} = \begin{bmatrix} c_\psi c_\theta & c_\psi s_\theta s_\phi - s_\psi c_\phi & c_\psi s_\theta c_\phi + s_\psi s_\phi \\ s_\psi c_\theta & s_\psi s_\theta s_\phi + c_\psi c_\phi & s_\psi s_\theta c_\phi - c_\psi s_\phi \\ -s_\theta & c_\theta s_\phi & c_\theta c_\phi \end{bmatrix} \begin{bmatrix} x_{body} \\ y_{body} \\ z_{body} \end{bmatrix} $$

### 2. 3 Rotations vs. 1 Rotation (Euler's Theorem)
If a body frame is inclined across all three axes, reaching that state via Euler Angles requires **3 separate rotations**. However, Euler's Rotation Theorem states that any 3D orientation can be achieved by exactly **1 single rotation** around a specific Principal Axis.

The visualizer calculates this single Principal Rotation Angle $\theta_p$ directly from the trace of our rotation matrix $R$:

$$ \theta_p = \arccos\left(\frac{\text{tr}(R) - 1}{2}\right) $$

### 3. Orthogonal Invariance
For any valid spatial rotation, the determinant of the transformation matrix is invariant, proving the rigid body does not stretch or reflect:

$$ \det(R) = 1 $$

## Tech Stack
* **Frontend:** HTML5, CSS3 (Responsive Grid/Flexbox UI)
* **3D Graphics:** [Three.js](https://threejs.org/)
* **Mathematics:** [Math.js](https://mathjs.org/) (for complex matrix operations and vector algebra)

## How to Run Locally
This application runs entirely client-side and does not require a backend server. 

1. Clone the repository: 
   ```bash
   git clone [https://github.com/Dhrumil0309/3d-rotation-visualizer.git](https://github.com/Dhrumil0309/3d-rotation-visualizer.git)
