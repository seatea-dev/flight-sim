import { expect, it } from 'vitest';
import { LIGHTHOUSE, RUNWAY } from '../src/route';
import { GameSession, type FlightInput } from '../src/session';

function flyCircuit(session: GameSession) {
  let passedAt = 0;
  let touchedAt = 0;
  let reachedStage = false;
  for (let tick = 0; tick < 2400 && !session.state.result; tick++) {
    const t = tick / 20;
    const s = session.state;
    const input: FlightInput = {};
    if (t < 3) input.throttleUp = true;
    if (t > 4 && t < 5) input.pitchUp = true;
    if (s.airborne) {
      const stagingZ = LIGHTHOUSE.z + 220;
      if (s.landmarkPassed && Math.hypot(s.x - RUNWAY.x, s.z - stagingZ) < 60) reachedStage = true;
      const staging = !reachedStage;
      const target = s.landmarkPassed
        ? Math.atan2(
            (staging ? RUNWAY.x : RUNWAY.x - 30) - s.x,
            s.z - (staging ? stagingZ : RUNWAY.z + 180),
          )
        : Math.atan2(LIGHTHOUSE.x - s.x, s.z - LIGHTHOUSE.z);
      const difference = Math.atan2(Math.sin(target - s.heading), Math.cos(target - s.heading));
      const desiredBank = Math.max(-0.5, Math.min(0.5, difference * 0.7));
      if (desiredBank - s.bank > 0.06) input.steerRight = true;
      if (desiredBank - s.bank < -0.06) input.steerLeft = true;
      if (s.landmarkPassed) {
        if (s.speed > 28) input.throttleDown = true;
        if (s.speed < 26) input.throttleUp = true;
      }
      const desiredAltitude = s.landmarkPassed ? (staging ? 55 : Math.max(0, -s.z * 0.12)) : 65;
      const altitudeError = desiredAltitude - s.altitude - s.verticalSpeed * 2;
      const desiredPitch = Math.max(-0.28, Math.min(0.3, altitudeError * 0.014));
      if (desiredPitch - s.pitch > 0.03) input.pitchUp = true;
      if (desiredPitch - s.pitch < -0.03) input.pitchDown = true;
    }
    if (s.landmarkPassed && !passedAt) passedAt = t;
    if (s.landingPending && !touchedAt) touchedAt = t;
    if (s.landingPending) {
      input.throttleDown = true;
      input.brake = true;
    }
    session.update(input, 0.05);
  }
  return { passedAt, touchedAt };
}

it('completes the runway, lighthouse, return, landing and restart flow twice', () => {
  const session = new GameSession();
  session.begin();
  const first = flyCircuit(session);
  expect(session.state.result).toBe('complete');
  expect(session.state.landmarkPasses).toBe(1);
  expect(first.passedAt).toBeGreaterThan(15);
  expect(first.touchedAt).toBeGreaterThan(first.passedAt);
  expect(first.touchedAt).toBeLessThan(120);

  expect(session.restart().objective).toBe('takeoff');
  const second = flyCircuit(session);
  expect(session.state.result).toBe('complete');
  expect(session.state.landmarkPasses).toBe(1);
  expect(second.touchedAt).toBeCloseTo(first.touchedAt, 1);
});
