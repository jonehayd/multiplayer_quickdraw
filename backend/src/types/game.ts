export enum GameState {
  LOBBY = "LOBBY",
  ROUND_START = "ROUND_START",
  GAME = "GAME",
  ROUND_END = "ROUND_END",
  GAME_END = "GAME_END",
}

// A single prediction
export interface Prediction {
  label: string;
  confidence: number;
}

// The winning guess of a player
export interface Guess {
  confidence: any;
  playerId: string | undefined;
}
