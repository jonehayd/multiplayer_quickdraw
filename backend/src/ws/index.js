import {
  handleJoinLobby,
  handleStartGame,
  handleCanvasStroke,
  handleCanvasUndo,
  handleCanvasClear,
  handleDisconnect,
} from "./handlers.js";

const handlers = {
  JOIN_LOBBY_SOCKET: handleJoinLobby,
  START_GAME: handleStartGame,
  CANVAS_STROKE_COMPLETE: handleCanvasStroke,
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
