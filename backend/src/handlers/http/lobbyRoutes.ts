import { Request, Response } from "express";
import { lobbyRepository } from "../../repositories/index.js";
import { GameState } from "../../types/game.js";
import { Lobby } from "../../types/lobby.js";
import {
  createInviteCode,
  createLobbyId,
  createUserId,
} from "../../utils/ids.js";
import { serializeLobby } from "../../utils/serializeLobby.js";
import { MAX_LOBBY_CAPACITY } from "../../config/constants.js";

export function createLobby(req: Request, res: Response): void {
  let { displayName, isPublic, totalRounds } = req.body;
  if (!displayName || typeof displayName !== "string") {
    res.status(400).json({ error: "Display name required" });
    return;
  }

  // Default public
  if (isPublic === undefined) isPublic = true;

  // Default to 9 rounds if number not specified
  if (!totalRounds) {
    totalRounds = 9;
  }

  const lobbyId = createLobbyId();
  let inviteCode;
  do {
    inviteCode = createInviteCode();
  } while (lobbyRepository.inviteCodeExists(inviteCode));

  const userId = createUserId();

  const lobby: Lobby = {
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

  lobbyRepository.createLobby(lobby);

  res.json({
    lobby: serializeLobby(lobby),
    userId,
  });
}

export function joinLobby(req: Request, res: Response): void {
  const { displayName, inviteCode } = req.body;

  if (!displayName || typeof displayName !== "string") {
    res.status(400).json({ error: "Display name required" });
    return;
  }

  const lobby = lobbyRepository.getLobbyByInviteCode(inviteCode);
  if (!lobby) {
    res.status(404).json({ error: "Lobby not found" });
    return;
  }

  if (lobby.state !== GameState.LOBBY) {
    res.status(409).json({ error: "Game already in progress" });
    return;
  }

  if (lobby.players.size >= MAX_LOBBY_CAPACITY) {
    res.status(409).json({ error: "Lobby is full" });
    return;
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

export function joinRandomLobby(req: Request, res: Response): void {
  const { displayName } = req.body;

  if (!displayName || typeof displayName !== "string") {
    res.status(400).json({ error: "Display name required" });
    return;
  }

  const publicLobbies = lobbyRepository.getPublicLobbies();
  const lobby = publicLobbies.find(
    (lobby) =>
      lobby.state === GameState.LOBBY &&
      lobby.players.size < MAX_LOBBY_CAPACITY,
  );
  if (!lobby) {
    res.status(404).json({ error: "No public lobbies available" });
    return;
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

export function reconnectLobby(req: Request, res: Response): void {
  const { lobbyId, userId } = req.body;

  if (
    !lobbyId ||
    typeof lobbyId !== "string" ||
    !userId ||
    typeof userId !== "string"
  ) {
    res.status(400).json({ error: "lobbyId and userId are required" });
    return;
  }

  const lobby = lobbyRepository.getLobby(lobbyId);
  if (!lobby) {
    res.status(404).json({ error: "Lobby not found" });
    return;
  }

  if (!lobby.players.has(userId)) {
    res.status(404).json({ error: "Player not found in lobby" });
    return;
  }

  res.json({
    lobby: serializeLobby(lobby),
    userId,
  });
}
