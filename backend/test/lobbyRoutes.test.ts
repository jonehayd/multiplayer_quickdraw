import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createLobby,
  joinLobby,
  joinRandomLobby,
} from "../src/handlers/http/lobbyRoutes.js";
import { lobbyRepository } from "../src/repositories/index.js";
import { GameState } from "../src/types/game.js";
import { Lobby } from "../src/types/lobby.js";

// Mock the ID generation utilities
vi.mock("../src/utils/ids.js", () => ({
  createLobbyId: vi.fn(() => "lobby-123"),
  createInviteCode: vi.fn(() => "INVITE123"),
  createUserId: vi.fn(() => "user-123"),
}));

describe("Lobby HTTP Routes", () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    // Clear repository before each test
    lobbyRepository["lobbies"].clear();
    lobbyRepository["inviteCodeMap"].clear();

    // Create mock request and response objects
    mockReq = {
      body: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  describe("createLobby", () => {
    it("should create a lobby with valid input", () => {
      mockReq.body = {
        displayName: "Test Player",
        isPublic: true,
        totalRounds: 5,
      };

      createLobby(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledOnce();
      const response = mockRes.json.mock.calls[0][0];

      expect(response.userId).toBe("user-123");
      expect(response.lobby).toBeDefined();
      expect(response.lobby.id).toBe("lobby-123");
      expect(response.lobby.inviteCode).toBe("INVITE123");
      expect(response.lobby.isPublic).toBe(true);
      expect(response.lobby.totalRounds).toBe(5);
      expect(response.lobby.state).toBe(GameState.LOBBY);
      expect(response.lobby.players).toHaveLength(1);
      expect(response.lobby.players[0].name).toBe("Test Player");
      expect(response.lobby.players[0].isHost).toBe(true);
    });

    it("should default to public lobby if not specified", () => {
      mockReq.body = {
        displayName: "Test Player",
        totalRounds: 5,
      };

      createLobby(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.lobby.isPublic).toBe(true);
    });

    it("should default to 9 rounds if not specified", () => {
      mockReq.body = {
        displayName: "Test Player",
        isPublic: true,
      };

      createLobby(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.lobby.totalRounds).toBe(9);
    });

    it("should create private lobby when isPublic is false", () => {
      mockReq.body = {
        displayName: "Test Player",
        isPublic: false,
        totalRounds: 3,
      };

      createLobby(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.lobby.isPublic).toBe(false);
    });

    it("should return 400 if displayName is missing", () => {
      mockReq.body = {
        isPublic: true,
        totalRounds: 5,
      };

      createLobby(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Display name required",
      });
    });

    it("should return 400 if displayName is not a string", () => {
      mockReq.body = {
        displayName: 123,
        isPublic: true,
        totalRounds: 5,
      };

      createLobby(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Display name required",
      });
    });

    it("should generate unique invite codes", async () => {
      const { createInviteCode } = await import("../src/utils/ids.js");
      let callCount = 0;
      vi.mocked(createInviteCode).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? "TAKEN123" : "UNIQUE123";
      });

      // Create a lobby with the first invite code
      lobbyRepository["inviteCodeMap"].set("TAKEN123", "some-lobby");

      mockReq.body = {
        displayName: "Test Player",
      };

      createLobby(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.lobby.inviteCode).toBe("UNIQUE123");
    });
  });

  describe("joinLobby", () => {
    let existingLobby: Lobby;

    beforeEach(() => {
      existingLobby = {
        id: "lobby-existing",
        inviteCode: "EXISTING",
        isPublic: true,
        totalRounds: 5,
        state: GameState.LOBBY,
        players: new Map([
          [
            "host-123",
            {
              id: "host-123",
              name: "Host",
              ws: null,
              isHost: true,
              score: 0,
            },
          ],
        ]),
        words: [],
        roundIndex: 0,
        game: null,
        winningCanvases: [],
        createdAt: Date.now(),
      };

      lobbyRepository.createLobby(existingLobby);
    });

    it("should join an existing lobby with valid invite code", () => {
      mockReq.body = {
        displayName: "New Player",
        inviteCode: "EXISTING",
      };

      joinLobby(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledOnce();
      const response = mockRes.json.mock.calls[0][0];

      expect(response.userId).toBe("user-123");
      expect(response.lobby.players).toHaveLength(2);
      expect(response.lobby.players[1].name).toBe("New Player");
      expect(response.lobby.players[1].isHost).toBe(false);
    });

    it("should return 404 if lobby not found", () => {
      mockReq.body = {
        displayName: "New Player",
        inviteCode: "INVALID",
      };

      joinLobby(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lobby not found",
      });
    });

    it("should add player to existing lobby players map", () => {
      mockReq.body = {
        displayName: "Player 2",
        inviteCode: "EXISTING",
      };

      joinLobby(mockReq, mockRes);

      const lobby = lobbyRepository.getLobbyByInviteCode("EXISTING");
      expect(lobby?.players.size).toBe(2);
      expect(lobby?.players.get("user-123")).toEqual({
        id: "user-123",
        name: "Player 2",
        ws: null,
        isHost: false,
        score: 0,
      });
    });
  });

  describe("joinRandomLobby", () => {
    beforeEach(() => {
      // Create multiple lobbies with different states
      const publicLobbyInGame: Lobby = {
        id: "lobby-1",
        inviteCode: "CODE1",
        isPublic: true,
        totalRounds: 5,
        state: GameState.GAME,
        players: new Map([
          ["p1", { id: "p1", name: "P1", ws: null, isHost: true, score: 0 }],
        ]),
        words: [],
        roundIndex: 0,
        game: null,
        winningCanvases: [],
        createdAt: Date.now(),
      };

      const publicLobbyWaiting: Lobby = {
        id: "lobby-2",
        inviteCode: "CODE2",
        isPublic: true,
        totalRounds: 5,
        state: GameState.LOBBY,
        players: new Map([
          ["p2", { id: "p2", name: "P2", ws: null, isHost: true, score: 0 }],
        ]),
        words: [],
        roundIndex: 0,
        game: null,
        winningCanvases: [],
        createdAt: Date.now(),
      };

      const privateLobby: Lobby = {
        id: "lobby-3",
        inviteCode: "CODE3",
        isPublic: false,
        totalRounds: 5,
        state: GameState.LOBBY,
        players: new Map([
          ["p3", { id: "p3", name: "P3", ws: null, isHost: true, score: 0 }],
        ]),
        words: [],
        roundIndex: 0,
        game: null,
        winningCanvases: [],
        createdAt: Date.now(),
      };

      lobbyRepository.createLobby(publicLobbyInGame);
      lobbyRepository.createLobby(publicLobbyWaiting);
      lobbyRepository.createLobby(privateLobby);
    });

    it("should join a public lobby in LOBBY state", () => {
      mockReq.body = {
        displayName: "Random Player",
      };

      joinRandomLobby(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledOnce();
      const response = mockRes.json.mock.calls[0][0];

      expect(response.userId).toBe("user-123");
      expect(response.lobby.id).toBe("lobby-2");
      expect(response.lobby.state).toBe(GameState.LOBBY);
      expect(response.lobby.players).toHaveLength(2);
    });

    it("should return 404 if no public lobbies are available", () => {
      // Clear all lobbies
      lobbyRepository["lobbies"].clear();
      lobbyRepository["inviteCodeMap"].clear();

      mockReq.body = {
        displayName: "Random Player",
      };

      joinRandomLobby(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "No public lobbies available",
      });
    });

    it("should return 404 if no public lobbies in LOBBY state", () => {
      // Clear and add only in-game lobby
      lobbyRepository["lobbies"].clear();
      lobbyRepository["inviteCodeMap"].clear();

      const inGameLobby: Lobby = {
        id: "lobby-game",
        inviteCode: "GAME",
        isPublic: true,
        totalRounds: 5,
        state: GameState.GAME,
        players: new Map([
          ["p1", { id: "p1", name: "P1", ws: null, isHost: true, score: 0 }],
        ]),
        words: [],
        roundIndex: 0,
        game: null,
        winningCanvases: [],
        createdAt: Date.now(),
      };

      lobbyRepository.createLobby(inGameLobby);

      mockReq.body = {
        displayName: "Random Player",
      };

      joinRandomLobby(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "No public lobbies available",
      });
    });

    it("should add player to found lobby", () => {
      mockReq.body = {
        displayName: "Joined Player",
      };

      joinRandomLobby(mockReq, mockRes);

      const lobby = lobbyRepository.getLobby("lobby-2");
      expect(lobby?.players.size).toBe(2);
      expect(lobby?.players.get("user-123")).toEqual({
        id: "user-123",
        name: "Joined Player",
        ws: null,
        isHost: false,
        score: 0,
      });
    });
  });
});
