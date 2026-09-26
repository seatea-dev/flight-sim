import type { FlightInput } from './session';

export function keyboardInput(heldKeys: ReadonlySet<string>): FlightInput {
  return {
    throttleUp: heldKeys.has('ShiftLeft') || heldKeys.has('ShiftRight'),
    throttleDown: heldKeys.has('ControlLeft') || heldKeys.has('ControlRight'),
    steerLeft: heldKeys.has('KeyA'),
    steerRight: heldKeys.has('KeyD'),
    pitchUp: heldKeys.has('KeyS'),
    pitchDown: heldKeys.has('KeyW'),
    yawLeft: heldKeys.has('KeyQ'),
    yawRight: heldKeys.has('KeyE'),
    brake: heldKeys.has('Space'),
  };
}
