// The runway origin and lighthouse position are shared by the session and scene.
export const LIGHTHOUSE = { x: 90, z: -650 } as const;
export const RUNWAY = { x: 0, z: 0 } as const;
export const LANDMARK_RADIUS = 110;
export const DISTANT_RETURN_RADIUS = 1100;
export const RUNWAY_HALF_WIDTH = 19;
export const RUNWAY_HALF_LENGTH = 260;
export const ISLAND_RADIUS = 560;

// Scene positions also drive the deliberately forgiving collision envelopes.
export const HILLS = [
  [-335, -230, 125, 41, 0],
  [-350, 120, 150, 34, 1],
  [320, -125, 135, 29, 2],
  [345, 295, 120, 36, 0],
  [-105, 410, 110, 20, 2],
] as const;
export const TREES = [
  [-180, -270, 1],
  [-245, -275, 0.85],
  [-180, -195, 0.9],
  [-240, -90, 1.1],
  [-160, 40, 0.9],
  [-250, 65, 1.1],
  [-260, 225, 1],
  [-160, 310, 0.8],
  [-65, 390, 0.85],
  [195, -305, 0.9],
  [265, -250, 1],
  [245, -25, 0.85],
  [175, 90, 0.9],
  [280, 115, 1.1],
  [220, 240, 0.85],
  [135, 375, 0.9],
  [330, 350, 0.8],
] as const;
export const BUILDINGS = [
  [-88, 35, 30, 22],
  [-110, 86, 19, 18],
  [95, 140, 25, 20],
] as const;
export const ROCKS = [
  [45, -525, 72, 19],
  [75, -575, 65, 25],
  [LIGHTHOUSE.x, LIGHTHOUSE.z, 68, 30],
  [145, -605, 25, 17],
  [18, -630, 22, 14],
] as const;
