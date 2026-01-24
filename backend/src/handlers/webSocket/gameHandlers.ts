import { lobbyRepository } from "../../repositories/index.js";
import { lobbyService } from "../../services/index.js";
import {
  GuessMessage,
  MessageContext,
  WinningCanvasMessage,
} from "../../types/index.js";
import { broadcastLobbyUpdate } from "./broadcast.js";

export function handleStartGame({ context }: { context: MessageContext }) {
  const { currentLobbyId, currentUserId } = context;
  if (!currentLobbyId || !currentUserId) return;

  const lobby = lobbyRepository.getLobby(currentLobbyId);
  if (!lobby) return;

  const player = lobby.players.get(currentUserId);
  if (!player?.isHost) return;
  if (lobby.players.size < 2) return;

  lobbyService.startGame(currentLobbyId, currentUserId);
}

export function handleGuess({
  context,
  msg,
}: {
  context: MessageContext;
  msg: GuessMessage;
}) {
  const { currentLobbyId, currentUserId } = context;
  if (!currentLobbyId || !currentUserId) return;

  const lobby = lobbyRepository.getLobby(currentLobbyId);
  if (!lobby) return;

  lobbyService.handleGuess(lobby, currentUserId, msg.predictions);
}

export function handleWinningCanvas({
  context,
  msg,
}: {
  context: MessageContext;
  msg: WinningCanvasMessage;
}) {
  const { currentLobbyId, currentUserId } = context;
  if (!currentLobbyId || !currentUserId) return;

  const lobby = lobbyRepository.getLobby(currentLobbyId);
  if (!lobby) return;

  lobbyService.handleWinningCanvas(lobby, currentUserId, msg.canvas);
}
