import { inviteCodeMap, lobbies } from "../state.js";
import { GameState, RoundLengths } from "../../../shared/gameState.js";
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

  lobby.roundIndex = 0;

  // Initialize round
  lobby.game = {
    roundTimer: null,
    startTimer: null,
    endTimer: null,
    guesses: [],
    roundWinner: null,
  };

  transitionLobbyState(lobby, GameState.ROUND_START);
}

export function handleGuess({ msg, context }) {
  const lobby = lobbies.get(context.currentLobbyId);
  if (!lobby || lobby.state !== GameState.GAME) return;

  const word = lobby.words[lobby.roundIndex];

  const correct = msg.predictions.find((p) => p.label === word);

  if (!correct) return;

  lobby.game.guesses.push({
    playerId: context.currentUserId,
    confidence: correct.confidence,
  });

  if (correct.confidence >= 0.8) {
    finishRound(lobby, context.currentUserId);
  }
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
  lobby.roundWinner = null;

  lobby.game.startTimer = setTimeout(() => {
    transitionLobbyState(lobby, GameState.GAME);
  }, RoundLengths.START_ROUND_LEN);
}

function startGamePhase(lobby) {
  clearTimers(lobby);

  lobby.game.guesses = [];
  lobby.game.roundWinner = null;

  lobby.game.roundTimer = setTimeout(() => {
    finishRound(lobby);
  }, RoundLengths.ROUND_LEN);
}

function startRoundEnd(lobby) {
  clearTimers(lobby);

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
      startRoundStart(lobby);
      break;

    case GameState.GAME:
      startGamePhase(lobby);
      break;

    case GameState.ROUND_END:
      startRoundEnd(lobby);
      break;

    case GameState.GAME_END:
      endGame(lobby);
      break;
  }

  broadcastLobbyUpdate(lobby);
}

function finishRound(lobby, instantWinnerId = null) {
  if (lobby.state !== GameState.GAME) return;
  clearTimers(lobby);

  let winnerId = instantWinnerId;

  if (!winnerId && lobby.game.guesses.length > 0) {
    lobby.game.guesses.sort((a, b) => b.confidence - a.confidence);
    winnerId = lobby.game.guesses[0].playerId;
  }

  if (winnerId) {
    const player = lobby.players.get(winnerId);
    player.score += 1;
    lobby.roundWinner = player.name;
  }

  transitionLobbyState(lobby, GameState.ROUND_END);
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
