import * as THREE from 'three';
import { GameAudio } from './audio';
import { keyboardInput } from './controls';
import { DISTANT_RETURN_RADIUS } from './route';
import { GameSession, type FlightState } from './session';
import { createWorld } from './world';
import './style.css';

const sceneElement = document.querySelector<HTMLElement>('#scene')!;
const startScreen = document.querySelector<HTMLElement>('#start-screen')!;
const beginButton = document.querySelector<HTMLButtonElement>('#begin-button')!;
const pauseScreen = document.querySelector<HTMLElement>('#pause-screen')!;
const resumeButton = document.querySelector<HTMLButtonElement>('#resume-button')!;
const soundStatus = document.querySelector<HTMLElement>('#sound-status')!;
const pauseSoundStatus = document.querySelector<HTMLElement>('#pause-sound-status')!;
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
const resultScreen = document.querySelector<HTMLElement>('#result-screen')!;
const resultLabel = document.querySelector<HTMLElement>('#result-label')!;
const resultTitle = document.querySelector<HTMLElement>('#result-title')!;
const resultDetail = document.querySelector<HTMLElement>('#result-detail')!;

const session = new GameSession();
const audio = new GameAudio();
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
  audio.start();
  startScreen.hidden = true;
  hud.hidden = false;
  heldKeys.clear();
  beginButton.blur();
});

function showSoundState() {
  soundStatus.textContent = audio.isMuted ? 'SOUND OFF' : 'SOUND ON';
  pauseSoundStatus.textContent = audio.isMuted ? 'Sound off' : 'Sound on';
}

function resumeFlight() {
  session.resume();
  pauseScreen.hidden = true;
  heldKeys.clear();
  resumeButton.blur();
}

resumeButton.addEventListener('click', resumeFlight);

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'Escape') event.preventDefault();
  if (event.code === 'KeyM') {
    if (!event.repeat) {
      audio.toggleMute();
      showSoundState();
    }
    return;
  }
  if (event.code === 'Escape') {
    if (session.state.started && !session.state.result && !event.repeat) {
      if (session.state.paused) {
        resumeFlight();
      } else {
        session.pause();
        heldKeys.clear();
        pauseScreen.hidden = false;
        resumeButton.focus();
      }
    }
    return;
  }
  if (event.code === 'KeyR' && session.state.started && !event.repeat) {
    session.restart();
    heldKeys.clear();
    const pose = cameraPose(session.state);
    camera.position.copy(pose.position);
    cameraTarget.copy(pose.target);
    camera.lookAt(cameraTarget);
    resultScreen.hidden = true;
    pauseScreen.hidden = true;
    resumeButton.blur();
    return;
  }
  if (session.state.started && !session.state.paused && !session.state.result)
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
  const previousState = session.state;
  const state = session.update(keyboardInput(heldKeys), elapsedSeconds);
  audio.update(state);
  if (state.landmarkPasses > previousState.landmarkPasses) audio.cue('landmark');
  if (state.result && !previousState.result) audio.cue(state.result);
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
  objectiveTitle.textContent = state.landingPending
    ? 'Brake to stop'
    : state.objective === 'takeoff'
      ? 'Take off from the runway'
      : state.objective === 'return'
        ? 'Return to the runway'
        : 'Fly past the lighthouse';
  objectiveDetail.textContent = state.landingPending
    ? 'Touchdown. Brake to finish the circuit.'
    : state.objective === 'takeoff'
      ? 'Build speed, then hold S to raise the nose.'
      : state.objective === 'return'
        ? 'Use the runway cue to turn back toward the island.'
        : state.distanceFromRunway > DISTANT_RETURN_RADIUS
          ? 'Far from the island. Follow the runway cue to return.'
          : 'Look for the striped lighthouse beyond the north shore.';
  landmarkNotice.hidden = state.landmarkNoticeSeconds <= 0;
  returnCue.hidden = state.runwayBearing === null || state.landingPending || !!state.result;
  if (state.runwayBearing !== null) {
    returnArrow.style.transform = `rotate(${state.runwayBearing}rad)`;
  }
  flightStatus.textContent = state.airborne
    ? state.speed < 23
      ? 'LOW AIRSPEED'
      : 'AIRBORNE'
    : 'ON GROUND';
  resultScreen.hidden = state.result === null;
  if (state.result) {
    resultLabel.textContent = state.result === 'crash' ? 'FLIGHT ENDED' : 'CIRCUIT RESULT';
    resultTitle.textContent =
      state.result === 'complete'
        ? 'Circuit complete'
        : state.result === 'incomplete'
          ? 'Incomplete circuit'
          : 'Crash';
    resultDetail.textContent =
      state.result === 'complete'
        ? 'You passed the lighthouse and stopped on the runway.'
        : state.result === 'incomplete'
          ? 'You landed safely, but missed the lighthouse.'
          : state.crashReason === 'hard landing'
            ? 'The touchdown was too fast, steep, or misaligned.'
            : state.crashReason === 'off runway'
              ? 'The jet touched down outside the runway.'
              : `The jet hit ${state.crashReason === 'structure' ? 'a structure' : state.crashReason === 'water' ? 'the water' : 'the terrain'}.`;
  }
  flightHint.textContent = state.airborne
    ? 'W NOSE DOWN · S NOSE UP · A / D BANK · Q / E YAW'
    : 'A / D STEER · SPACE BRAKE';
  renderer.render(scene, camera);
});
