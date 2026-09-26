# V1 flight circuit specification

## Problem Statement

The player wants a browser flight experience that feels responsive and satisfying without learning a detailed simulator. The project also needs a small, understandable first version that runs smoothly and looks coherent on a recent everyday laptop.

## Solution

V1 is one short circuit in one game-friendly jet. The player starts on a runway on a stylized coastal island, takes off, flies near a lighthouse on a rocky point, returns to the same runway, and brakes to a stop. The planned route should normally take about 90 to 120 seconds. There is no time limit, score, progression system, or saved state.

The jet uses forgiving arcade flight behavior. Speed affects lift and turning, but stalls are recoverable. The camera follows smoothly from behind. The island has enough terrain variation, coastline, buildings, trees, and atmospheric lighting to make the short route scenic while keeping the scene lightweight.

The player sees a compact HUD with airspeed, altitude, throttle, current objective, and a subtle direction cue toward the runway when returning. Coming within a generous distance of the lighthouse marks the landmark as passed. A safe landing requires touchdown on the runway at a manageable speed and descent rate; minor heading errors count. The circuit completes after the jet slows on the runway. If the player lands before passing the landmark, the result is "Incomplete circuit." A hard or off-runway touchdown, or an impact with water, terrain, or a solid structure, is a crash. Each result offers immediate restart. A distant player sees a return cue but does not fail for crossing an invisible boundary.

The first visit starts with a brief controls panel and a Begin flight action. Basic audio covers the engine, passing the landmark, landing results, and crashes. Esc pauses and displays controls, R restarts at the runway, and M mutes audio.

## User Stories

1. As a new player, I want to see the controls before the first flight, so that I can take off without guessing.
2. As a player, I want to begin on the runway, so that takeoff is part of every circuit.
3. As a player, I want one recognizable jet, so that I can learn its handling quickly.
4. As a player, I want W to raise the nose and S to lower it, so that pitch matches the agreed controls.
5. As a player, I want A and D to bank in flight, so that I can turn toward the lighthouse and runway.
6. As a player, I want A and D to steer on the ground, so that I can keep the jet on the runway.
7. As a player, I want Q and E to control yaw, so that I can make small heading corrections.
8. As a player, I want Shift and Ctrl to adjust throttle, so that I can manage takeoff, cruising, and approach speed.
9. As a player, I want Space to brake after touchdown, so that stopping completes the landing.
10. As a player, I want landing gear to work automatically, so that I can focus on flying the circuit.
11. As a player, I want the jet to gain lift with speed and lose it when too slow, so that takeoff and landing feel believable.
12. As a player, I want to recover from a stall, so that one imperfect turn does not end the circuit.
13. As a player, I want the chase camera to move smoothly, so that the jet and runway stay readable during turns.
14. As a player, I want a distinct lighthouse on a rocky point, so that I can recognize the route landmark from the air.
15. As a player, I want a forgiving landmark distance, so that I can pass it without precise ring flying.
16. As a player, I want feedback when I pass the landmark, so that I know it is time to return.
17. As a player, I want a direction cue for the return, so that I can find the runway without a map.
18. As a player, I want to see airspeed, altitude, throttle, and the current objective, so that I can make basic flight decisions without a cluttered HUD.
19. As a player, I want a scenic coastline and a few distinct island details, so that the short flight remains enjoyable.
20. As a player, I want a safe landing to count despite minor misalignment, so that the game rewards a good approach without demanding precision.
21. As a player, I want the circuit to complete after I slow on the runway, so that braking feels like part of landing.
22. As a player, I want an incomplete result if I land before passing the lighthouse, so that the circuit objective is clear.
23. As a player, I want a clear crash result after a hard landing or impact, so that I understand why the attempt ended.
24. As a player, I want R to restart at the runway in one step, so that another attempt begins quickly.
25. As a player, I want a return cue when I fly far from the island, so that I can find my way back without an abrupt failure.
26. As a player, I want Esc to pause and show controls, so that I can take a break or check a key binding.
27. As a player, I want M to mute the basic audio, so that I can play quietly.
28. As a player, I want engine and event cues, so that speed and circuit outcomes have audible feedback.
29. As a player, I want the flight to remain smooth in Chrome on an everyday laptop, so that controls and camera motion feel responsive.
30. As a person sharing the project, I want a static browser build, so that others can open it without an account or backend.

## Implementation Decisions

- Use plain TypeScript, Vite, and Three.js. Build the controls panel, HUD, and result views with ordinary HTML and CSS. The application runs client-side and produces static assets suitable for simple web hosting.
- Keep one aircraft, one island, one runway, one lighthouse landmark, and one circuit. Model a compact fictional jet at game-friendly speeds so the takeoff, landmark pass, return, and landing fit the short route.
- Follow the accepted small arcade flight model decision. Keep thrust, lift, drag, turning, ground contact, and recovery rules together in an isolated model rather than adding a general physics engine. Centralize tuning values so the jet can be adjusted through playtesting.
- Use a game-session coordinator as the boundary between controls, simulation, and presentation. It accepts current input and elapsed time, advances the flight and circuit, and exposes observable aircraft data, objective progress, and result state. The renderer, HUD, and audio read that state rather than independently deciding whether a landmark or landing counts.
- Track the circuit as runway start, outbound flight, landmark passed, return, and terminal result. Passing the lighthouse requires the airborne jet to enter a generous proximity area once. The circuit has no timer. Landing before passing the lighthouse produces an incomplete result after slowing.
- Evaluate landing at touchdown using runway location, speed, and descent rate. Allow modest heading error. Retain a pending safe or incomplete landing until the jet slows enough to show the result. End the attempt on hard or off-runway touchdown and on collision with water, terrain, or solid structures. Keep a low-speed stall recoverable.
- Use keyboard controls as agreed: W nose up, S nose down, A/D bank in flight and steer on the ground, Q/E yaw, Shift/Ctrl throttle adjustment, Space brake, Esc pause, R restart, and M mute. The first-flight panel and pause view display the mapping. Pause stops simulation progress.
- Handle landing gear automatically; omit flap controls. Restart returns the jet and circuit to their initial runway state without returning to the first-flight panel.
- Use a smoothed chase camera. Keep the horizon and runway legible through banking and approach, and avoid camera motion that obscures touchdown.
- Build a cohesive low-poly island with simple geometry for terrain, coastline, runway, lighthouse, trees, and a small number of buildings. Give the jet a clear silhouette; choose between custom geometry and one imported model during implementation based on visual quality and asset cost. Avoid a large asset library or heavy postprocessing.
- Keep the HUD compact. Present objective changes and result messages clearly. Give a distant jet a return cue and restart option instead of enforcing an invisible world boundary.
- Play only basic engine, landmark, landing-result, and crash cues. Start sound after the player's Begin flight action and honor mute. No music or elaborate soundscape is required.
- Target recent desktop Chrome and aim for smooth 60 FPS on a recent everyday laptop. Favor scene and rendering simplifications when visual detail harms control response. Choose the static host when the application is ready to share.

## Testing Decisions

- Test observable behavior, not mesh structure, formulas, frame-by-frame camera positions, or private state. A good automated test describes an input sequence and checks the resulting aircraft readings, objective change, or circuit result.
- The main automated seam is the game-session coordinator. Step it with controlled elapsed time and input to cover takeoff, passing the lighthouse, safe landing after slowing, incomplete landing, crash conditions, stall recovery, pause, and restart. This single seam exercises the flight model and circuit rules together.
- Use a small Chrome smoke check for the first-flight panel, visible HUD, controls, pause, mute, and restart. Play the full circuit manually to judge control feel, camera motion, scenic quality, audio timing, and whether a normal run takes about 90 to 120 seconds.
- Inspect frame rate and responsiveness in Chrome on a recent everyday laptop during takeoff, the landmark pass, and landing. Tune the scene or renderer if the flight does not stay near the 60 FPS goal. No exact laptop model or automated performance gate has been chosen.
- This repository has no existing application or test suite, so there is no prior test pattern to preserve.

## Out of Scope

- Multiple aircraft, airports, islands, routes, or missions.
- Realistic aerodynamics, detailed jet systems, manual landing gear or flaps, and a general physics engine.
- Precision checkpoint rings, scoring, grades, leaderboards, saved progress, or accounts.
- Mobile or touch controls, gamepad support, and browsers other than recent desktop Chrome as launch targets.
- A forced time limit, weather changes, day-night cycle, multiplayer, or open-world content.
- Music, voice work, elaborate sound design, external APIs, databases, and backend infrastructure.

## Further Notes

- Use the project glossary's meanings of circuit, landmark, safe landing, and crash. The accepted flight-model ADR explains the deliberate trade-off between tunable arcade behavior and detailed simulation.
- Exact physics constants, landmark radius, landing thresholds, brake strength, and island dimensions are tuning values. Set them by repeated playtesting against the agreed short, forgiving circuit rather than treating arbitrary initial numbers as product requirements.
- The aircraft asset format and static host remain implementation choices. Neither should expand V1's gameplay scope.
