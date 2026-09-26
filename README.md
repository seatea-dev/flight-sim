# Island Circuit

A small browser flight simulator, built one playable slice at a time. The current slice covers runway taxi, takeoff, and free flight with a recoverable stall.

Hold Shift to increase throttle, then hold W during the ground roll to take off. In the air, W and S change pitch, A and D bank, and Q and E yaw. Ctrl reduces throttle. On the ground, A and D steer and Space brakes. Landing gear moves automatically.

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
