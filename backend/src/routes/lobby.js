import { lobbies, inviteCodeMap } from "../state.js";
import { GameState } from "../../../shared/gameState.js";
import { createLobbyId, createUserId, createInviteCode } from "../utils/ids.js";
import express from "express";

// Helper functions

export function serializeLobby(lobby) {
  return {
    id: lobby.id,
    inviteCode: lobby.inviteCode,
    isPublic: lobby.isPublic,
    players: [...lobby.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
    })),
    state: lobby.state,
    createdAt: lobby.createdAt,
  };
}

// Lobby creation

export function createLobby(req, res) {
  const { displayName, isPublic } = req.body;

  if (!displayName)
    return res.status(400).json({ error: "Display name required" });
  if (isPublic == null)
    return res.status(400).json({ error: "isPublic is required" });

  const lobbyId = createLobbyId();
  let inviteCode;

  do {
    inviteCode = createInviteCode();
  } while (inviteCodeMap.has(inviteCode));

  const userId = createUserId();

  console.log(inviteCode);

  const lobby = {
    id: lobbyId,
    inviteCode,
    isPublic,
    players: new Map([
      [userId, { id: userId, name: displayName, ws: null, isHost: true }],
    ]),
    state: GameState.LOBBY,
    createdAt: Date.now(),
  };

  lobbies.set(lobbyId, lobby);
  inviteCodeMap.set(inviteCode, lobbyId);

  res.json({
    lobby: serializeLobby(lobby),
    userId,
  });
}

// Joining a lobby

export function joinLobby(req, res) {
  const { inviteCode, displayName } = req.body;

  // Find lobby by inviteCode
  const lobby = [...lobbies.values()].find((l) => l.inviteCode === inviteCode);

  if (!lobby) {
    return res.status(404).json({ error: "Lobby not found" });
  }

  const userId = createUserId();
  lobby.players.set(userId, {
    id: userId,
    name: displayName,
    ws: null,
    isHost: false,
  });

  res.json({
    lobby: serializeLobby(lobby),
    userId,
  });
}

export function joinRandomLobby(req, res) {
  const { displayName } = req.body;

  const publicLobbies = [...lobbies.values()].filter((l) => l.isPublic);

  if (publicLobbies.length === 0) {
    return res.status(404).json({ error: "No public lobbies available" });
  }

  const lobby = publicLobbies[Math.floor(Math.random() * publicLobbies.length)];

  const userId = createUserId();
  lobby.players.set(userId, {
    id: userId,
    name: displayName,
    ws: null,
    isHost: false,
  });

  res.json({
    lobby: serializeLobby(lobby),
    userId,
  });
}

const lobbyRoutes = express.Router();

lobbyRoutes.post("/create", createLobby);
lobbyRoutes.post("/join", joinLobby);
lobbyRoutes.post("/join-random", joinRandomLobby);

export default lobbyRoutes;
