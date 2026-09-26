import { describe, expect, it } from 'vitest';
import { GameSession, type FlightState } from '../src/session';

function approach(overrides: Partial<FlightState> = {}) {
  const runwayStart = new GameSession().state;
  return new GameSession({
    ...runwayStart,
    started: true,
    x: 5,
    z: 65,
    altitude: 4,
    heading: 0.12,
    pitch: -0.08,
    speed: 25,
    verticalSpeed: -4,
    airborne: true,
    objective: 'return',
    landmarkPassed: true,
    landmarkPasses: 1,
    ...overrides,
  });
}

function stepUntilGround(session: GameSession) {
  for (let i = 0; i < 300 && session.state.airborne && !session.state.result; i++) {
    session.update({}, 1 / 60);
  }
  return session.state;
}

describe('circuit resolution', () => {
  it('accepts a forgiving runway touchdown and completes only after slowing', () => {
    const session = approach();
    const touchdown = stepUntilGround(session);
    expect(touchdown.result).toBeNull();
    expect(touchdown.landingPending).toBe(true);
    expect(touchdown.speed).toBeGreaterThan(4);

    for (let i = 0; i < 300 && !session.state.result; i++) {
      session.update({ brake: true }, 1 / 60);
    }
    expect(session.state.result).toBe('complete');
    const complete = session.state;
    expect(session.update({ throttleUp: true }, 2)).toEqual(complete);
  });

  it('reports an incomplete circuit after a safe landing without the lighthouse', () => {
    const session = approach({ landmarkPassed: false, landmarkPasses: 0, objective: 'fly' });
    expect(stepUntilGround(session).landingPending).toBe(true);
    for (let i = 0; i < 300 && !session.state.result; i++) {
      session.update({ brake: true }, 1 / 60);
    }
    expect(session.state.result).toBe('incomplete');
  });

  it.each([
    ['steep touchdown', 'hard landing', { verticalSpeed: -15 }],
    ['fast touchdown', 'hard landing', { speed: 48, altitude: 1, verticalSpeed: -6 }],
    ['misaligned touchdown', 'hard landing', { heading: 0.8 }],
    ['off-runway touchdown', 'off runway', { x: 35 }],
    ['water contact', 'water', { x: 700, z: 0, altitude: 1 }],
    ['terrain contact', 'terrain', { x: -335, z: -230, altitude: 12 }],
    ['structure contact', 'structure', { x: -88, z: 35, altitude: 8 }],
  ] as const)('crashes on %s', (_condition, reason, state) => {
    const session = approach(state);
    for (let i = 0; i < 300 && !session.state.result; i++) session.update({}, 1 / 60);
    expect(session.state.result).toBe('crash');
    expect(session.state.crashReason).toBe(reason);
  });

  it('keeps a low-speed stall recoverable before impact', () => {
    const session = approach({ x: 0, z: 0, altitude: 120, speed: 8, verticalSpeed: -2 });
    session.update({}, 0.5);
    expect(session.state.airborne).toBe(true);
    expect(session.state.result).toBeNull();
  });

  it.each(['complete', 'incomplete', 'crash'] as const)(
    'restarts from %s with a fresh runway circuit',
    (result) => {
      const session = approach({ result, crashReason: result === 'crash' ? 'water' : null });
      const reset = session.restart();
      const runwayStart = new GameSession().begin();
      expect(reset).toEqual(runwayStart);
      expect(session.update({ throttleUp: true }, 1).speed).toBeGreaterThan(0);
    },
  );
});
