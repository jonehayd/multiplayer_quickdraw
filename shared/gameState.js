export const GameState = {
  LOBBY: "LOBBY",
  ROUND_START: "ROUND_START",
  GAME: "GAME",
  ROUND_END: "ROUND_END",
  GAME_END: "GAME_END",
};

export const RoundLengths = {
  START_ROUND_LEN: 300,
  ROUND_LEN: 2000,
  END_ROUND_LEN: 300,
};

// The percent confidence needed to instantly win a round
export const CONFIDENCE_THRESHOLD_CUTOFF = 80;
