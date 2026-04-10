import { Lobby } from "../types/index.js";

export class LobbyRepository {
  private lobbies = new Map<string, Lobby>();
  private inviteCodeMap = new Map<string, string>(); // maps invite codes to lobby IDs

  createLobby(lobby: Lobby): void {
    this.lobbies.set(lobby.id, lobby);
    this.inviteCodeMap.set(lobby.inviteCode, lobby.id);
  }

  getLobby(lobbyId: string): Lobby | undefined {
    return this.lobbies.get(lobbyId);
  }

  getLobbyByInviteCode(inviteCode: string): Lobby | undefined {
    const lobbyId = this.inviteCodeMap.get(inviteCode.toUpperCase());
    return lobbyId ? this.lobbies.get(lobbyId) : undefined;
  }

  updateLobby(lobbyId: string, lobby: Lobby): void {
    this.lobbies.set(lobbyId, lobby);
  }

  deleteLobby(lobbyId: string): void {
    const lobby = this.lobbies.get(lobbyId);
    if (lobby) {
      this.inviteCodeMap.delete(lobby.inviteCode);
      this.lobbies.delete(lobbyId);
    }
  }

  getAllLobbies(): Lobby[] {
    return Array.from(this.lobbies.values());
  }

  getPublicLobbies(): Lobby[] {
    return this.getAllLobbies().filter((lobby) => lobby.isPublic);
  }

  lobbyExists(lobbyId: string): boolean {
    return this.lobbies.has(lobbyId);
  }

  inviteCodeExists(inviteCode: string): boolean {
    return this.inviteCodeMap.has(inviteCode.toUpperCase());
  }
}
