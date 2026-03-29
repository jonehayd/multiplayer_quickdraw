import { WebSocketServer, WebSocket } from "ws";
import { lobbyEvents, LobbyEvent } from "../events/lobbyEvents.js";
import {
  handleJoinLobby,
  handleStartGame,
  handleGuess,
  handleCanvasStroke,
  handleCanvasUndo,
  handleCanvasClear,
  handleDisconnect,
  handleWinningCanvas,
  broadcastLobbyUpdate,
} from "../handlers/webSocket/index.js";

const handlers: Record<string, Function> = {
  JOIN_LOBBY: handleJoinLobby,
  START_GAME: handleStartGame,
  GUESS: handleGuess,
  WINNING_CANVAS: handleWinningCanvas,
  CANVAS_STROKE: handleCanvasStroke,
  CANVAS_UNDO: handleCanvasUndo,
  CANVAS_CLEAR: handleCanvasClear,
};

export function setupWebSockets(wss: WebSocketServer) {
  // Whenever any part of the service emits a state change, push the updated lobby to all connected clients
  lobbyEvents.on(LobbyEvent.STATE_CHANGED, (lobby) => {
    broadcastLobbyUpdate(lobby);
  });

  wss.on("connection", (ws: WebSocket) => {
    const context: any = {
      currentLobbyId: null,
      currentUserId: null,
    };

    ws.on("message", (data: any) => {
      let msg: any;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return;
      }

      const handler = handlers[msg.type];
      if (handler) {
        (async () => {
          try {
            await handler({ context, ws, msg });
          } catch (e) {
            console.log(`Error handling message ${msg.type}: `, e);
          }
        })();
      }
    });

    ws.on("close", () => handleDisconnect({ context }));
  });
}
