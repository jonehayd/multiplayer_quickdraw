import { useEffect, useRef } from "react";

export function useSocket({ wsRef, lobbyState, canvasState }) {
  const { lobbyInfo, updateLobby } = lobbyState;
  const { applyCanvasUpdate, clearCanvas } = canvasState;
  const isConnecting = useRef(false);

  useEffect(() => {
    if (!lobbyInfo) return;
    if (isConnecting.current) return; // Prevent double connection

    isConnecting.current = true;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

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
          updateLobby(msg.lobby);
          break;
        case "CANVAS_UPDATE":
          applyCanvasUpdate(msg.playerId, msg.strokes);
          break;
        case "CLEAR_CANVAS":
          clearCanvas(msg.lobby);
          break;
      }
    };

    ws.onclose = () => {
      console.log("Websocket closed");
      wsRef.current = null;
      isConnecting.current = false;
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyInfo?.lobby?.id, lobbyInfo?.userId]);
}
