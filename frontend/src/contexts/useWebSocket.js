import { useEffect, useRef } from "react";

export function useSocket({ wsRef, lobbyState, canvasState }) {
  const { lobbyInfo, updateLobby } = lobbyState;
  const { applyCanvasUpdate, applyCanvasUndo, clearCanvas } = canvasState;

  // Store callbacks in refs so they don't trigger reconnections
  const updateLobbyRef = useRef(updateLobby);
  const applyCanvasUpdateRef = useRef(applyCanvasUpdate);
  const applyCanvasUndoRef = useRef(applyCanvasUndo);
  const clearCanvasRef = useRef(clearCanvas);
  const hasSentCanvasRef = useRef(false);

  // Keep callback refs up to date so the WebSocket effect doesn't need to re-run when they change
  useEffect(() => {
    updateLobbyRef.current = updateLobby;
    applyCanvasUpdateRef.current = applyCanvasUpdate;
    applyCanvasUndoRef.current = applyCanvasUndo;
    clearCanvasRef.current = clearCanvas;
  });

  // Clear canvases on round transitions
  useEffect(() => {
    if (!lobbyInfo) return;

    // When entering ROUND_START, clear all canvases so the board is fresh for the new round
    if (lobbyInfo.lobby.state === "ROUND_START") {
      hasSentCanvasRef.current = false;
      lobbyInfo.lobby.players.forEach((player) => {
        clearCanvasRef.current(player.id);
      });
    }

    // When entering ROUND_END, only clear other players' canvases so the current player can still see their own drawing
    if (lobbyInfo.lobby.state === "ROUND_END") {
      const otherPlayers = lobbyInfo.lobby.players.filter(
        (player) => player.id !== lobbyInfo.userId,
      );
      otherPlayers.forEach((player) => {
        clearCanvasRef.current(player.id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    lobbyInfo?.lobby?.roundWinnerId,
    lobbyInfo?.lobby?.state,
    lobbyInfo?.userId,
  ]);

  useEffect(() => {
    if (!lobbyInfo) return;

    console.log("Setting up WebSocket for lobby:", lobbyInfo.lobby.id);

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const wsUrl = apiUrl.replace(/^http/, "ws"); // converts http to ws and https to wss
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "JOIN_LOBBY",
          lobbyId: lobbyInfo.lobby.id,
          userId: lobbyInfo.userId,
        }),
      );
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      switch (msg.type) {
        case "LOBBY_UPDATE":
          updateLobbyRef.current(msg.lobby);
          break;

        case "CANVAS_STROKE":
          applyCanvasUpdateRef.current(
            msg.playerId,
            msg.stroke,
            msg.isComplete,
          );
          break;

        case "CANVAS_UNDO":
          applyCanvasUndoRef.current(msg.playerId);
          break;

        case "CANVAS_CLEAR":
          clearCanvasRef.current(msg.playerId);
          break;
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyInfo?.lobby?.id, lobbyInfo?.userId]);
}
