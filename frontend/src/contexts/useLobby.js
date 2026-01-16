import { useState } from "react";

export function useLobby() {
  const [lobbyInfo, setLobbyInfo] = useState(null);

  async function request(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  async function handleAction(payload) {
    const { displayName, isPublic, inviteCode } = payload;
    let data;

    if (payload.actionType === "create") {
      data = await request("/api/lobby/create", { displayName, isPublic });
    }

    if (payload.actionType === "joinCode") {
      data = await request("/api/lobby/join", { displayName, inviteCode });
    }

    if (payload.actionType === "joinRandom") {
      data = await request("/api/lobby/join-random", { displayName });
    }

    setLobbyInfo(data);
    return data;
  }

  function leaveLobby() {
    setLobbyInfo(null);
  }

  function updateLobby(lobby) {
    setLobbyInfo((prev) => ({
      ...prev,
      lobby,
    }));
  }

  return {
    lobbyInfo,
    handleAction,
    leaveLobby,
    updateLobby,
  };
}
