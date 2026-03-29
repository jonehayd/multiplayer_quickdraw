import { lobbyRepository } from "../../repositories/index.js";
import {
  CanvasClearMessage,
  CanvasStrokeMessage,
  CanvasUndoMessage,
  MessageContext,
  Player,
} from "../../types/index.js";

function broadcastToOtherPlayers(
  players: Player[],
  playerId: string,
  msg: any,
) {
  players.forEach((player) => {
    if (player.id !== playerId && player.ws?.readyState === 1) {
      player.ws.send(JSON.stringify(msg));
    }
  });
}

export function handleCanvasStroke({
  context,
  msg,
}: {
  context: MessageContext;
  msg: CanvasStrokeMessage;
}) {
  const { currentLobbyId, currentUserId } = context;
  if (!currentLobbyId || !currentUserId) return;

  const lobby = lobbyRepository.getLobby(currentLobbyId);
  if (!lobby) return;

  const { playerId, stroke, isComplete } = msg;

  const msgToSend: CanvasStrokeMessage = {
    type: "CANVAS_STROKE",
    playerId,
    stroke,
    isComplete,
  };

  const players = lobby.players.values();
  broadcastToOtherPlayers(Array.from(players), playerId, msgToSend);
}

export function handleCanvasUndo({
  context,
  msg,
}: {
  context: MessageContext;
  msg: CanvasUndoMessage;
}) {
  const { currentLobbyId, currentUserId } = context;
  if (!currentLobbyId || !currentUserId) return;

  const lobby = lobbyRepository.getLobby(currentLobbyId);
  if (!lobby) return;

  const { playerId } = msg;

  const msgToSend: CanvasUndoMessage = {
    type: "CANVAS_UNDO",
    playerId,
  };

  const players = lobby.players.values();
  broadcastToOtherPlayers(Array.from(players), playerId, msgToSend);
}

export function handleCanvasClear({
  context,
  msg,
}: {
  context: MessageContext;
  msg: CanvasClearMessage;
}) {
  const { currentLobbyId, currentUserId } = context;
  if (!currentLobbyId || !currentUserId) return;

  const lobby = lobbyRepository.getLobby(currentLobbyId);
  if (!lobby) return;

  const { playerId } = msg;

  const msgToSend: CanvasClearMessage = {
    type: "CANVAS_CLEAR",
    playerId,
  };

  const players = lobby.players.values();
  broadcastToOtherPlayers(Array.from(players), playerId, msgToSend);
}
