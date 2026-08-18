# 3D Rotational Kinematics Visualizer

**[ View the Live Interactive App Here](https://dhrumil0309.github.io/3d-rotation-visualizer/)**

## Overview
Understanding spatial transformations is a critical foundation for mechanical engineering, robotics, and autonomous systems (such as localization and sensor fusion). This interactive web application serves as a real-time mathematical bridge between visual frame orientations and their underlying algebraic representations. 

Users can manually manipulate a rigid body frame relative to a fixed ground frame using Z-Y-X Euler angles, instantly outputting the corresponding rotation matrix, principal rotation parameters, and spatial translations.

## Key Features
* **Interactive 3D Rendering:** Smooth, real-time visualization of a fixed Ground Frame and a dynamic Body Frame using Three.js, complete with orbit, pan, and zoom controls.
* **Precision Controls:** Bi-directional input via sliders and numeric text boxes for exact angular manipulation without slider jitter.
* **Dynamic Matrix Algebra:** Real-time calculation and display of the $3 \times 3$ rotation matrix $R$ that maps the body frame to the reference frame.
* **Euler's Rotation Theorem:** Calculates and displays the principal rotation angle $\theta$ directly from the matrix trace.
* **Principal Axis Visualization:** Features a toggleable 3D vector representing the instantaneous axis of rotation $(l, m, n)$ required to align the frames perfectly.
* **Spatial Translation $SE(3)$:** Additional controls to apply X, Y, and Z origin offsets, expanding the visualization from pure rotation to a full rigid body transformation.
* **Mathematical Invariants:** Live readout of the matrix determinant to verify proper orthogonal rotations (where $\det(R) = 1$).

## Mathematical Background
The tool visually demonstrates the mapping of a 3D coordinate frame into the Special Orthogonal Group $SO(3)$. The principal rotation angle $\theta$ is extracted from the trace of the rotation matrix $R$:

$$ \theta = \arccos\left(\frac{\text{tr}(R) - 1}{2}\right) $$

For any valid spatial rotation, the determinant of the transformation matrix is invariant:

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
