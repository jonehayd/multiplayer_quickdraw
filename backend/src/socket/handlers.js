import { inviteCodeMap, lobbies } from "../state.js";
import {
  GameState,
  RoundLengths,
  CONFIDENCE_THRESHOLD_CUTOFF,
} from "../../../shared/gameState.js";
import { serializeLobby } from "../routes/lobby.js";
import { readCategoriesFile, getRandomWordsArray } from "../game.js";

// Load the word categories
const categories = await readCategoriesFile();

// Game handlers

export function handleDisconnect({ currentLobbyId, currentUserId }) {
  if (!currentLobbyId || !currentUserId) return;

  const lobby = lobbies.get(currentLobbyId);
  if (!lobby) return;

  const players = lobby.players;
  const leavingPlayer = players.get(currentUserId);
  const wasHost = leavingPlayer?.isHost;

  console.log(`Disconnecting websocket for player with id ${currentUserId}`);
  players.delete(currentUserId);

  // Destroy empty lobby
  if (players.size === 0) {
    console.log(`Deleted lobby with id: ${currentLobbyId}`);
    inviteCodeMap.delete(lobbies.get(currentLobbyId).inviteCode);
    lobbies.delete(currentLobbyId);
    return;
  }

  // Promote next player
  if (wasHost) {
    const nextPlayer = players.values().next().value;
    if (nextPlayer) nextPlayer.isHost = true;
  }

  broadcastLobbyUpdate(lobby);
}

export function handleJoinLobby({ ws, msg, context }) {
  const { lobbyId, userId } = msg;
  context.currentLobbyId = lobbyId;
  context.currentUserId = userId;

  const lobby = lobbies.get(lobbyId);
  if (!lobby) return;

  const player = lobby.players.get(userId);
  if (player) player.ws = ws;

  broadcastLobbyUpdate(lobby);
}

export async function handleStartGame({ context }) {
  const { currentLobbyId, currentUserId } = context;
  if (!currentLobbyId || !currentUserId) return;

  const lobby = lobbies.get(currentLobbyId);
  if (!lobby) return;

  const player = lobby.players.get(currentUserId);
  if (!player?.isHost) return;
  if (lobby.players.size < 2) return;

  // Initialize the random categories array fpr the lobby
  lobby.words = await getRandomWordsArray(categories, lobby.totalRounds);
  lobby.winningCanvases = [];
  lobby.roundIndex = 0;

  // Initialize round
  lobby.game = {
    roundTimer: null,
    startTimer: null,
    endTimer: null,
    guesses: [],
    roundWinner: null,
    roundFinished: false,
  };

  transitionLobbyState(lobby, GameState.ROUND_START);
}

export function handleGuess({ msg, context }) {
  const lobby = lobbies.get(context.currentLobbyId);
  if (!lobby || lobby.state !== GameState.GAME) return;

  // Early return if round is already finished
  if (lobby.game.roundFinished) {
    console.log(
      `Ignoring late guess from ${context.currentUserId} - round already finished`,
    );
    return;
  }

  const word = lobby.words[lobby.roundIndex];

  const correct = msg.predictions.find((p) => p.label === word);

  if (!correct) return;

  // Check again before adding guess
  if (lobby.game.roundFinished) {
    console.log(
      `Race condition avoided: ignoring guess from ${context.currentUserId}`,
    );
    return;
  }

  const confidence = Number(correct.confidence);
  if (Number.isNaN(confidence)) return;

  lobby.game.guesses.push({
    playerId: context.currentUserId,
    confidence: confidence,
  });

  console.log(
    `[${lobby.roundIndex}] CHECKING CONFIDENCE 
    {${correct.confidence}, ${typeof correct.confidence}}`,
  );

  if (confidence >= CONFIDENCE_THRESHOLD_CUTOFF) {
    console.log(`[${lobby.roundIndex}] Guess greater than 80%, ${confidence}`);
    finishRound(lobby, context.currentUserId, {
      playerId: context.currentUserId,
      confidence,
    });
  }
}

export function handleWinningCanvas({ msg, context }) {
  const lobby = lobbies.get(context.currentLobbyId);
  if (!lobby?.game?.roundWinnerId) return;
  if (lobby.game.winningCanvas) return; // Already received
  if (lobby.game.roundWinnerId !== context.currentUserId) return;

  // Set winningCanvasReady to update UI
  lobby.game.winningCanvasReady = true;

  // Store canvas in game state for current round
  lobby.game.winningCanvas = msg.canvas;

  // Add to collection of all winning canvases
  lobby.winningCanvases.push({
    roundIndex: lobby.roundIndex,
    playerId: context.currentUserId,
    playerName: lobby.game.roundWinner,
    word: lobby.words[lobby.roundIndex],
    canvas: msg.canvas,
  });

  console.log(`Received winning canvas for round ${lobby.roundIndex}`);

  // Cancel the wait timer and transition now
  if (lobby.game.canvasWaitTimer) {
    clearTimeout(lobby.game.canvasWaitTimer);
    lobby.game.canvasWaitTimer = null;
  }

  broadcastLobbyUpdate(lobby);

  // Now transition to ROUND_END with the canvas
  transitionLobbyState(lobby, GameState.ROUND_END);
}

// Canvas handlers

export function handleCanvasStroke({ msg, context }) {
  const { currentLobbyId, currentUserId } = context;
  if (!currentLobbyId || !currentUserId) return;

  const lobby = lobbies.get(currentLobbyId);
  if (!lobby) return;

  const { playerId, stroke, isComplete } = msg;

  // Broadcast stroke update to all other players
  lobby.players.forEach((player) => {
    if (player.id !== playerId && player.ws?.readyState === 1) {
      player.ws.send(
        JSON.stringify({
          type: "CANVAS_STROKE_UPDATE",
          playerId,
          stroke,
          isComplete,
        }),
      );
    }
  });
}

export function handleCanvasUndo({ msg, context }) {
  const { currentLobbyId, currentUserId } = context;
  if (!currentLobbyId || !currentUserId) return;

  const lobby = lobbies.get(currentLobbyId);
  if (!lobby) return;

  const { playerId } = msg;

  // Broadcast undo to all other players
  lobby.players.forEach((player) => {
    if (player.id !== playerId && player.ws?.readyState === 1) {
      player.ws.send(
        JSON.stringify({
          type: "CANVAS_UNDO",
          playerId,
        }),
      );
    }
  });
}

export function handleCanvasClear({ msg, context }) {
  const { currentLobbyId, currentUserId } = context;
  if (!currentLobbyId || !currentUserId) return;

  const lobby = lobbies.get(currentLobbyId);
  if (!lobby) return;

  const { playerId } = msg;

  // Broadcast clear to all other players
  lobby.players.forEach((player) => {
    if (player.id !== playerId && player.ws?.readyState === 1) {
      player.ws.send(
        JSON.stringify({
          type: "CANVAS_CLEAR",
          playerId,
        }),
      );
    }
  });
}

// State transitions

function startRoundStart(lobby) {
  clearTimers(lobby);
  lobby.game.roundWinner = null;
  lobby.game.winningGuess = null;

  lobby.game.startTimer = setTimeout(() => {
    transitionLobbyState(lobby, GameState.GAME);
  }, RoundLengths.START_ROUND_LEN);
}

function startGamePhase(lobby) {
  clearTimers(lobby);

  lobby.game.guesses = [];
  lobby.game.roundWinner = null;
  lobby.game.roundWinnerId = null;
  lobby.game.roundFinished = false;
  lobby.game.winningCanvas = null;
  lobby.game.winningCanvasReady = false;
  lobby.game.canvasWaitTimer = null;

  lobby.game.roundTimer = setTimeout(() => {
    finishRound(lobby);
  }, RoundLengths.ROUND_LEN);
}

function startRoundEnd(lobby) {
  clearTimers(lobby);

  console.log(
    `[${lobby.roundIndex}] Winning canvas in startRoundEnd ${lobby.game.winningCanvas}`,
  );

  lobby.game.endTimer = setTimeout(() => {
    lobby.roundIndex++;

    if (lobby.roundIndex < lobby.totalRounds) {
      transitionLobbyState(lobby, GameState.ROUND_START);
    } else {
      transitionLobbyState(lobby, GameState.GAME_END);
    }
  }, RoundLengths.END_ROUND_LEN);
}

function endGame(lobby) {
  delete lobby.game;
  console.log(`Ended game for lobby: ${lobby.lobbyId}`);
}

// Helper functions

function broadcastLobbyUpdate(lobby) {
  const payload = JSON.stringify({
    type: "LOBBY_UPDATE",
    lobby: serializeLobby(lobby),
  });

  lobby.players.forEach((p) => {
    if (p.ws?.readyState === 1) {
      p.ws.send(payload);
    }
  });
}

function transitionLobbyState(lobby, nextState) {
  lobby.state = nextState;

  switch (nextState) {
    case GameState.ROUND_START:
      lobby.game.phaseStartedAt = Date.now();
      lobby.game.phaseDuration = RoundLengths.START_ROUND_LEN;
      startRoundStart(lobby);
      break;

    case GameState.GAME:
      lobby.game.phaseStartedAt = Date.now();
      lobby.game.phaseDuration = RoundLengths.ROUND_LEN;
      startGamePhase(lobby);
      break;

    case GameState.ROUND_END:
      lobby.game.phaseStartedAt = Date.now();
      lobby.game.phaseDuration = RoundLengths.END_ROUND_LEN;
      startRoundEnd(lobby);
      break;

    case GameState.GAME_END:
      endGame(lobby);
      break;
  }

  broadcastLobbyUpdate(lobby);
}

function finishRound(
  lobby,
  instantWinnerId = null,
  instantWinningGuess = null,
) {
  if (lobby.state !== GameState.GAME) return;

  if (lobby.game.roundFinished) {
    console.log(`Round already finished, ignoring duplicate finish attempt`);
    return;
  }

  lobby.game.roundFinished = true;
  clearTimers(lobby);

  let winnerId = instantWinnerId;
  let winningGuess = instantWinningGuess;

  // If no instant winner, find highest confidence
  if (!winnerId && lobby.game.guesses.length > 0) {
    lobby.game.guesses.sort((a, b) => b.confidence - a.confidence);
    winnerId = lobby.game.guesses[0].playerId;
    winningGuess = lobby.game.guesses[0];
  }

  if (winnerId) {
    const player = lobby.players.get(winnerId);
    if (!player) return;
    player.score += 1;
    lobby.game.roundWinner = player.name;
    lobby.game.roundWinnerId = winnerId;

    if (winningGuess) {
      lobby.game.winningGuess = winningGuess;
      console.log(
        `[${lobby.roundIndex}] Winning guess: [${winningGuess.playerId}, ${winningGuess.confidence}]`,
      );
    }
  }

  // Set a timeout to give the winner time to send their canvas
  lobby.game.canvasWaitTimer = setTimeout(() => {
    console.log(`Canvas wait timeout - transitioning without canvas`);
    transitionLobbyState(lobby, GameState.ROUND_END);
  }, 1000); // Wait 1 second for canvas

  // Broadcast immediately so winner knows to send canvas
  broadcastLobbyUpdate(lobby);
}

function clearTimers(lobby) {
  if (!lobby.game) return;

  if (lobby.game.startTimer) {
    clearTimeout(lobby.game.startTimer);
    lobby.game.startTimer = null;
  }

  if (lobby.game.roundTimer) {
    clearTimeout(lobby.game.roundTimer);
    lobby.game.roundTimer = null;
  }

  if (lobby.game.endTimer) {
    clearTimeout(lobby.game.endTimer);
    lobby.game.endTimer = null;
  }
}
