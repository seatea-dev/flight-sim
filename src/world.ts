import * as THREE from 'three';
import {
  BUILDINGS,
  HILLS,
  ISLAND_RADIUS,
  LIGHTHOUSE,
  ROCKS,
  RUNWAY_HALF_LENGTH,
  RUNWAY_HALF_WIDTH,
  TREES,
} from './route';

const material = (color: number) =>
  new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true });

function coastLayer(radius: number, top: number, bottom: number, color: number) {
  const points: number[] = [];
  const segments = 48;
  const shoreline = (angle: number) =>
    radius * (1 + 0.035 * Math.sin(angle * 5) + 0.025 * Math.cos(angle * 9));
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const b = ((i + 1) / segments) * Math.PI * 2;
    const ax = Math.sin(a) * shoreline(a);
    const az = Math.cos(a) * shoreline(a);
    const bx = Math.sin(b) * shoreline(b);
    const bz = Math.cos(b) * shoreline(b);
    points.push(0, top, 0, ax, top, az, bx, top, bz);
    points.push(ax, top, az, ax, bottom, az, bx, top, bz);
    points.push(bx, top, bz, ax, bottom, az, bx, bottom, bz);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material(color));
  mesh.receiveShadow = true;
  return mesh;
}

function addTree(scene: THREE.Scene, x: number, z: number, scale = 1) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 7, 5), material(0x705c43));
  trunk.position.set(x, 3.5, z);
  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(7 * scale, 18 * scale, 6),
    material(0x426c5e),
  );
  crown.position.set(x, 14 * scale, z);
  crown.castShadow = true;
  scene.add(trunk, crown);
}

function addBuilding(scene: THREE.Scene, x: number, z: number, width: number, depth: number) {
  const walls = new THREE.Mesh(new THREE.BoxGeometry(width, 11, depth), material(0xd6d0b8));
  walls.position.set(x, 5.5, z);
  walls.castShadow = true;
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(width, depth) * 0.78, 6, 4),
    material(0xb46e54),
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.set(x, 14, z);
  roof.castShadow = true;
  scene.add(walls, roof);
}

function addScenery(scene: THREE.Scene) {
  const hillColors = [0x78956d, 0x6f8d68, 0x8aa073];
  for (const [x, z, radius, height, shade] of HILLS) {
    const hill = new THREE.Mesh(
      new THREE.ConeGeometry(radius, height, 7),
      material(hillColors[shade]),
    );
    hill.position.set(x, height / 2 - 1, z);
    hill.receiveShadow = true;
    hill.castShadow = true;
    scene.add(hill);
  }

  for (const [x, z, scale] of TREES) addTree(scene, x, z, scale);

  for (const [x, z, width, depth] of BUILDINGS) addBuilding(scene, x, z, width, depth);

  const rock = material(0x737c73);
  const paleRock = material(0x9d9e86);
  for (const [x, z, radius, height] of ROCKS) {
    const outcrop = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.72, radius, height, 7),
      radius > 50 ? rock : paleRock,
    );
    outcrop.position.set(x, height / 2 - 3, z);
    outcrop.castShadow = true;
    outcrop.receiveShadow = true;
    scene.add(outcrop);
  }

  const lighthouse = new THREE.Group();
  lighthouse.position.set(LIGHTHOUSE.x, 28, LIGHTHOUSE.z);
  const white = material(0xf4eddb);
  const red = material(0xc95d4d);
  const lantern = new THREE.MeshStandardMaterial({
    color: 0xffedb2,
    emissive: 0xffc971,
    emissiveIntensity: 1.8,
    roughness: 0.3,
  });
  for (let band = 0; band < 5; band++) {
    const towerBand = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5 - band * 0.48, 6 - band * 0.48, 8, 10),
      band % 2 ? red : white,
    );
    towerBand.position.y = 4 + band * 8;
    towerBand.castShadow = true;
    lighthouse.add(towerBand);
  }
  const gallery = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 6.4, 2, 12), red);
  gallery.position.y = 41;
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 8, 10), lantern);
  beacon.position.y = 46;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(6.3, 5, 10), red);
  cap.position.y = 53;
  cap.castShadow = true;
  lighthouse.add(gallery, beacon, cap);
  scene.add(lighthouse);
}

function groundPlane(width: number, length: number, color: number, height: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length),
    new THREE.MeshStandardMaterial({ color, roughness: 1 }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = height;
  mesh.receiveShadow = true;
  return mesh;
}

function wing(points: [number, number][], color: number, height: number): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(...points[0]);
  for (const point of points.slice(1)) shape.lineTo(...point);
  shape.closePath();
  const mesh = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshStandardMaterial({
      color,
      side: THREE.DoubleSide,
      metalness: 0.22,
      roughness: 0.68,
    }),
  );
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = height;
  mesh.castShadow = true;
  return mesh;
}

function makeJet() {
  const jet = new THREE.Group();
  const gear = new THREE.Group();
  jet.add(gear);
  const ivory = new THREE.MeshStandardMaterial({
    color: 0xe5e4d8,
    metalness: 0.25,
    roughness: 0.58,
  });
  const orange = new THREE.MeshStandardMaterial({
    color: 0xdb744c,
    metalness: 0.2,
    roughness: 0.64,
  });
  const canopy = new THREE.MeshStandardMaterial({
    color: 0x315463,
    metalness: 0.28,
    roughness: 0.2,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x26383a, roughness: 0.85 });

  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.83, 1.05, 9.4, 10), ivory);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.set(0, 0.15, 0.3);
  fuselage.castShadow = true;
  jet.add(fuselage);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.83, 2.8, 10), orange);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0.15, -5.8);
  nose.castShadow = true;
  jet.add(nose);

  const wings = wing(
    [
      [0, -1.6],
      [7.5, 1.4],
      [8, 2.35],
      [1, 1.5],
      [-1, 1.5],
      [-8, 2.35],
      [-7.5, 1.4],
    ],
    0xe5e4d8,
    0.2,
  );
  jet.add(wings);

  const leftWingAccent = wing(
    [
      [-7.45, 1.45],
      [-5.4, 1.05],
      [-5.1, 1.55],
      [-7.8, 2.23],
    ],
    0xdb744c,
    0.22,
  );
  const rightWingAccent = wing(
    [
      [7.45, 1.45],
      [5.4, 1.05],
      [5.1, 1.55],
      [7.8, 2.23],
    ],
    0xdb744c,
    0.22,
  );
  jet.add(leftWingAccent, rightWingAccent);

  const tailplane = wing(
    [
      [0, 3.3],
      [3.15, 4.35],
      [3.25, 4.9],
      [0, 4.45],
      [-3.25, 4.9],
      [-3.15, 4.35],
    ],
    0xe5e4d8,
    0.6,
  );
  jet.add(tailplane);

  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(2.8, 0);
  finShape.lineTo(2.3, 2.7);
  finShape.lineTo(1.65, 3.2);
  finShape.closePath();
  const fin = new THREE.Mesh(
    new THREE.ShapeGeometry(finShape),
    new THREE.MeshStandardMaterial({ color: 0xdb744c, side: THREE.DoubleSide, roughness: 0.7 }),
  );
  fin.rotation.y = Math.PI / 2;
  fin.position.set(0, 0.35, 2.2);
  fin.castShadow = true;
  jet.add(fin);

  const glass = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), canopy);
  glass.scale.set(0.75, 0.48, 1.75);
  glass.position.set(0, 0.75, -1.6);
  glass.castShadow = true;
  jet.add(glass);

  for (const x of [-1.25, 1.25]) {
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.56, 3.1, 10), dark);
    engine.rotation.x = Math.PI / 2;
    engine.position.set(x, -0.4, 2.1);
    engine.castShadow = true;
    jet.add(engine);
    const exhaust = new THREE.Mesh(new THREE.CircleGeometry(0.43, 10), orange);
    exhaust.position.set(x, -0.4, 3.67);
    jet.add(exhaust);
  }

  for (const [x, z] of [
    [-1.8, 1.4],
    [1.8, 1.4],
    [0, -3.1],
  ]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 10), dark);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, -1.85, z);
    wheel.castShadow = true;
    gear.add(wheel);
  }

  jet.position.y = 2.65;
  return { jet, gear };
}

export function createWorld(container: HTMLElement) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa8d2d8);
  scene.fog = new THREE.Fog(0xa8d2d8, 850, 2200);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xe9f8ef, 0x577a72, 2.6));
  const sun = new THREE.DirectionalLight(0xffedc9, 2.4);
  sun.position.set(-130, 200, -160);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -250;
  sun.shadow.camera.right = 250;
  sun.shadow.camera.top = 250;
  sun.shadow.camera.bottom = -250;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 650;
  scene.add(sun);

  const ocean = groundPlane(4000, 4000, 0x3a8ca4, -4.2);
  scene.add(ocean);
  scene.add(coastLayer(610, -1.4, -5.5, 0xd9c99d));
  scene.add(coastLayer(ISLAND_RADIUS, 0.1, -2, 0x839f72));

  addScenery(scene);

  scene.add(groundPlane(52, 540, 0xbaa984, 0.16));
  scene.add(groundPlane(RUNWAY_HALF_WIDTH * 2, RUNWAY_HALF_LENGTH * 2, 0x39484a, 0.18));
  for (let z = -225; z <= 225; z += 35) {
    const centerline = groundPlane(1.2, 14, 0xf5e9ce, 0.2);
    centerline.position.z = z;
    scene.add(centerline);
  }
  for (const side of [-1, 1]) {
    for (let z = -250; z <= 250; z += 20) {
      const edge = groundPlane(0.4, 10, 0xf2debb, 0.2);
      edge.position.x = side * 16.5;
      edge.position.z = z;
      scene.add(edge);
    }
    for (let stripe = 0; stripe < 4; stripe++) {
      const mark = groundPlane(2.2, 9, 0xf5e9ce, 0.2);
      mark.position.set(side * (3.5 + stripe * 3.2), 0.2, -243);
      scene.add(mark);
    }
  }

  const { jet, gear } = makeJet();
  scene.add(jet);
  const camera = new THREE.PerspectiveCamera(
    58,
    container.clientWidth / container.clientHeight,
    0.1,
    2500,
  );
  return { scene, renderer, camera, jet, gear, ocean };
}
