import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  handleDisconnect,
  handleJoinLobby,
  handleStartGame,
  handleGuess,
  handleCanvasStroke,
  handleCanvasUndo,
  handleCanvasClear,
} from "../src/socket/handlers.js";
import { lobbies, inviteCodeMap } from "../src/state.js";
import { GameState } from "../../shared/gameState.js";

// Mock WebSocket
class MockWebSocket {
  constructor() {
    this.readyState = 1; // OPEN
    this.sentMessages = [];
  }

  send(data) {
    this.sentMessages.push(JSON.parse(data));
  }
}

describe("Game Handlers", () => {
  beforeEach(() => {
    // Clear state before each test
    lobbies.clear();
    inviteCodeMap.clear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("handleJoinLobby", () => {
    it("should assign WebSocket to player and broadcast update", () => {
      // Setup
      const lobby = {
        id: "lobby1",
        inviteCode: "ABC123",
        isPublic: true,
        players: new Map([
          [
            "user1",
            { id: "user1", name: "Player1", ws: null, isHost: true, score: 0 },
          ],
        ]),
        state: GameState.LOBBY,
        roundIndex: 0,
        totalRounds: 9,
        words: [],
        createdAt: Date.now(),
      };
      lobbies.set("lobby1", lobby);

      const ws = new MockWebSocket();
      const context = { currentLobbyId: null, currentUserId: null };
      const msg = { lobbyId: "lobby1", userId: "user1" };

      // Execute
      handleJoinLobby({ ws, msg, context });

      // Assert
      expect(context.currentLobbyId).toBe("lobby1");
      expect(context.currentUserId).toBe("user1");
      expect(lobby.players.get("user1").ws).toBe(ws);
      expect(ws.sentMessages.length).toBe(1);
      expect(ws.sentMessages[0].type).toBe("LOBBY_UPDATE");
    });
  });

  describe("handleStartGame", () => {
    it("should start game if host and enough players", async () => {
      // Setup
      const lobby = {
        id: "lobby1",
        inviteCode: "ABC123",
        isPublic: true,
        players: new Map([
          [
            "user1",
            {
              id: "user1",
              name: "Player1",
              ws: new MockWebSocket(),
              isHost: true,
              score: 0,
            },
          ],
          [
            "user2",
            {
              id: "user2",
              name: "Player2",
              ws: new MockWebSocket(),
              isHost: false,
              score: 0,
            },
          ],
        ]),
        state: GameState.LOBBY,
        roundIndex: 0,
        totalRounds: 3,
        words: [],
        createdAt: Date.now(),
      };
      lobbies.set("lobby1", lobby);

      const context = { currentLobbyId: "lobby1", currentUserId: "user1" };

      // Execute
      await handleStartGame({ context });

      // Assert
      expect(lobby.state).toBe(GameState.ROUND_START);
      expect(lobby.words).toHaveLength(3);
      expect(lobby.game).toBeDefined();
      expect(lobby.game.startTimer).toBeDefined();
    });

    it("should not start if not host", async () => {
      // Setup
      const lobby = {
        id: "lobby1",
        players: new Map([
          [
            "user1",
            {
              id: "user1",
              name: "Player1",
              ws: new MockWebSocket(),
              isHost: true,
              score: 0,
            },
          ],
          [
            "user2",
            {
              id: "user2",
              name: "Player2",
              ws: new MockWebSocket(),
              isHost: false,
              score: 0,
            },
          ],
        ]),
        state: GameState.LOBBY,
        roundIndex: 0,
        totalRounds: 3,
        words: [],
      };
      lobbies.set("lobby1", lobby);

      const context = { currentLobbyId: "lobby1", currentUserId: "user2" };

      // Execute
      await handleStartGame({ context });

      // Assert
      expect(lobby.state).toBe(GameState.LOBBY);
      expect(lobby.words).toHaveLength(0);
    });

    it("should not start with less than 2 players", async () => {
      // Setup
      const lobby = {
        id: "lobby1",
        players: new Map([
          [
            "user1",
            {
              id: "user1",
              name: "Player1",
              ws: new MockWebSocket(),
              isHost: true,
              score: 0,
            },
          ],
        ]),
        state: GameState.LOBBY,
        roundIndex: 0,
        totalRounds: 3,
        words: [],
      };
      lobbies.set("lobby1", lobby);

      const context = { currentLobbyId: "lobby1", currentUserId: "user1" };

      // Execute
      await handleStartGame({ context });

      // Assert
      expect(lobby.state).toBe(GameState.LOBBY);
    });
  });

  describe("handleGuess", () => {
    it("should record correct guess and finish round if confidence >= 0.8", () => {
      // Setup
      const ws1 = new MockWebSocket();
      const ws2 = new MockWebSocket();
      const lobby = {
        id: "lobby1",
        players: new Map([
          [
            "user1",
            { id: "user1", name: "Player1", ws: ws1, isHost: true, score: 0 },
          ],
          [
            "user2",
            { id: "user2", name: "Player2", ws: ws2, isHost: false, score: 0 },
          ],
        ]),
        state: GameState.GAME,
        roundIndex: 0,
        totalRounds: 3,
        words: ["apple", "banana", "cat"],
        game: {
          roundTimer: null,
          startTimer: null,
          endTimer: null,
          guesses: [],
          roundWinner: null,
        },
      };
      lobbies.set("lobby1", lobby);

      const context = { currentLobbyId: "lobby1", currentUserId: "user1" };
      const msg = {
        predictions: [
          { label: "apple", confidence: 0.85 },
          { label: "orange", confidence: 0.1 },
        ],
      };

      // Execute
      handleGuess({ msg, context });

      // Assert
      expect(lobby.game.guesses).toHaveLength(1);
      expect(lobby.game.guesses[0].playerId).toBe("user1");
      expect(lobby.game.guesses[0].confidence).toBe(0.85);
      expect(lobby.state).toBe(GameState.ROUND_END);
      expect(lobby.players.get("user1").score).toBe(1);
      expect(lobby.roundWinner).toBe("Player1");
    });

    it("should not finish round if confidence < 0.8", () => {
      // Setup
      const lobby = {
        id: "lobby1",
        players: new Map([
          [
            "user1",
            {
              id: "user1",
              name: "Player1",
              ws: new MockWebSocket(),
              isHost: true,
              score: 0,
            },
          ],
        ]),
        state: GameState.GAME,
        roundIndex: 0,
        totalRounds: 3,
        words: ["apple", "banana", "cat"],
        game: {
          roundTimer: null,
          startTimer: null,
          endTimer: null,
          guesses: [],
          roundWinner: null,
        },
      };
      lobbies.set("lobby1", lobby);

      const context = { currentLobbyId: "lobby1", currentUserId: "user1" };
      const msg = {
        predictions: [{ label: "apple", confidence: 0.75 }],
      };

      // Execute
      handleGuess({ msg, context });

      // Assert
      expect(lobby.game.guesses).toHaveLength(1);
      expect(lobby.state).toBe(GameState.GAME);
      expect(lobby.players.get("user1").score).toBe(0);
    });

    it("should ignore incorrect guesses", () => {
      // Setup
      const lobby = {
        id: "lobby1",
        players: new Map([
          [
            "user1",
            {
              id: "user1",
              name: "Player1",
              ws: new MockWebSocket(),
              isHost: true,
              score: 0,
            },
          ],
        ]),
        state: GameState.GAME,
        roundIndex: 0,
        totalRounds: 3,
        words: ["apple", "banana", "cat"],
        game: {
          roundTimer: null,
          startTimer: null,
          endTimer: null,
          guesses: [],
          roundWinner: null,
        },
      };
      lobbies.set("lobby1", lobby);

      const context = { currentLobbyId: "lobby1", currentUserId: "user1" };
      const msg = {
        predictions: [{ label: "orange", confidence: 0.95 }],
      };

      // Execute
      handleGuess({ msg, context });

      // Assert
      expect(lobby.game.guesses).toHaveLength(0);
      expect(lobby.state).toBe(GameState.GAME);
    });
  });

  describe("handleCanvasStroke", () => {
    it("should broadcast stroke to all other players", () => {
      // Setup
      const ws1 = new MockWebSocket();
      const ws2 = new MockWebSocket();
      const ws3 = new MockWebSocket();
      const lobby = {
        id: "lobby1",
        players: new Map([
          [
            "user1",
            { id: "user1", name: "P1", ws: ws1, isHost: true, score: 0 },
          ],
          [
            "user2",
            { id: "user2", name: "P2", ws: ws2, isHost: false, score: 0 },
          ],
          [
            "user3",
            { id: "user3", name: "P3", ws: ws3, isHost: false, score: 0 },
          ],
        ]),
      };
      lobbies.set("lobby1", lobby);

      const context = { currentLobbyId: "lobby1", currentUserId: "user1" };
      const msg = {
        playerId: "user1",
        stroke: { points: [{ x: 10, y: 20 }], color: "black", size: 5 },
        isComplete: false,
      };

      // Execute
      handleCanvasStroke({ msg, context });

      // Assert
      expect(ws1.sentMessages).toHaveLength(0); // Sender doesn't receive
      expect(ws2.sentMessages).toHaveLength(1);
      expect(ws3.sentMessages).toHaveLength(1);
      expect(ws2.sentMessages[0].type).toBe("CANVAS_STROKE_UPDATE");
      expect(ws2.sentMessages[0].playerId).toBe("user1");
      expect(ws2.sentMessages[0].isComplete).toBe(false);
    });
  });

  describe("handleCanvasUndo", () => {
    it("should broadcast undo to all other players", () => {
      // Setup
      const ws1 = new MockWebSocket();
      const ws2 = new MockWebSocket();
      const lobby = {
        id: "lobby1",
        players: new Map([
          ["user1", { id: "user1", ws: ws1 }],
          ["user2", { id: "user2", ws: ws2 }],
        ]),
      };
      lobbies.set("lobby1", lobby);

      const context = { currentLobbyId: "lobby1", currentUserId: "user1" };
      const msg = { playerId: "user1" };

      // Execute
      handleCanvasUndo({ msg, context });

      // Assert
      expect(ws1.sentMessages).toHaveLength(0);
      expect(ws2.sentMessages).toHaveLength(1);
      expect(ws2.sentMessages[0].type).toBe("CANVAS_UNDO");
      expect(ws2.sentMessages[0].playerId).toBe("user1");
    });
  });

  describe("handleCanvasClear", () => {
    it("should broadcast clear to all other players", () => {
      // Setup
      const ws1 = new MockWebSocket();
      const ws2 = new MockWebSocket();
      const lobby = {
        id: "lobby1",
        players: new Map([
          ["user1", { id: "user1", ws: ws1 }],
          ["user2", { id: "user2", ws: ws2 }],
        ]),
      };
      lobbies.set("lobby1", lobby);

      const context = { currentLobbyId: "lobby1", currentUserId: "user1" };
      const msg = { playerId: "user1" };

      // Execute
      handleCanvasClear({ msg, context });

      // Assert
      expect(ws1.sentMessages).toHaveLength(0);
      expect(ws2.sentMessages).toHaveLength(1);
      expect(ws2.sentMessages[0].type).toBe("CANVAS_CLEAR");
    });
  });

  describe("handleDisconnect", () => {
    it("should remove player and promote new host", () => {
      // Setup
      const ws1 = new MockWebSocket();
      const ws2 = new MockWebSocket();
      const lobby = {
        id: "lobby1",
        inviteCode: "ABC123",
        players: new Map([
          [
            "user1",
            { id: "user1", name: "P1", ws: ws1, isHost: true, score: 0 },
          ],
          [
            "user2",
            { id: "user2", name: "P2", ws: ws2, isHost: false, score: 0 },
          ],
        ]),
        state: GameState.LOBBY,
      };
      lobbies.set("lobby1", lobby);
      inviteCodeMap.set("ABC123", "lobby1");

      const context = { currentLobbyId: "lobby1", currentUserId: "user1" };

      // Execute
      handleDisconnect(context);

      // Assert
      expect(lobby.players.has("user1")).toBe(false);
      expect(lobby.players.has("user2")).toBe(true);
      expect(lobby.players.get("user2").isHost).toBe(true);
      expect(lobbies.has("lobby1")).toBe(true);
    });

    it("should delete empty lobby", () => {
      // Setup
      const lobby = {
        id: "lobby1",
        inviteCode: "ABC123",
        players: new Map([
          [
            "user1",
            { id: "user1", name: "P1", ws: new MockWebSocket(), isHost: true },
          ],
        ]),
      };
      lobbies.set("lobby1", lobby);
      inviteCodeMap.set("ABC123", "lobby1");

      const context = { currentLobbyId: "lobby1", currentUserId: "user1" };

      // Execute
      handleDisconnect(context);

      // Assert
      expect(lobbies.has("lobby1")).toBe(false);
      expect(inviteCodeMap.has("ABC123")).toBe(false);
    });
  });

  describe("Game State Transitions", () => {
    it("should transition through game states correctly", async () => {
      // Setup
      const ws1 = new MockWebSocket();
      const ws2 = new MockWebSocket();
      const lobby = {
        id: "lobby1",
        players: new Map([
          [
            "user1",
            { id: "user1", name: "P1", ws: ws1, isHost: true, score: 0 },
          ],
          [
            "user2",
            { id: "user2", name: "P2", ws: ws2, isHost: false, score: 0 },
          ],
        ]),
        state: GameState.LOBBY,
        roundIndex: 0,
        totalRounds: 1,
        words: [],
      };
      lobbies.set("lobby1", lobby);

      const context = { currentLobbyId: "lobby1", currentUserId: "user1" };

      // Start game
      await handleStartGame({ context });
      expect(lobby.state).toBe(GameState.ROUND_START);

      // Advance to GAME phase
      vi.advanceTimersByTime(5000);
      expect(lobby.state).toBe(GameState.GAME);

      // Make winning guess
      const msg = {
        predictions: [{ label: lobby.words[0], confidence: 0.9 }],
      };
      handleGuess({ msg, context });
      expect(lobby.state).toBe(GameState.ROUND_END);

      // Advance to GAME_END (since totalRounds = 1)
      vi.advanceTimersByTime(5000);
      expect(lobby.state).toBe(GameState.GAME_END);
      expect(lobby.game).toBeUndefined();
    });
  });
});
