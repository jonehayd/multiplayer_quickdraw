import { useState, useRef } from "react";
import { createLobby, joinLobbyByCode, joinRandomLobby } from "../api/lobby";

export function useLobby() {
  const [lobbyInfo, setLobbyInfo] = useState(null);
  const wsRef = useRef(null);

  function leaveLobby() {
    const ws = wsRef.current;
    if (ws) {
      ws.close();
    }

    wsRef.current = null;
    setLobbyInfo(null);
  }

  async function handleAction(payload) {
    let data;

    if (payload.actionType === "create") {
      data = await createLobby({
        displayName: payload.displayName,
        isPublic: payload.lobbyType === "public",
      });
    } else if (payload.actionType === "joinCode") {
      data = await joinLobbyByCode({
        displayName: payload.displayName,
        inviteCode: payload.inviteCode,
      });
    } else if (payload.actionType === "joinRandom") {
      data = await joinRandomLobby({
        displayName: payload.displayName,
      });
    }

    // Save lobby info
    setLobbyInfo(data);

    // Connect WebSocket
    connectSocket(data);
  }

  function connectSocket(data) {
    if (wsRef.current) wsRef.current.close(); // close previous socket

    const ws = new WebSocket("ws://localhost:3000");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "JOIN_LOBBY_SOCKET",
          lobbyId: data.lobby.id,
          userId: data.userId,
        })
      );
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "LOBBY_UPDATE") {
        setLobbyInfo((prev) => ({
          ...prev,
          lobby: msg.lobby,
        }));
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
  }

  return { lobbyInfo, handleAction, leaveLobby };
}
