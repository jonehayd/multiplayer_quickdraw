// Game state
export { GameState } from "./game.js";
export type { Guess, Prediction } from "./game.js";

// Lobby
export type { Player, Game, Lobby, LobbyData } from "./lobby.js";

// Canvas
export type { Stroke, CanvasStrokes } from "./canvas.js";

// Socket messages
export type {
  MessageContext,
  JoinLobbyMessage,
  StartGameMessage,
  GuessMessage,
  WinningCanvasMessage,
  CanvasStrokeMessage,
  CanvasUndoMessage,
  CanvasClearMessage,
  ClientMessage,
  LobbyUpdateMessage,
  CanvasStrokeUpdateMessage,
  CanvasUndoUpdateMessage,
  CanvasClearUpdateMessage,
  ServerMessage,
  BaseSocketMessage,
} from "./socket.js";
