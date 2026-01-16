import { useEffect, useRef } from "react";

export function useSocket({ wsRef, lobbyState, canvasState }) {
  const { lobbyInfo, updateLobby } = lobbyState;
  const { applyCanvasUpdate, applyCanvasUndo, clearCanvas } = canvasState;

  // Store callbacks in refs so they don't trigger reconnections
  const updateLobbyRef = useRef(updateLobby);
  const applyCanvasUpdateRef = useRef(applyCanvasUpdate);
  const applyCanvasUndoRef = useRef(applyCanvasUndo);
  const clearCanvasRef = useRef(clearCanvas);

  // Keep refs updated
  useEffect(() => {
    updateLobbyRef.current = updateLobby;
    applyCanvasUpdateRef.current = applyCanvasUpdate;
    applyCanvasUndoRef.current = applyCanvasUndo;
    clearCanvasRef.current = clearCanvas;
  });

  useEffect(() => {
    if (!lobbyInfo) return;

    console.log("Setting up WebSocket for lobby:", lobbyInfo.lobby.id);

    const ws = new WebSocket("ws://localhost:3000");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket opened");
      ws.send(
        JSON.stringify({
          type: "JOIN_LOBBY_SOCKET",
          lobbyId: lobbyInfo.lobby.id,
          userId: lobbyInfo.userId,
        })
      );
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      switch (msg.type) {
        case "LOBBY_UPDATE":
          updateLobbyRef.current(msg.lobby);
          break;

        case "CANVAS_STROKE_UPDATE":
          // Handle both in progress and completed strokes
          applyCanvasUpdateRef.current(
            msg.playerId,
            msg.stroke,
            msg.isComplete
          );
          break;

        case "CANVAS_UNDO":
          // Handle undo from other players
          applyCanvasUndoRef.current(msg.playerId);
          break;

        case "CANVAS_CLEAR":
          // Handle clear from other players
          clearCanvasRef.current(msg.playerId);
          break;
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      wsRef.current = null;
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      console.log("Cleaning up WebSocket");
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyInfo?.lobby?.id, lobbyInfo?.userId]);
}
