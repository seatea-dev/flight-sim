import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/session';

describe('runway start', () => {
  it('waits for Begin flight, then throttle moves the jet along the runway', () => {
    const session = new GameSession();
    const ready = session.state;

    session.update({ throttleUp: true }, 1);
    expect(session.state).toEqual(ready);

    session.begin();
    session.update({ throttleUp: true }, 1);
    const moving = session.update({}, 1);

    expect(moving.throttle).toBeGreaterThan(0);
    expect(moving.speed).toBeGreaterThan(0);
    expect(moving.z).toBeLessThan(ready.z);
  });

  it('steers while rolling and slows when braking', () => {
    const session = new GameSession();
    session.begin();
    session.update({ throttleUp: true }, 2);
    session.update({}, 2);
    const rolling = session.state;

    const turning = session.update({ steerRight: true }, 1);
    expect(turning.heading).toBeGreaterThan(rolling.heading);
    expect(turning.x).toBeGreaterThan(rolling.x);

    const coasting = session.update({ throttleDown: true }, 0.5);
    expect(coasting.throttle).toBeLessThan(turning.throttle);

    const brakingSession = new GameSession();
    brakingSession.begin();
    brakingSession.update({ throttleUp: true }, 2);
    brakingSession.update({}, 2);
    brakingSession.update({ steerRight: true }, 1);
    brakingSession.update({ throttleDown: true }, 0.5);
    const braking = brakingSession.update({ brake: true }, 0.5);
    const withoutBrake = session.update({}, 0.5);
    expect(braking.speed).toBeLessThan(withoutBrake.speed);
  });
});

function flyFor(session: GameSession, seconds: number, input = {}) {
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
    session.update(input, Math.min(0.05, seconds - elapsed));
  }
  return session.state;
}

describe('takeoff and flight', () => {
  it('lifts off after accelerating and raising the nose', () => {
    const session = new GameSession();
    session.begin();
    flyFor(session, 5, { throttleUp: true });
    const rolling = session.state;
    expect(rolling.altitude).toBe(0);
    expect(rolling.gearDown).toBe(true);

    const flying = flyFor(session, 4, { pitchUp: true });
    expect(flying.airborne).toBe(true);
    expect(flying.altitude).toBeGreaterThan(2);
    expect(flying.speed).toBeGreaterThan(rolling.speed);
    expect(flying.objective).toBe('fly');
    expect(flying.gearDown).toBe(false);
  });

  it('stays on the runway without raising the nose', () => {
    const session = new GameSession();
    session.begin();
    flyFor(session, 8, { throttleUp: true });
    expect(session.state.airborne).toBe(false);
    expect(session.state.altitude).toBe(0);
  });

  it('banks and yaws in flight while pitch changes climb', () => {
    const session = new GameSession();
    session.begin();
    flyFor(session, 5, { throttleUp: true });
    flyFor(session, 4, { pitchUp: true });
    flyFor(session, 0.5);
    const level = session.state;
    const turning = flyFor(session, 1, { steerRight: true, pitchUp: true });
    expect(turning.bank).toBeGreaterThan(0);
    expect(turning.heading).toBeGreaterThan(level.heading);
    expect(turning.pitch).toBeGreaterThan(level.pitch);
    expect(turning.altitude).toBeGreaterThan(level.altitude);

    const correcting = flyFor(session, 1, { steerLeft: true, yawLeft: true, pitchDown: true });
    expect(correcting.bank).toBeLessThan(turning.bank);
    expect(correcting.pitch).toBeLessThan(turning.pitch);
  });

  it('yaws in either direction without banking', () => {
    const session = new GameSession();
    session.begin();
    flyFor(session, 5, { throttleUp: true });
    flyFor(session, 4, { pitchUp: true });
    const straight = session.state;
    const right = flyFor(session, 1, { yawRight: true });
    const left = flyFor(session, 2, { yawLeft: true });
    expect(right.heading).toBeGreaterThan(straight.heading);
    expect(left.heading).toBeLessThan(right.heading);
    expect(right.bank).toBe(0);
  });

  it('loses lift when slow and recovers after throttle is restored', () => {
    const session = new GameSession();
    session.begin();
    flyFor(session, 5, { throttleUp: true });
    flyFor(session, 8, { pitchUp: true });
    flyFor(session, 2, { throttleDown: true });
    const cruising = session.state;
    const slow = flyFor(session, 5);
    expect(slow.speed).toBeLessThan(cruising.speed);
    expect(slow.verticalSpeed).toBeLessThan(cruising.verticalSpeed);
    expect(slow.airborne).toBe(true);

    flyFor(session, 2, { throttleUp: true, pitchDown: true });
    const recovering = flyFor(session, 4, { throttleUp: true, pitchUp: true });
    expect(recovering.speed).toBeGreaterThan(slow.speed);
    expect(recovering.verticalSpeed).toBeGreaterThan(slow.verticalSpeed);
    expect(recovering.airborne).toBe(true);
  });
});

describe('lighthouse route', () => {
  it('counts one airborne lighthouse pass and changes the objective to return', () => {
    const session = new GameSession();
    session.begin();
    flyFor(session, 5, { throttleUp: true });
    flyFor(session, 4, { pitchUp: true });
    expect(session.state.objective).toBe('fly');
    expect(session.state.landmarkPassed).toBe(false);

    let passed = session.state;
    for (let elapsed = 0; elapsed < 25 && !passed.landmarkPassed; elapsed += 0.05) {
      passed = session.update({}, 0.05);
    }
    expect(passed.landmarkPassed).toBe(true);
    expect(passed.objective).toBe('return');
    expect(passed.runwayBearing).not.toBeNull();
    expect(passed.landmarkNoticeSeconds).toBeGreaterThan(0);

    const later = flyFor(session, 10);
    expect(later.landmarkPassed).toBe(true);
    expect(later.objective).toBe('return');
    expect(later.landmarkPasses).toBe(1);
    expect(later.landmarkNoticeSeconds).toBe(0);
  });

  it('does not count a ground pass by the lighthouse', () => {
    const session = new GameSession();
    session.begin();
    flyFor(session, 5, { throttleUp: true });
    const nearLighthouse = flyFor(session, 25);
    expect(nearLighthouse.airborne).toBe(false);
    expect(nearLighthouse.landmarkPassed).toBe(false);
    expect(nearLighthouse.objective).toBe('takeoff');
  });

  it('offers a runway cue far from the island without ending the flight', () => {
    const session = new GameSession();
    session.begin();
    flyFor(session, 5, { throttleUp: true });
    flyFor(session, 4, { pitchUp: true });
    flyFor(session, 4, { yawRight: true });
    const distant = flyFor(session, 40);
    expect(distant.distanceFromRunway).toBeGreaterThan(1100);
    expect(distant.landmarkPassed).toBe(false);
    expect(distant.objective).toBe('fly');
    expect(distant.runwayBearing).not.toBeNull();
    expect(distant.airborne).toBe(true);
  });
});
