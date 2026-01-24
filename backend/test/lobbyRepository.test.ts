import { describe, it, expect, beforeEach } from "vitest";
import { LobbyRepository } from "../src/repositories/lobbyRepository.js";
import { Lobby, GameState } from "../src/types/index.js";

describe("LobbyRepository", () => {
  let repo: LobbyRepository;
  let mockLobby: Lobby;

  beforeEach(() => {
    repo = new LobbyRepository();

    mockLobby = {
      id: "lobby-1",
      inviteCode: "ABC123",
      isPublic: true,
      totalRounds: 3,
      state: GameState.LOBBY,
      players: new Map(),
      words: [],
      roundIndex: 0,
      game: null,
      winningCanvases: [],
      createdAt: Date.now(),
    };
  });

  describe("createLobby", () => {
    it("should create a lobby", () => {
      repo.createLobby(mockLobby);

      expect(repo.getLobby("lobby-1")).toBe(mockLobby);
      expect(repo.lobbyExists("lobby-1")).toBe(true);
    });

    it("should map invite code to lobby id", () => {
      repo.createLobby(mockLobby);

      expect(repo.getLobbyByInviteCode("ABC123")).toBe(mockLobby);
      expect(repo.inviteCodeExists("ABC123")).toBe(true);
    });
  });

  describe("getLobby", () => {
    it("should return lobby by id", () => {
      repo.createLobby(mockLobby);

      expect(repo.getLobby("lobby-1")).toBe(mockLobby);
    });

    it("should return undefined for non-existent lobby", () => {
      expect(repo.getLobby("non-existent")).toBeUndefined();
    });
  });

  describe("getLobbyByInviteCode", () => {
    it("should return lobby by invite code", () => {
      repo.createLobby(mockLobby);

      expect(repo.getLobbyByInviteCode("ABC123")).toBe(mockLobby);
    });

    it("should return undefined for non-existent invite code", () => {
      expect(repo.getLobbyByInviteCode("INVALID")).toBeUndefined();
    });
  });

  describe("updateLobby", () => {
    it("should update existing lobby", () => {
      repo.createLobby(mockLobby);

      const updatedLobby = { ...mockLobby, totalRounds: 5 };
      repo.updateLobby("lobby-1", updatedLobby);

      expect(repo.getLobby("lobby-1")?.totalRounds).toBe(5);
    });
  });

  describe("deleteLobby", () => {
    it("should delete lobby and invite code mapping", () => {
      repo.createLobby(mockLobby);

      repo.deleteLobby("lobby-1");

      expect(repo.getLobby("lobby-1")).toBeUndefined();
      expect(repo.getLobbyByInviteCode("ABC123")).toBeUndefined();
      expect(repo.lobbyExists("lobby-1")).toBe(false);
      expect(repo.inviteCodeExists("ABC123")).toBe(false);
    });

    it("should handle deleting non-existent lobby gracefully", () => {
      expect(() => repo.deleteLobby("non-existent")).not.toThrow();
    });
  });

  describe("getAllLobbies", () => {
    it("should return all lobbies", () => {
      const lobby2: Lobby = {
        ...mockLobby,
        id: "lobby-2",
        inviteCode: "XYZ789",
      };

      repo.createLobby(mockLobby);
      repo.createLobby(lobby2);

      expect(repo.getAllLobbies()).toHaveLength(2);
      expect(repo.getAllLobbies()).toContain(mockLobby);
      expect(repo.getAllLobbies()).toContain(lobby2);
    });

    it("should return empty array when no lobbies exist", () => {
      expect(repo.getAllLobbies()).toEqual([]);
    });
  });

  describe("getPublicLobbies", () => {
    it("should return only public lobbies", () => {
      const privateLobby: Lobby = {
        ...mockLobby,
        id: "lobby-2",
        inviteCode: "XYZ789",
        isPublic: false,
      };

      repo.createLobby(mockLobby);
      repo.createLobby(privateLobby);

      const publicLobbies = repo.getPublicLobbies();

      expect(publicLobbies).toHaveLength(1);
      expect(publicLobbies[0]).toBe(mockLobby);
    });

    it("should return empty array when no public lobbies exist", () => {
      const privateLobby: Lobby = {
        ...mockLobby,
        isPublic: false,
      };

      repo.createLobby(privateLobby);

      expect(repo.getPublicLobbies()).toEqual([]);
    });
  });
});
