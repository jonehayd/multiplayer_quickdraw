import { lobbyRepository } from "../../repositories/index.js";
import { lobbyService } from "../../services/index.js";
import { JoinLobbyMessage, MessageContext } from "../../types/index.js";
import { broadcastLobbyUpdate } from "./index.js";
import { WebSocket } from "ws";

export function handleDisconnect({ context }: { context: MessageContext }) {
  const { currentLobbyId, currentUserId } = context;
  if (!currentLobbyId || !currentUserId) return;

  lobbyService.handleDisconnect(currentLobbyId, currentUserId);

  const lobby = lobbyRepository.getLobby(currentLobbyId);
  if (lobby) {
    broadcastLobbyUpdate(lobby);
  }
}

export function handleJoinLobby({
  context,
  ws,
  msg,
}: {
  context: MessageContext;
  ws: WebSocket;
  msg: JoinLobbyMessage;
}) {
  const { lobbyId, userId } = msg;
  context.currentLobbyId = lobbyId;
  context.currentUserId = userId;

  const lobby = lobbyRepository.getLobby(lobbyId);
  if (!lobby) return;

  const player = lobby.players.get(userId);
  if (player) {
    lobbyService.cancelDisconnectTimer(lobbyId, userId);
    player.ws = ws;
  }

  broadcastLobbyUpdate(lobby);
}
