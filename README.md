# Island Circuit

**[▶ Play Island Circuit](https://seatea-dev.github.io/flight-sim/)**

Island Circuit is a small browser based 3D flight simulator set around a coastal island. Take off from the runway, pass the lighthouse, then follow the runway cue back to land.

Built with TypeScript, Vite, and Three.js.

## Controls

| Key   | Action                               |
| ----- | ------------------------------------ |
| Shift | Increase throttle                    |
| Ctrl  | Reduce throttle                      |
| W / S | Lower / raise the nose               |
| A / D | Bank in the air, steer on the ground |
| Q / E | Yaw left / right                     |
| Space | Brake on the ground                  |
| Esc   | Pause or resume                      |
| M     | Mute or unmute sound                 |
| R     | Restart at the runway                |

Landing gear moves automatically.

## Run locally

Use a recent Node.js version, then run:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite in desktop Chrome.

## Check the project

```sh
npm test
npm run typecheck
npm run format:check
npm run build
```
