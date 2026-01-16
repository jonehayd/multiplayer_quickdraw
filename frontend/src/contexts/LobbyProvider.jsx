import { useRef, useMemo } from "react";
import { useLobby } from "./useLobby";
import { useSocket } from "./useWebSocket";
import { useCanvas } from "./useCanvas";
import { LobbyContext } from "./LobbyContext";

export function LobbyProvider({ children }) {
  const wsRef = useRef(null);

  const lobbyState = useLobby();
  const canvasState = useCanvas();

  useSocket({
    wsRef,
    lobbyState,
    canvasState,
  });

  const send = useMemo(() => {
    return (payload) => {
      if (wsRef.current?.readyState === 1) {
        wsRef.current.send(JSON.stringify(payload));
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      ...lobbyState,
      ...canvasState,
      send,
    }),
    [lobbyState, canvasState, send]
  );

  return (
    <LobbyContext.Provider value={value}>{children}</LobbyContext.Provider>
  );
}
