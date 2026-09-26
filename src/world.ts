import * as THREE from 'three';

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
  scene.fog = new THREE.Fog(0xa8d2d8, 700, 1900);

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

  scene.add(groundPlane(4000, 4000, 0x3a8ca4, -4.2));
  const sand = new THREE.Mesh(
    new THREE.CylinderGeometry(590, 620, 9, 48),
    new THREE.MeshStandardMaterial({ color: 0xd9c99d, roughness: 1, flatShading: true }),
  );
  sand.position.y = -5.9;
  sand.receiveShadow = true;
  scene.add(sand);
  const grass = new THREE.Mesh(
    new THREE.CylinderGeometry(560, 585, 8, 48),
    new THREE.MeshStandardMaterial({ color: 0x839f72, roughness: 1, flatShading: true }),
  );
  grass.position.y = -3.9;
  grass.receiveShadow = true;
  scene.add(grass);

  scene.add(groundPlane(52, 540, 0xbaa984, 0.16));
  scene.add(groundPlane(38, 520, 0x39484a, 0.18));
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
  return { scene, renderer, camera, jet, gear };
}
