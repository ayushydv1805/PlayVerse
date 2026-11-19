# PlayVerse

**Every game. One universe.**

PlayVerse is a mobile-friendly games hub for classic board, card, and arcade games. Phase 1 establishes the visual system and the first playable experiences.

## Phase 1 and Phase 2

- Premium dark arcade lobby with responsive desktop and mobile layouts.
- Game discovery cards, search, category filters, daily quest panel, and game details.
- **Classic Snake** — arrow/WASD movement, touch controls, Space to pause, R to restart, food collection, collision detection, score, and locally saved personal best.
- **Tic Tac Toe** — two-player local pass-and-play, win/draw detection, round reset and match score. Use 1–9, arrow keys + Enter, or tap/click.
- **Ludo Royale** — local 2–4 player game with four tokens per player, six-to-enter, safe squares, captures, home lanes, exact finish, turn order, and extra turns on six/capture.
- **Snakes & Ladders** — local 2–4 player race to 100, snakes/ladders, exact finish, and turn rotation.
- Plus Minus and 3–2–5 remain catalogue previews for the next phase.

## Phase 3 card games

- **UNO** — local 2–6 player card shedding with colour/number matching, skip, reverse, draw-two, wild and wild-draw-four cards, colour selection, drawing, UNO call and missed-call penalty.
- **Plus Minus 50** — local 2–6 player arithmetic card game. Aces are 1, 6 is 0, J/Q/K are 10; add while the running total is below 50 and subtract while it is above 50. Hit exactly 50 to win.
- **3–2–5 (Teen Do Paanch)** — three-player trick-taking with a 30-card pack, rotating 5/3/2 quotas, trump selection, follow-suit rules, trick scoring and blind card pulls/returns between deals. A match rotates the dealer through three deals.

These card games are local pass-and-play on one device; online rooms are not enabled yet.

## Keyboard controls

| Game | Keys |
|---|---|
| Classic Snake | Arrow keys or WASD to steer, Space to pause/resume, R to restart |
| Tic Tac Toe | 1–9 to place a mark, arrow keys to select a square, Enter/Space to play, R to restart the round |
| Ludo Royale | Space to roll, arrow keys to select a legal token, Enter to move it, R to restart |
| Snakes & Ladders | Space/Enter to roll, R to restart |\n| UNO | Arrow keys select, Enter plays, D draws, U calls UNO, R restarts |\n| Plus Minus 50 | Arrow keys select, Enter plays, 1–4 quick play, R restarts |\n| 3–2–5 | Arrow keys select, Enter plays/confirms, R restarts |

Mouse and touch controls are also available where the game UI provides them.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Create a production build:

```bash
npm run build
npm run preview
```

## Current limitations

This phase is a frontend foundation. Plus Minus and 3–2–5 are still catalogue previews, not playable implementations. Online accounts, rooms, matchmaking, chat, synchronized game state, and persistent cloud profiles are not enabled yet; they need a backend and realtime game services in a subsequent phase.

## Deployment

The app is a static Vite site. Use:

- Build command: `npm install && npm run build`
- Publish directory: `dist`

Vercel and Render can both host the frontend as a static site. Connect the repository to a hosting project to enable automatic deploys from `main`.

## Next phases

1. Implement Plus Minus and 3–2–5 card-game rules and pass-and-play.
2. Add authentication, profiles, invitations, private rooms, realtime multiplayer, matchmaking, and reconnect handling.
3. Add sound, animations, accessibility polish, and production game testing.

## Stack

React, TypeScript, Vite, Lucide icons, and custom responsive CSS.