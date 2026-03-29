import { useState, useEffect } from "react";

const STORAGE_KEY = "quickdraw_reconnect";
const API_BASE = import.meta.env.VITE_API_URL ?? "";

export function useLobby() {
  const [lobbyInfo, setLobbyInfo] = useState(null);

  async function request(url, body) {
    const res = await fetch(`${API_BASE}${url}`, {
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

  // On mount, try to restore a previous session, but only on a genuine page reload.
  // Tab duplications also trigger mount, so we use the navigation timing API to tell them apart.
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const navType = performance.getEntriesByType("navigation")[0]?.type;
    if (navType !== "reload") {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(saved);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    request("/api/lobby/reconnect", parsed)
      .then((data) => setLobbyInfo(data))
      .catch(() => sessionStorage.removeItem(STORAGE_KEY));
  }, []);

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
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ lobbyId: data.lobby.id, userId: data.userId }),
    );
    return data;
  }

  function leaveLobby() {
    sessionStorage.removeItem(STORAGE_KEY);
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
