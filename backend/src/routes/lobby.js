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
      score: p.score,
    })),
    state: lobby.state,
    word: lobby.words?.[lobby.roundIndex] ?? null,
    roundIndex: lobby.roundIndex,
    totalRounds: lobby.totalRounds,
    createdAt: lobby.createdAt,
  };
}

// Lobby creation

export function createLobby(req, res) {
  let { displayName, isPublic, totalRounds } = req.body;

  if (!displayName)
    return res.status(400).json({ error: "Display name required" });

  // Default public
  if (isPublic === undefined) {
    isPublic = true;
  }

  // Default to 9 rounds if number not specified
  if (!totalRounds) {
    totalRounds = 9;
  }

  const lobbyId = createLobbyId();
  let inviteCode;

  // Create a unique invite code and add it to the map
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
      [
        userId,
        { id: userId, name: displayName, ws: null, isHost: true, score: 0 },
      ],
    ]),
    totalRounds: totalRounds,
    roundIndex: 0,
    words: [],
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
    score: 0,
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
    score: 0,
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
