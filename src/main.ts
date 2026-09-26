import * as THREE from 'three';
import { keyboardInput } from './controls';
import { DISTANT_RETURN_RADIUS } from './route';
import { GameSession, type FlightState } from './session';
import { createWorld } from './world';
import './style.css';

const sceneElement = document.querySelector<HTMLElement>('#scene')!;
const startScreen = document.querySelector<HTMLElement>('#start-screen')!;
const beginButton = document.querySelector<HTMLButtonElement>('#begin-button')!;
const hud = document.querySelector<HTMLElement>('#hud')!;
const throttleValue = document.querySelector<HTMLElement>('#throttle-value')!;
const throttleFill = document.querySelector<HTMLElement>('#throttle-fill')!;
const airspeedValue = document.querySelector<HTMLElement>('#airspeed-value')!;
const altitudeValue = document.querySelector<HTMLElement>('#altitude-value')!;
const objectiveLabel = document.querySelector<HTMLElement>('#objective-label')!;
const objectiveTitle = document.querySelector<HTMLElement>('#objective-title')!;
const objectiveDetail = document.querySelector<HTMLElement>('#objective-detail')!;
const landmarkNotice = document.querySelector<HTMLElement>('#landmark-notice')!;
const returnCue = document.querySelector<HTMLElement>('#return-cue')!;
const returnArrow = document.querySelector<HTMLElement>('#return-arrow')!;
const flightStatus = document.querySelector<HTMLElement>('#flight-status')!;
const flightHint = document.querySelector<HTMLElement>('#flight-hint')!;

const session = new GameSession();
const heldKeys = new Set<string>();
const { scene, renderer, camera, jet, gear, ocean } = createWorld(sceneElement);
const initialPose = cameraPose(session.state);
const cameraTarget = initialPose.target;
camera.position.copy(initialPose.position);
camera.lookAt(cameraTarget);
let previousTime = 0;

function cameraPose(state: FlightState) {
  return {
    position: new THREE.Vector3(
      state.x - Math.sin(state.heading) * 28,
      state.altitude + 11.65,
      state.z + Math.cos(state.heading) * 28,
    ),
    target: new THREE.Vector3(
      state.x + Math.sin(state.heading) * 22,
      state.altitude + 3.5,
      state.z - Math.cos(state.heading) * 22,
    ),
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
  const state = session.update(keyboardInput(heldKeys), elapsedSeconds);
  ocean.position.x = state.x;
  ocean.position.z = state.z;
  jet.position.set(state.x, 2.65 + state.altitude, state.z);
  jet.rotation.order = 'YXZ';
  jet.rotation.y = -state.heading;
  jet.rotation.x = state.pitch;
  jet.rotation.z = -state.bank;
  gear.visible = state.gearDown;

  const desiredPose = cameraPose(state);
  const smoothing = 1 - Math.exp(-3.5 * elapsedSeconds);
  camera.position.lerp(desiredPose.position, smoothing);
  cameraTarget.lerp(desiredPose.target, smoothing);
  camera.lookAt(cameraTarget);

  const percent = Math.round(state.throttle * 100);
  throttleValue.textContent = `${percent}%`;
  throttleFill.style.width = `${percent}%`;
  airspeedValue.textContent = `${Math.round(state.speed * 3.6)}`;
  altitudeValue.textContent = `${Math.round(state.altitude)}`;
  objectiveLabel.textContent =
    state.objective === 'takeoff'
      ? 'RUNWAY START'
      : state.objective === 'return'
        ? 'RETURN LEG'
        : 'LIGHTHOUSE ROUTE';
  objectiveTitle.textContent =
    state.objective === 'takeoff'
      ? 'Take off from the runway'
      : state.objective === 'return'
        ? 'Return to the runway'
        : 'Fly past the lighthouse';
  objectiveDetail.textContent =
    state.objective === 'takeoff'
      ? 'Build speed, then hold S to raise the nose.'
      : state.objective === 'return'
        ? 'Use the runway cue to turn back toward the island.'
        : state.distanceFromRunway > DISTANT_RETURN_RADIUS
          ? 'Far from the island. Follow the runway cue to return.'
          : 'Look for the striped lighthouse beyond the north shore.';
  landmarkNotice.hidden = state.landmarkNoticeSeconds <= 0;
  returnCue.hidden = state.runwayBearing === null;
  if (state.runwayBearing !== null) {
    returnArrow.style.transform = `rotate(${state.runwayBearing}rad)`;
  }
  flightStatus.textContent = state.airborne
    ? state.speed < 23
      ? 'LOW AIRSPEED'
      : 'AIRBORNE'
    : 'ON GROUND';
  flightHint.textContent = state.airborne
    ? 'W NOSE DOWN · S NOSE UP · A / D BANK · Q / E YAW'
    : 'A / D STEER · SPACE BRAKE';
  renderer.render(scene, camera);
});
