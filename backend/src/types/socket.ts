import { CanvasStrokes, Stroke } from "./canvas.js";
import { Prediction } from "./game.js";
import { LobbyData } from "./lobby.js";

export interface MessageContext {
  currentLobbyId: string | null;
  currentUserId: string | null;
}

// Client messages

export interface JoinLobbyMessage {
  type: "JOIN_LOBBY";
  lobbyId: string;
  userId: string;
}

export interface StartGameMessage {
  type: "START_GAME";
}

export interface GuessMessage {
  type: "GUESS";
  predictions: Prediction[];
  canvas: Stroke[];
}

export interface WinningCanvasMessage {
  type: "WINNING_CANVAS";
  canvas: CanvasStrokes;
}

export interface CanvasStrokeMessage {
  type: "CANVAS_STROKE";
  playerId: string;
  stroke: Stroke;
  isComplete: boolean;
}

export interface CanvasUndoMessage {
  type: "CANVAS_UNDO";
  playerId: string;
}

export interface CanvasClearMessage {
  type: "CANVAS_CLEAR";
  playerId: string;
}

export type ClientMessage =
  | JoinLobbyMessage
  | StartGameMessage
  | GuessMessage
  | WinningCanvasMessage
  | CanvasStrokeMessage
  | CanvasUndoMessage
  | CanvasClearMessage;

// Server messages

export interface LobbyUpdateMessage {
  type: "LOBBY_UPDATE";
  lobby: LobbyData;
}

export interface CanvasStrokeUpdateMessage {
  type: "CANVAS_STROKE_UPDATE";
  playerId: string;
  stroke: Stroke;
  isComplete: boolean;
}

export interface CanvasUndoUpdateMessage {
  type: "CANVAS_UNDO";
  playerId: string;
}

export interface CanvasClearUpdateMessage {
  type: "CANVAS_CLEAR";
  playerId: string;
}

export type ServerMessage =
  | LobbyUpdateMessage
  | CanvasStrokeUpdateMessage
  | CanvasUndoUpdateMessage
  | CanvasClearUpdateMessage;

// Base message type

export interface BaseSocketMessage {
  type: string;
}
