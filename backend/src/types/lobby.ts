import { CanvasStrokes, WinningCanvas } from "./canvas.js";
import { GameState, Guess } from "./game.js";
import { WebSocket } from "ws";

export interface Player {
  id: string;
  name: string;
  ws: WebSocket | null;
  isHost: boolean;
  score: number;
}

export interface Game {
  roundFinished: boolean;
  canvasWaitTimer: NodeJS.Timeout | null;
  phaseStartedAt: number | null;
  phaseDuration: number | null;
  roundWinnerId: string | null;
  roundTimer: NodeJS.Timeout | null;
  startTimer: NodeJS.Timeout | null;
  endTimer: NodeJS.Timeout | null;
  guesses: Guess[];
  roundWinner: string | null;
  winningGuess: Guess | null;
}

export interface Lobby {
  id: string;
  inviteCode: string;
  isPublic: boolean;
  players: Map<string, Player>;
  createdAt: number;
  state: GameState;
  roundIndex: number;
  totalRounds: number;
  words: string[];
  game?: Game | null;
  phaseStartedAt?: number | null;
  phaseDuration?: number | null;
  winningCanvases?: WinningCanvas[] | null;
  winningCanvasAlreadyReceived?: boolean;
}

export type LobbyData = {
  id: string;
  inviteCode: string;
  isPublic: boolean;
  players: Omit<Player, "ws">[];
  state: GameState;
  word: string | null;
  roundIndex: number;
  totalRounds: number;
  roundWinner: string | null;
  roundWinnerId: string | null;
  winningGuess: Guess | null;
  winningCanvas: CanvasStrokes | null;
  winningCanvases: WinningCanvas[];
  createdAt: number;
  phaseStartedAt: number | null;
  phaseDuration: number | null;
};
