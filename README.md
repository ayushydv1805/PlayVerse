# PlayVerse

**Every game. One universe.**

PlayVerse is a responsive games hub for classic board, card, and arcade games.

## Implemented games

- **Classic Snake** — arrow/WASD movement, touch controls, Space to pause, R to restart, food collection, collision detection, score, and locally saved personal best.
- **Tic Tac Toe** — two-player local pass-and-play, win/draw detection, round reset and match score. Use 1–9, arrow keys + Enter, or tap/click.
- **Ludo Royale** — premium tabletop board UI; play solo against computer opponents (2 or 4 seats) or pass-and-play. Includes four tokens per player, six-to-enter, safe squares, captures, home lanes, exact finish, extra turns, and per-seat dice history.
- **Snakes & Ladders** — premium adventure-board UI; play solo against computer opponents (2–4 seats) or pass-and-play. Includes classic snakes/ladders, exact finish, turn-by-turn dice history, and CPU turns.
- **UNO** — local 2–6 player card game with colour/number matching, skip, reverse, draw-two, wild and wild-draw-four cards, colour selection, drawing, UNO call and missed-call penalty.
- **Plus Minus 50** — local 2–6 player arithmetic card game. Aces are 1, 6 is 0, J/Q/K are 10; add while the running total is below 50 and subtract while it is above 50. Hit exactly 50 to win.
- **3–2–5 (Teen Do Paanch)** — three-player trick-taking with a 30-card pack, rotating 5/3/2 quotas, trump selection, follow-suit rules, trick scoring and blind card pulls/returns between deals. A match rotates the dealer through three deals.
- **Call Break** — four-player trick-taking against three computer opponents, 52-card deck, 13 cards per seat, spades as permanent trump, 1–13 trick calls, follow-suit play and five-round scoring.

The board games and Call Break support solo play against computer opponents. Other games support local pass-and-play or solo play as their rules allow. All games currently run on one device; online rooms are not enabled yet.

## Keyboard controls

| Game | Keys |
|---|---|
| Classic Snake | Arrow keys or WASD to steer, Space to pause/resume, R to restart |
| Tic Tac Toe | 1–9 to place a mark, arrow keys to select a square, Enter/Space to play, R to restart the round |
| Ludo Royale | Space to roll, arrow keys to select a legal token, Enter to move it, R to restart |
| Snakes & Ladders | Space/Enter to roll, R to restart |
| UNO | Arrow keys select, Enter plays, D draws, U calls UNO, R restarts |
| Plus Minus 50 | Arrow keys select, Enter plays, 1–4 quick play, R restarts |
| 3–2–5 | Arrow keys select, Enter plays/confirms, R restarts |
| Call Break | Arrow keys select, Enter plays, 1–13 selects your bid, R starts a new match |

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

This is currently a frontend-only build. Games run locally on one device; accounts, private rooms, matchmaking, chat, synchronized online game state, cloud profiles and cross-device persistence are not enabled yet. Those require a backend and realtime game services.

## Deployment

The app is a static Vite site.

- Build command: `npm install && npm run build`
- Publish directory: `dist`

Vercel and Render are connected to this GitHub repository and automatically deploy updates from `main`.

## Next phases

1. Add authentication, player profiles, private rooms, invitations and realtime multiplayer.
2. Add reconnect handling, rankings, match history and cloud persistence.
3. Add game sounds, extra animations, accessibility polish and production game testing.

## Stack

React, TypeScript, Vite, Lucide icons, and custom responsive CSS.
