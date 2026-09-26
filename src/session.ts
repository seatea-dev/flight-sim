import {
  BUILDINGS,
  DISTANT_RETURN_RADIUS,
  HILLS,
  ISLAND_RADIUS,
  LANDMARK_RADIUS,
  LIGHTHOUSE,
  ROCKS,
  RUNWAY,
  RUNWAY_HALF_LENGTH,
  RUNWAY_HALF_WIDTH,
  TREES,
} from './route';

export type FlightInput = {
  throttleUp?: boolean;
  throttleDown?: boolean;
  steerLeft?: boolean;
  steerRight?: boolean;
  pitchUp?: boolean;
  pitchDown?: boolean;
  yawLeft?: boolean;
  yawRight?: boolean;
  brake?: boolean;
};

export type FlightState = Readonly<{
  started: boolean;
  paused: boolean;
  x: number;
  z: number;
  altitude: number;
  heading: number;
  pitch: number;
  bank: number;
  speed: number;
  verticalSpeed: number;
  throttle: number;
  airborne: boolean;
  gearDown: boolean;
  objective: 'takeoff' | 'fly' | 'return';
  landmarkPassed: boolean;
  landmarkPasses: number;
  landmarkNoticeSeconds: number;
  distanceFromRunway: number;
  runwayBearing: number | null;
  landingPending: boolean;
  result: 'complete' | 'incomplete' | 'crash' | null;
  crashReason: 'hard landing' | 'off runway' | 'water' | 'terrain' | 'structure' | null;
}>;

const initialState: FlightState = {
  started: false,
  paused: false,
  x: 0,
  z: 170,
  altitude: 0,
  heading: 0,
  pitch: 0,
  bank: 0,
  speed: 0,
  verticalSpeed: 0,
  throttle: 0,
  airborne: false,
  gearDown: true,
  objective: 'takeoff',
  landmarkPassed: false,
  landmarkPasses: 0,
  landmarkNoticeSeconds: 0,
  distanceFromRunway: 170,
  runwayBearing: null,
  landingPending: false,
  result: null,
  crashReason: null,
};

const tuning = {
  throttleRate: 0.55,
  groundThrust: 42,
  flightThrust: 38,
  brakeStrength: 55,
  takeoffSpeed: 25,
  pitchRate: 0.65,
  bankRate: 1.1,
  yawRate: 0.38,
  gravity: 9.8,
  liftSpeed: 35,
  landingSpeed: 33,
  landingDescent: 10,
  landingHeading: 0.55,
  stopSpeed: 4,
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const axis = (positive?: boolean, negative?: boolean) =>
  Number(Boolean(positive)) - Number(Boolean(negative));
const onRunway = (x: number, z: number) =>
  Math.abs(x - RUNWAY.x) <= RUNWAY_HALF_WIDTH && Math.abs(z - RUNWAY.z) <= RUNWAY_HALF_LENGTH;

function impactAt(
  x: number,
  z: number,
  altitude: number,
): 'water' | 'terrain' | 'structure' | null {
  // The cones and small objects have compact envelopes so near misses remain playable.
  for (const [cx, cz, radius, height] of HILLS) {
    const distance = Math.hypot(x - cx, z - cz);
    if (distance < radius * 0.8 && altitude < height * (1 - distance / radius) - 2)
      return 'terrain';
  }
  for (const [cx, cz, radius, height] of ROCKS) {
    if (Math.hypot(x - cx, z - cz) < radius * 0.8 && altitude < height - 3) return 'terrain';
  }
  for (const [cx, cz, width, depth] of BUILDINGS) {
    if (Math.abs(x - cx) < width / 2 + 2 && Math.abs(z - cz) < depth / 2 + 2 && altitude < 13)
      return 'structure';
  }
  for (const [cx, cz, scale] of TREES) {
    if (Math.hypot(x - cx, z - cz) < 5 * scale && altitude < 18 * scale) return 'structure';
  }
  if (Math.hypot(x - LIGHTHOUSE.x, z - LIGHTHOUSE.z) < 7 && altitude < 55) return 'structure';
  if (altitude <= 0) return Math.hypot(x, z) > ISLAND_RADIUS ? 'water' : 'terrain';
  return null;
}

export class GameSession {
  private current: FlightState;

  constructor(startState: FlightState = initialState) {
    this.current = { ...startState };
  }

  get state(): FlightState {
    return { ...this.current };
  }

  begin(): FlightState {
    this.current = { ...this.current, started: true };
    return this.state;
  }

  pause(): FlightState {
    if (this.current.started && !this.current.result) {
      this.current = { ...this.current, paused: true };
    }
    return this.state;
  }

  resume(): FlightState {
    this.current = { ...this.current, paused: false };
    return this.state;
  }

  restart(): FlightState {
    this.current = { ...initialState, started: true };
    return this.state;
  }

  update(input: FlightInput, elapsedSeconds: number): FlightState {
    if (!this.current.started || this.current.paused || this.current.result || elapsedSeconds <= 0)
      return this.state;

    let remaining = elapsedSeconds;
    while (remaining > 0) {
      const step = Math.min(remaining, 1 / 60);
      const previous = this.current;
      this.advance(input, step);
      this.resolveContact(previous);
      if (this.current.result) break;
      this.updateRoute(step);
      remaining -= step;
    }
    return this.state;
  }

  private advance(input: FlightInput, dt: number): void {
    const previous = this.current;
    const throttle = clamp(
      previous.throttle + axis(input.throttleUp, input.throttleDown) * tuning.throttleRate * dt,
      0,
      1,
    );
    const pitchInput = axis(input.pitchUp, input.pitchDown);
    const pitch =
      previous.airborne || previous.speed >= tuning.takeoffSpeed * 0.6
        ? clamp(
            previous.pitch +
              pitchInput * tuning.pitchRate * dt -
              (pitchInput ? 0 : previous.pitch * 0.7 * dt),
            -0.4,
            0.55,
          )
        : 0;
    const drag = 1.2 + 0.018 * previous.speed ** 2;

    if (!previous.airborne) {
      const acceleration =
        tuning.groundThrust * throttle - drag - (input.brake ? tuning.brakeStrength : 0);
      const speed = clamp(previous.speed + acceleration * dt, 0, 28);
      const steering = axis(input.steerRight, input.steerLeft);
      const heading = previous.heading + steering * Math.min(speed / 30, 1) * 0.45 * dt;
      const airborne = !previous.landingPending && speed >= tuning.takeoffSpeed && pitch >= 0.12;
      this.current = {
        ...previous,
        x: previous.x + Math.sin(heading) * speed * dt,
        z: previous.z - Math.cos(heading) * speed * dt,
        heading,
        speed,
        throttle,
        pitch,
        bank: 0,
        verticalSpeed: airborne ? 1.5 : 0,
        airborne,
        gearDown: true,
        objective: airborne ? (previous.landmarkPassed ? 'return' : 'fly') : previous.objective,
      };
      return;
    }

    const bankInput = axis(input.steerRight, input.steerLeft);
    const bank = clamp(
      previous.bank + bankInput * tuning.bankRate * dt - (bankInput ? 0 : previous.bank * 0.8 * dt),
      -0.65,
      0.65,
    );
    const yaw = axis(input.yawRight, input.yawLeft);
    const controlAuthority = clamp(previous.speed / 28, 0.35, 1);
    const heading = previous.heading + (yaw * tuning.yawRate + bank * 0.72) * controlAuthority * dt;
    const lift =
      tuning.gravity *
      (previous.speed / tuning.liftSpeed) ** 2 *
      clamp(1 + 2 * pitch, 0.2, 2.1) *
      Math.cos(bank);
    const verticalSpeed = clamp(previous.verticalSpeed + (lift - tuning.gravity) * dt, -20, 18);
    const altitude = Math.max(0, previous.altitude + verticalSpeed * dt);
    const speed = clamp(
      previous.speed +
        (tuning.flightThrust * throttle - drag - verticalSpeed * 0.35 - pitch * 3) * dt,
      0,
      48,
    );
    const airborne = altitude > 0 || verticalSpeed > 0;
    this.current = {
      ...previous,
      x: previous.x + Math.sin(heading) * speed * dt,
      z: previous.z - Math.cos(heading) * speed * dt,
      altitude,
      heading,
      pitch,
      bank,
      speed,
      verticalSpeed: airborne ? verticalSpeed : 0,
      throttle,
      airborne,
      gearDown: altitude < 8,
      objective: previous.landmarkPassed ? 'return' : 'fly',
    };
  }

  private resolveContact(previous: FlightState): void {
    const state = this.current;
    if (state.airborne) {
      const impact =
        onRunway(state.x, state.z) && state.altitude <= 0
          ? null
          : impactAt(state.x, state.z, state.altitude);
      if (impact) this.crash(impact);
      return;
    }

    if (previous.airborne) {
      if (!onRunway(state.x, state.z)) {
        this.crash(Math.hypot(state.x, state.z) > ISLAND_RADIUS ? 'water' : 'off runway');
      } else if (
        state.speed > tuning.landingSpeed ||
        -previous.verticalSpeed > tuning.landingDescent ||
        Math.abs(Math.sin(state.heading)) > Math.sin(tuning.landingHeading)
      ) {
        this.crash('hard landing');
      } else {
        this.current = { ...state, landingPending: true, pitch: 0, verticalSpeed: 0 };
      }
    } else if (!onRunway(state.x, state.z)) {
      this.crash(Math.hypot(state.x, state.z) > ISLAND_RADIUS ? 'water' : 'off runway');
    } else if (state.landingPending && state.speed <= tuning.stopSpeed) {
      this.current = { ...state, result: state.landmarkPassed ? 'complete' : 'incomplete' };
    }
  }

  private crash(reason: NonNullable<FlightState['crashReason']>): void {
    this.current = { ...this.current, result: 'crash', crashReason: reason, landingPending: false };
  }

  private updateRoute(dt: number): void {
    const state = this.current;
    const landmarkDistance = Math.hypot(state.x - LIGHTHOUSE.x, state.z - LIGHTHOUSE.z);
    const passed = state.landmarkPassed || (state.airborne && landmarkDistance <= LANDMARK_RADIUS);
    const newlyPassed = passed && !state.landmarkPassed;
    const distanceFromRunway = Math.hypot(state.x - RUNWAY.x, state.z - RUNWAY.z);
    const showRunwayBearing = passed || distanceFromRunway > DISTANT_RETURN_RADIUS;
    const targetHeading = Math.atan2(RUNWAY.x - state.x, state.z - RUNWAY.z);
    const relativeHeading = targetHeading - state.heading;
    this.current = {
      ...state,
      objective: newlyPassed ? 'return' : state.objective,
      landmarkPassed: passed,
      landmarkPasses: state.landmarkPasses + Number(newlyPassed),
      landmarkNoticeSeconds: newlyPassed ? 4 : Math.max(0, state.landmarkNoticeSeconds - dt),
      distanceFromRunway,
      runwayBearing: showRunwayBearing
        ? Math.atan2(Math.sin(relativeHeading), Math.cos(relativeHeading))
        : null,
    };
  }
}
