export type GroundInput = {
  throttleUp?: boolean;
  throttleDown?: boolean;
  steerLeft?: boolean;
  steerRight?: boolean;
  brake?: boolean;
};

export type GroundState = Readonly<{
  started: boolean;
  x: number;
  z: number;
  heading: number;
  speed: number;
  throttle: number;
}>;

const initialState: GroundState = {
  started: false,
  x: 0,
  z: 170,
  heading: 0,
  speed: 0,
  throttle: 0,
};

export class GameSession {
  private current: GroundState = { ...initialState };

  get state(): GroundState {
    return { ...this.current };
  }

  begin(): GroundState {
    this.current = { ...this.current, started: true };
    return this.state;
  }

  update(input: GroundInput, elapsedSeconds: number): GroundState {
    if (!this.current.started || elapsedSeconds <= 0) return this.state;

    const throttleDirection =
      Number(Boolean(input.throttleUp)) - Number(Boolean(input.throttleDown));
    const throttle = Math.max(
      0,
      Math.min(1, this.current.throttle + throttleDirection * 0.55 * elapsedSeconds),
    );
    const drag = 1.2 + 0.018 * this.current.speed ** 2;
    const acceleration = 42 * throttle - drag - (input.brake ? 55 : 0);
    const speed = Math.max(0, Math.min(28, this.current.speed + acceleration * elapsedSeconds));
    const steering = Number(Boolean(input.steerRight)) - Number(Boolean(input.steerLeft));
    const steeringRate = Math.min(speed / 30, 1) * 0.45;
    const heading = this.current.heading + steering * steeringRate * elapsedSeconds;

    this.current = {
      started: true,
      x: this.current.x + Math.sin(heading) * speed * elapsedSeconds,
      z: this.current.z - Math.cos(heading) * speed * elapsedSeconds,
      heading,
      speed,
      throttle,
    };
    return this.state;
  }
}
