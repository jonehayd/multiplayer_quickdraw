import { Lobby, LobbyData } from "../types/lobby.js";

export function serializeLobby(lobby: Lobby): LobbyData {
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
    roundWinner: lobby.game?.roundWinner ?? null,
    roundWinnerId: lobby.game?.roundWinnerId ?? null,
    winningGuess: lobby.game?.winningGuess ?? null,
    winningCanvas: lobby.winningCanvases?.at(-1)?.canvas ?? null,
    winningCanvases: lobby.winningCanvases ?? [],
    createdAt: lobby.createdAt,
    phaseStartedAt: lobby.game?.phaseStartedAt ?? null,
    phaseDuration: lobby.game?.phaseDuration ?? null,
  };
}
