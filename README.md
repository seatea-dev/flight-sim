# Island Circuit

A small browser flight simulator, built one playable slice at a time. The current slice covers the runway start and taxi controls.

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
