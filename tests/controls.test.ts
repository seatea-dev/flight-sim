import { describe, expect, it } from 'vitest';
import { keyboardInput } from '../src/controls';

describe('keyboard flight controls', () => {
  it('maps W to nose down and S to nose up', () => {
    expect(keyboardInput(new Set(['KeyW']))).toMatchObject({
      pitchDown: true,
      pitchUp: false,
    });
    expect(keyboardInput(new Set(['KeyS']))).toMatchObject({
      pitchDown: false,
      pitchUp: true,
    });
  });
});
