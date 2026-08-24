# Interactive Rotational Kinematics Visualizer

A client-side 3D web application to visualize rigid-body rotational kinematics in real time using Three.js and Math.js.

## Features

- **Dual Coordinate Frames**:
  - **Ground Frame (Fixed Reference)**: Rendered with muted, dashed gray lines and axis labels (`X_ground`, `Y_ground`, `Z_ground`).
  - **Body Frame (Rotating Rigid Body)**: Rendered with bold solid Red (X), Green (Y), and Blue (Z) arrows and axis labels (`X_body`, `Y_body`, `Z_body`).
- **Euler Angle Sliders**:
  - Intrinsic **Z-Y-X sequence** (Yaw $\psi$, Pitch $\theta$, Roll $\phi$), ranging from $-180^\circ$ to $+180^\circ$ with $0.5^\circ$ precision.
- **Rotation Matrix $R$**:
  - Computes composite $R = R_z(\psi) \cdot R_y(\theta) \cdot R_x(\phi)$ live on every input movement.
  - Rendered in a formatted 3x3 monospace right-aligned grid to 3 decimal places.
- **Principal Rotation Angle $\theta_p$**:
  - Derived from matrix trace $\text{tr}(R)$ via Euler's rotation theorem: $\theta_p = \arccos\left(\frac{\text{tr}(R) - 1}{2}\right)$.
  - Safeguarded against floating-point drift at domain boundaries.
- **Interactive 3D Viewport**:
  - Full mouse controls via Three.js `OrbitControls` (Left-click drag to orbit, Right-click drag to pan, Scroll to zoom).
  - Spatial reference ground grid and dynamic lighting.
  - "Reset to Identity" button to return all sliders to $0.0^\circ$.

## Running Locally

No build tools, bundlers, or package installations are required.

### Option 1: Using a simple HTTP server (Recommended for ES Modules)
```bash
# Using Node / npx:
npx serve .

# Or using Python:
python -m http.server 8000
```
Then open `http://localhost:8000` (or the port shown in terminal) in any modern web browser.

### Option 2: Direct File Open
Open `index.html` directly in a browser supporting local ES modules.

---

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

