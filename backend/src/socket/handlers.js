import { inviteCodeMap, lobbies } from "../state.js";
import { GameState } from "../../../shared/gameState.js";
import { serializeLobby } from "../routes/lobby.js";

// Handlers

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

export function handleStartGame({ context }) {
  const { currentLobbyId, currentUserId } = context;
  if (!currentLobbyId || !currentUserId) return;

  const lobby = lobbies.get(currentLobbyId);
  if (!lobby) return;

  const player = lobby.players.get(currentUserId);
  if (!player?.isHost) return;
  if (lobby.players.size < 2) return;

  lobby.state = GameState.GAME;
  broadcastLobbyUpdate(lobby);
}

export function handleCanvasStroke({ msg, context }) {}

export function handleCanvasUndo({ msg, context }) {}

export function handleCanvasClear({ msg, context }) {}

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

function broadcastCanvasUpdate(lobby, playerId) {}
