# Island Circuit

A small browser flight simulator, built one playable slice at a time. Take off from the coastal runway, pass the lighthouse on the north point, and follow the runway cue back toward the island.

Hold Shift to increase throttle, then hold S during the ground roll to raise the nose and take off. In the air, W lowers the nose and S raises it. A and D bank, and Q and E yaw. Ctrl reduces throttle. On the ground, A and D steer and Space brakes. Landing gear moves automatically.

Press Esc to pause or resume and review the controls. Press M to mute or unmute sound, and R to restart at the runway.

## Run locally

Use a recent Node.js version, then run:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite in desktop Chrome.

## Check the build

```sh
npm test
npm run typecheck
npm run format:check
npm run build
```

The build command writes static assets to `dist/`.
