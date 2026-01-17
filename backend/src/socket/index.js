import {
  handleJoinLobby,
  handleStartGame,
  handleGuess,
  handleCanvasStroke,
  handleCanvasUndo,
  handleCanvasClear,
  handleDisconnect,
} from "./handlers.js";

const handlers = {
  // Lobby / game flow
  JOIN_LOBBY_SOCKET: handleJoinLobby,
  START_GAME: handleStartGame,
  GUESS: handleGuess,

  // Canvas (real-time passthrough)
  CANVAS_STROKE_UPDATE: handleCanvasStroke,
  CANVAS_UNDO: handleCanvasUndo,
  CANVAS_CLEAR: handleCanvasClear,
};

export function setupWebSockets(wss) {
  wss.on("connection", (ws) => {
    const context = {
      currentLobbyId: null,
      currentUserId: null,
    };

    ws.on("message", (data) => {
      let msg;
      try {
        msg = JSON.parse(data);
      } catch {
        return;
      }

      const handler = handlers[msg.type];
      if (handler) {
        handler({ ws, msg, context });
      }
    });

    ws.on("close", () => handleDisconnect(context));
  });
}
