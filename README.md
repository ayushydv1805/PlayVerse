# PlayVerse

**Every game. One universe.**

PlayVerse is a mobile-friendly games hub for classic board, card, and arcade games. Phase 1 establishes the visual system and the first playable experiences.

## Phase 1

- Premium dark arcade lobby with responsive desktop and mobile layouts.
- Game discovery cards, search, category filters, daily quest panel, and game details.
- **Classic Snake** — keyboard and touch controls, food collection, collision detection, score, and locally saved personal best.
- **Tic Tac Toe** — two-player local pass-and-play, win detection, draw detection, round reset, and match score.
- Dedicated catalogue entries for Ludo, Snakes & Ladders, Plus Minus, and 3–2–5, marked as in development.

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

This phase is a frontend foundation. Games that are marked **Coming soon** are catalogue previews, not playable implementations. Online accounts, rooms, matchmaking, chat, synchronized game state, and persistent cloud profiles are not enabled yet; they need a backend and realtime game services in a subsequent phase.

## Deployment

The app is a static Vite site. Use:

- Build command: `npm install && npm run build`
- Publish directory: `dist`

Vercel and Render can both host the frontend as a static site. Connect the repository to a hosting project to enable automatic deploys from `main`.

## Next phases

1. Build complete rules and playable local versions of Ludo and Snakes & Ladders.
2. Implement Plus Minus and 3–2–5 card-game rules and pass-and-play.
3. Add authentication, profiles, invitations, private rooms, realtime multiplayer, matchmaking, and reconnect handling.
4. Add sound, animations, accessibility polish, and production game testing.

## Stack

React, TypeScript, Vite, Lucide icons, and custom responsive CSS.