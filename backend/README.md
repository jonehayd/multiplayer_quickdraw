# Multiplayer Quickdraw

## Overview

This project is a real-time multiplayer drawing game inspired by Quick, Draw!, where:

- Players draw on a canvas
- A CNN runs locally in the browser to infer the drawing
- Inference results are sent to the backend
- Backend controls game logic, scoring, and round progression

The system is split into:

- Frontend (React)
- Backend (Node.js + Websockets)
