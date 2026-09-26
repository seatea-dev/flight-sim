# Use a small arcade flight model

V1 uses one game-friendly jet and aims for recoverable, satisfying flight in a short island circuit. We will implement an isolated flight model for thrust, lift, drag, turning, and ground contact instead of adding a general physics engine. This keeps the behavior easy to tune for the intended experience; the trade-off is that it will not simulate detailed aerodynamics or arbitrary physical objects.
