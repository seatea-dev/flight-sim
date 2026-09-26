import * as THREE from 'three';
import { GameSession, type GroundInput, type GroundState } from './session';
import { createWorld } from './world';
import './style.css';

const sceneElement = document.querySelector<HTMLElement>('#scene')!;
const startScreen = document.querySelector<HTMLElement>('#start-screen')!;
const beginButton = document.querySelector<HTMLButtonElement>('#begin-button')!;
const hud = document.querySelector<HTMLElement>('#hud')!;
const throttleValue = document.querySelector<HTMLElement>('#throttle-value')!;
const throttleFill = document.querySelector<HTMLElement>('#throttle-fill')!;

const session = new GameSession();
const heldKeys = new Set<string>();
const { scene, renderer, camera, jet } = createWorld(sceneElement);
const initialPose = cameraPose(session.state);
const cameraTarget = initialPose.target;
camera.position.copy(initialPose.position);
camera.lookAt(cameraTarget);
let previousTime = 0;

function cameraPose(state: GroundState) {
  return {
    position: new THREE.Vector3(
      state.x - Math.sin(state.heading) * 28,
      11.65,
      state.z + Math.cos(state.heading) * 28,
    ),
    target: new THREE.Vector3(
      state.x + Math.sin(state.heading) * 22,
      3.5,
      state.z - Math.cos(state.heading) * 22,
    ),
  };
}

function groundInput(): GroundInput {
  return {
    throttleUp: heldKeys.has('ShiftLeft') || heldKeys.has('ShiftRight'),
    throttleDown: heldKeys.has('ControlLeft') || heldKeys.has('ControlRight'),
    steerLeft: heldKeys.has('KeyA'),
    steerRight: heldKeys.has('KeyD'),
    brake: heldKeys.has('Space'),
  };
}

beginButton.addEventListener('click', () => {
  session.begin();
  startScreen.hidden = true;
  hud.hidden = false;
  heldKeys.clear();
  beginButton.blur();
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') event.preventDefault();
  heldKeys.add(event.code);
});
window.addEventListener('keyup', (event) => heldKeys.delete(event.code));
window.addEventListener('blur', () => heldKeys.clear());

window.addEventListener('resize', () => {
  const width = sceneElement.clientWidth;
  const height = sceneElement.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

renderer.setAnimationLoop((time) => {
  const elapsedSeconds = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
  previousTime = time;
  const state = session.update(groundInput(), elapsedSeconds);
  jet.position.set(state.x, 2.65, state.z);
  jet.rotation.y = -state.heading;

  const desiredPose = cameraPose(state);
  const smoothing = 1 - Math.exp(-3.5 * elapsedSeconds);
  camera.position.lerp(desiredPose.position, smoothing);
  cameraTarget.lerp(desiredPose.target, smoothing);
  camera.lookAt(cameraTarget);

  const percent = Math.round(state.throttle * 100);
  throttleValue.textContent = `${percent}%`;
  throttleFill.style.width = `${percent}%`;
  renderer.render(scene, camera);
});
