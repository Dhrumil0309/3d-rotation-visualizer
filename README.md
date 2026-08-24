# 3D Rotational Kinematics Visualizer

**[ View the Live Interactive App Here](https://dhrumil0309.github.io/3d-rotation-visualizer/)**

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
A rotation matrix maps a vector from the Body Frame to the Ground Frame. For a Z-Y-X intrinsic rotation sequence, the final orientation is achieved by multiplying three fundamental rotation matrices:

**Rotation around X-axis (Roll):**
```math
R_X(\text{roll}) = \begin{bmatrix} 
1 & 0 & 0 \\ 
0 & \cos(\text{roll}) & -\sin(\text{roll}) \\ 
0 & \sin(\text{roll}) & \cos(\text{roll}) 
\end{bmatrix}
```

**Rotation around Y-axis (Pitch):**
```math
R_Y(\text{pitch}) = \begin{bmatrix} 
\cos(\text{pitch}) & 0 & \sin(\text{pitch}) \\ 
0 & 1 & 0 \\ 
-\sin(\text{pitch}) & 0 & \cos(\text{pitch}) 
\end{bmatrix}
```

**Rotation around Z-axis (Yaw):**
```math
R_Z(\text{yaw}) = \begin{bmatrix} 
\cos(\text{yaw}) & -\sin(\text{yaw}) & 0 \\ 
\sin(\text{yaw}) & \cos(\text{yaw}) & 0 \\ 
0 & 0 & 1 
\end{bmatrix}
```

**The Combined Transformation Matrix:**
To get the final combined matrix $R$, we multiply these together in the order $R = R_Z(\text{yaw}) \times R_Y(\text{pitch}) \times R_X(\text{roll})$. The fully expanded matrix mapping the body coordinates to the ground coordinates is:

```math
\begin{bmatrix} 
x_{\text{ground}} \\ 
y_{\text{ground}} \\ 
z_{\text{ground}} 
\end{bmatrix} 
= 
\begin{bmatrix} 
\cos(\text{yaw})\cos(\text{pitch}) & \cos(\text{yaw})\sin(\text{pitch})\sin(\text{roll}) - \sin(\text{yaw})\cos(\text{roll}) & \cos(\text{yaw})\sin(\text{pitch})\cos(\text{roll}) + \sin(\text{yaw})\sin(\text{roll}) \\ 
\sin(\text{yaw})\cos(\text{pitch}) & \sin(\text{yaw})\sin(\text{pitch})\sin(\text{roll}) + \cos(\text{yaw})\cos(\text{roll}) & \sin(\text{yaw})\sin(\text{pitch})\cos(\text{roll}) - \cos(\text{yaw})\sin(\text{roll}) \\ 
-\sin(\text{pitch}) & \cos(\text{pitch})\sin(\text{roll}) & \cos(\text{pitch})\cos(\text{roll}) 
\end{bmatrix} 
\begin{bmatrix} 
x_{\text{body}} \\ 
y_{\text{body}} \\ 
z_{\text{body}} 
\end{bmatrix}
```

### 2. 3 Rotations vs. 1 Rotation (Euler's Theorem)
If a body frame is inclined across all three axes, reaching that state via Euler Angles requires **3 separate sequential rotations**. However, Euler's Rotation Theorem states that any 3D orientation can be achieved by exactly **1 single rotation** around a specific Principal Axis.

The visualizer calculates this single Principal Rotation Angle $\theta_p$ directly from the trace of our rotation matrix $R$:

```math
\theta_p = \arccos\left(\frac{\text{tr}(R) - 1}{2}\right)
```

### 3. Orthogonal Invariance
For any valid spatial rotation, the determinant of the transformation matrix is invariant, proving the rigid body does not stretch, skew, or reflect during rotation:

```math
\det(R) = 1
```

## Kinematics Proofs Mode

The application includes an interactive **Kinematics Proofs** suite accessible via the top-level mode switcher, demonstrating fundamental Lie group and rotational identities with frame-by-frame 3D and matrix verification:

### Proof 1: Cross Product Equivariance
Demonstrates that the rotation operator distributes across the vector cross product:
$$R(\vec{v} \times \vec{\omega}) = R(\vec{v}) \times R(\vec{\omega})$$
- **Interactive SLERP Animation**: Smoothly rotates vectors $\vec{v}$ (Cyan) and $\vec{\omega}$ (Magenta) using quaternion SLERP interpolation.
- **Visual Coincidence**: Renders the LHS $R(\vec{v} \times \vec{\omega})$ as a glowing yellow arrow and the RHS $R(\vec{v}) \times R(\vec{\omega})$ as an orange wireframe outline, proving continuous coincidence across all $t \in [0, 1]$.
- **Pre-rotation Ghosts**: Semi-transparent ghost vectors persist at the original unrotated coordinates.
- **Real-Time Verification**: Live calculation of Euclidean distance $| \text{LHS} - \text{RHS} | < 10^{-6}$ with success pulse.

### Proof 2: Skew-Symmetric Adjoint Transformation
Demonstrates the Lie group adjoint identity on the Lie algebra $\mathfrak{so}(3)$:
$$R\,\hat{\omega}\,R^T = \widehat{(R\,\omega)}$$
- **KaTeX Typeset Equations**: Rigorous symbolic lemma presentation.
- **Step-by-Step LHS Derivation**: Displays reactive $3 \times 3$ matrix grids for $\hat{\omega}$, $R \cdot \hat{\omega}$, and $(R \cdot \hat{\omega}) \cdot R^T$.
- **Step-by-Step RHS Derivation**: Displays transformed vector $R\vec{\omega}$ and its skew-symmetric cross-product matrix $\widehat{(R\omega)}$.
- **Cell-by-Cell Equivalence Check**: Reactive 9-cell comparison matrix with green match indicators confirming $\max_{i,j} | \text{LHS}_{ij} - \text{RHS}_{ij} | < 10^{-6}$.
- **3D Preview Viewport**: Visual preview comparing $\vec{\omega}$ and $R\vec{\omega}$.

## Tech Stack
* **Frontend:** HTML5, CSS3 (Responsive Grid/Flexbox UI)
* **3D Graphics:** [Three.js](https://threejs.org/)
* **Mathematics:** [Math.js](https://mathjs.org/) (for complex matrix operations and vector algebra)

## How to Run Locally
This application runs entirely client-side and does not require a backend server. 

**Option 1: Clone and Run**
1. Clone the repository: 
   ```bash
   git clone https://github.com/Dhrumil0309/3d-rotation-visualizer.git
   ```
2. Navigate to the project directory.
3. Open `index.html` in any modern web browser. 

**Option 2: Direct File Open**
Open `index.html` directly in a browser supporting local ES modules.

## Author
**Bhutaiya Dhrumil Pareshbhai**  
*B.Tech in Mechanical Engineering, Indian Institute of Technology Gandhinagar (IITGN)*