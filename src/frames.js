import * as THREE from 'three';

const AXIS_LENGTH = 3.2;
const HEAD_LENGTH = 0.55;
const HEAD_WIDTH = 0.28;

/**
 * Creates a high-DPI text label sprite using a dynamic 2D canvas texture.
 * @param {string} text - Label text (e.g. "X_body", "Y_ground")
 * @param {string} textColor - Hex color for font
 * @param {string} bgColor - Background fill style
 * @param {string} borderColor - Border stroke style
 * @returns {THREE.Sprite} Three.js sprite
 */
export function createTextSprite(text, textColor = '#ffffff', bgColor = 'rgba(15, 17, 23, 0.85)', borderColor = 'rgba(255, 255, 255, 0.2)') {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 144;
  const ctx = canvas.getContext('2d');

  // Background pill badge
  const radius = 24;
  const x = 12;
  const y = 12;
  const w = canvas.width - 24;
  const h = canvas.height - 24;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  ctx.fillStyle = bgColor;
  ctx.fill();

  ctx.lineWidth = 6;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  // Text label
  ctx.fillStyle = textColor;
  ctx.font = 'bold 54px "JetBrains Mono", "SF Mono", "Fira Code", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(1.4, 0.525, 1.0);
  return sprite;
}

/**
 * Builds a single dashed axis line with an arrow tip for the Ground Frame.
 * @param {THREE.Vector3} dir - Unit direction vector
 * @param {number} colorHex - Color integer or hex
 * @returns {THREE.Group} Axis group
 */
function createDashedAxis(dir, colorHex) {
  const group = new THREE.Group();
  const shaftLength = AXIS_LENGTH - HEAD_LENGTH;

  // Dashed line shaft
  const points = [
    new THREE.Vector3(0, 0, 0),
    dir.clone().multiplyScalar(shaftLength)
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineDashedMaterial({
    color: colorHex,
    dashSize: 0.18,
    gapSize: 0.12,
    linewidth: 1
  });
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  group.add(line);

  // Muted cone arrowhead at the tip
  const coneGeo = new THREE.ConeGeometry(HEAD_WIDTH * 0.7, HEAD_LENGTH, 16);
  const coneMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.6,
    metalness: 0.1,
    transparent: true,
    opacity: 0.75
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);

  // Orient cone towards dir
  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
  cone.setRotationFromQuaternion(quat);
  cone.position.copy(dir.clone().multiplyScalar(shaftLength + HEAD_LENGTH / 2));
  group.add(cone);

  return group;
}

/**
 * Builds the static Ground Frame triad.
 * - X axis: #888888 (gray), dashed
 * - Y axis: #aaaaaa (light gray), dashed
 * - Z axis: #666666 (dark gray), dashed
 * @returns {THREE.Group} Ground Frame group
 */
export function buildGroundFrame() {
  const groundGroup = new THREE.Group();
  groundGroup.name = 'groundFrame';

  const axesConfig = [
    {
      dir: new THREE.Vector3(1, 0, 0),
      colorHex: 0x888888,
      colorStr: '#888888',
      label: 'X_ground',
      labelOffset: new THREE.Vector3(AXIS_LENGTH + 0.55, 0, 0)
    },
    {
      dir: new THREE.Vector3(0, 1, 0),
      colorHex: 0xaaaaaa,
      colorStr: '#aaaaaa',
      label: 'Y_ground',
      labelOffset: new THREE.Vector3(0, AXIS_LENGTH + 0.55, 0)
    },
    {
      dir: new THREE.Vector3(0, 0, 1),
      colorHex: 0x666666,
      colorStr: '#666666',
      label: 'Z_ground',
      labelOffset: new THREE.Vector3(0, 0, AXIS_LENGTH + 0.55)
    }
  ];

  axesConfig.forEach(cfg => {
    const axis = createDashedAxis(cfg.dir, cfg.colorHex);
    groundGroup.add(axis);

    const sprite = createTextSprite(
      cfg.label,
      cfg.colorStr,
      'rgba(26, 29, 38, 0.85)',
      cfg.colorStr
    );
    sprite.position.copy(cfg.labelOffset);
    groundGroup.add(sprite);
  });

  // Muted origin indicator
  const originGeo = new THREE.SphereGeometry(0.06, 16, 16);
  const originMat = new THREE.MeshStandardMaterial({
    color: 0x777777,
    roughness: 0.5,
    metalness: 0.2
  });
  const originMesh = new THREE.Mesh(originGeo, originMat);
  groundGroup.add(originMesh);

  return groundGroup;
}

/**
 * Builds the dynamic Body Frame triad.
 * - X axis: #ff3b30 (bold red)
 * - Y axis: #34c759 (bold green)
 * - Z axis: #007aff (bold blue)
 * @returns {THREE.Group} Body Frame group
 */
export function buildBodyFrame() {
  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'bodyFrame';

  const axesConfig = [
    {
      dir: new THREE.Vector3(1, 0, 0),
      colorHex: 0xff3b30,
      colorStr: '#ff3b30',
      label: 'X_body',
      labelOffset: new THREE.Vector3(AXIS_LENGTH + 0.55, 0, 0)
    },
    {
      dir: new THREE.Vector3(0, 1, 0),
      colorHex: 0x34c759,
      colorStr: '#34c759',
      label: 'Y_body',
      labelOffset: new THREE.Vector3(0, AXIS_LENGTH + 0.55, 0)
    },
    {
      dir: new THREE.Vector3(0, 0, 1),
      colorHex: 0x007aff,
      colorStr: '#007aff',
      label: 'Z_body',
      labelOffset: new THREE.Vector3(0, 0, AXIS_LENGTH + 0.55)
    }
  ];

  axesConfig.forEach(cfg => {
    // Solid thick arrow helper
    const arrow = new THREE.ArrowHelper(
      cfg.dir,
      new THREE.Vector3(0, 0, 0),
      AXIS_LENGTH,
      cfg.colorHex,
      HEAD_LENGTH,
      HEAD_WIDTH
    );

    if (arrow.line && arrow.line.material) {
      arrow.line.material.linewidth = 3;
    }
    if (arrow.cone && arrow.cone.material) {
      arrow.cone.material.roughness = 0.3;
      arrow.cone.material.metalness = 0.3;
    }
    bodyGroup.add(arrow);

    const sprite = createTextSprite(
      cfg.label,
      '#ffffff',
      cfg.colorStr,
      'rgba(255, 255, 255, 0.7)'
    );
    sprite.position.copy(cfg.labelOffset);
    bodyGroup.add(sprite);
  });

  // Body origin marker
  const originGeo = new THREE.SphereGeometry(0.08, 16, 16);
  const originMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.8
  });
  const originMesh = new THREE.Mesh(originGeo, originMat);
  bodyGroup.add(originMesh);

  return bodyGroup;
}

/**
 * Builds the visual Euler Principal Rotation Axis helper.
 * @returns {THREE.Group} Axis indicator group
 */
export function buildEulerAxisHelper() {
  const axisGroup = new THREE.Group();
  axisGroup.name = 'eulerAxisGroup';

  const dir = new THREE.Vector3(0, 0, 1);
  const arrow = new THREE.ArrowHelper(
    dir,
    new THREE.Vector3(0, 0, 0),
    AXIS_LENGTH * 1.2,
    0xff9500, // amber
    HEAD_LENGTH * 0.9,
    HEAD_WIDTH * 0.9
  );
  arrow.name = 'eulerArrow';
  axisGroup.add(arrow);

  const label = createTextSprite('Axis (l,m,n)', '#ff9500', 'rgba(25, 20, 10, 0.85)', '#ff9500');
  label.name = 'eulerLabel';
  label.position.set(0, 0, AXIS_LENGTH * 1.2 + 0.6);
  axisGroup.add(label);

  axisGroup.visible = false; // toggled when rotation > 0
  return axisGroup;
}
