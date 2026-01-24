import { lobbyRepository } from "../../repositories/index.js";
import { GameState } from "../../types/game.js";
import { Lobby } from "../../types/lobby.js";
import {
  createInviteCode,
  createLobbyId,
  createUserId,
} from "../../utils/ids.js";
import { serializeLobby } from "../../utils/serializeLobby.js";

export function createLobby(req: any, res: any): void {
  let { displayName, isPublic, totalRounds } = req.body;
  if (!displayName || typeof displayName !== "string")
    return res.status(400).json({ error: "Display name required" });

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

  console.log(inviteCode);

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

export function joinLobby(req: any, res: any): void {
  let { displayName, inviteCode } = req.body;

  const lobby = lobbyRepository.getLobbyByInviteCode(inviteCode);
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

export function joinRandomLobby(req: any, res: any): void {
  let { displayName } = req.body;

  const publicLobbies = lobbyRepository.getPublicLobbies();
  const lobby = publicLobbies.find((lobby) => lobby.state === GameState.LOBBY);
  if (!lobby)
    return res.status(404).json({ error: "No public lobbies available" });

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
