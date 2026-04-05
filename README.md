# Quick Draw Battle

_Note: the backend uses Render free-tier, so the UI may not respond for around a minute if the server needs to be spinned up_
**Live demo:** [Demo](https://quickdraw.hjones.dev/)

## Demo Video

This video shows a full playthrough. Two separate tabs are used to demonstrate multiplayer.
[![Demo Video](https://img.youtube.com/vi/S4r99zobvcM/maxresdefault.jpg)](https://www.youtube.com/watch?v=S4r99zobvcM)

## What is it?

Quick Draw Battle is a real-time multiplayer drawing game. Players join a lobby, get given a word, and race to draw it on a shared canvas. As you draw, an AI model running in your browser tries to recognize your drawing in real time. The first player whose drawing gets identified correctly wins the round. After all rounds, the player with the most wins takes the game.

The idea was inspired by Google's Quick, Draw! experiment, but turned into a competitive multiplayer game you can play with friends.

## Features

- Create public or private lobbies for up to 4 players, with invite codes and random matchmaking
- Real-time canvas — every player can see each other drawing live as strokes happen
- AI-powered guessing that runs entirely in the browser, no waiting on a server
- Timed rounds with countdowns, score tracking, and a final leaderboard
- A gallery at the end showing the winning drawing from each round
- Reconnect support — if you refresh or lose connection, you have 30 seconds to rejoin without losing your spot

## Tech stack

**Frontend** — React with Vite. Canvas drawing synced over WebSockets. The drawing recognition model runs client-side using ONNX Runtime Web, so predictions happen instantly with no network delay.

**Backend** — Node.js with Express and a WebSocket server. Handles lobby management, game state transitions, round timing, and broadcasting updates to all connected players.

**Model** — A convolutional neural network trained on Google's Quick, Draw! dataset across 50 drawing categories. Trained in PyTorch and exported to ONNX so it can run directly in the browser.

## Running locally

```bash
git clone https://github.com/jonehayd/multiplayer_quickdraw.git
cd multiplayer_quickdraw
npm install
```

Copy the environment files before starting:

- `backend/.env.example` -> `backend/.env`
- `frontend/.env.example` -> `frontend/.env.local`

The defaults work for local development. Then run:

```bash
npm run dev
```

Frontend starts on `http://localhost:5173`, backend on `http://localhost:3000`.
