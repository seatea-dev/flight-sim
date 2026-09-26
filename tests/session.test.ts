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
