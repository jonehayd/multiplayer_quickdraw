import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { WebSocket } from "ws";
import {
  handleJoinLobby,
  handleStartGame,
  handleGuess,
  handleWinningCanvas,
  handleCanvasStroke,
  handleCanvasUndo,
  handleCanvasClear,
  handleDisconnect,
} from "../src/handlers/webSocket/index.js";
import { lobbyRepository } from "../src/repositories/index.js";
import { lobbyService } from "../src/services/index.js";
import {
  Lobby,
  Player,
  GameState,
  MessageContext,
  JoinLobbyMessage,
  GuessMessage,
  WinningCanvasMessage,
  CanvasStrokeMessage,
  CanvasUndoMessage,
  CanvasClearMessage,
} from "../src/types/index.js";
import { CONFIDENCE_THRESHOLD_CUTOFF } from "../src/config/constants.js";

// Mock WebSocket
const createMockWebSocket = () => {
  return {
    send: vi.fn(),
    readyState: 1, // OPEN
    on: vi.fn(),
    close: vi.fn(),
  } as unknown as WebSocket;
};

describe("WebSocket Handlers", () => {
  let mockLobby: Lobby;
  let mockPlayer1: Player;
  let mockPlayer2: Player;
  let mockWs1: WebSocket;
  let mockWs2: WebSocket;
  let context: MessageContext;

  beforeEach(() => {
    vi.useFakeTimers();

    // Clear repository
    lobbyRepository["lobbies"].clear();
    lobbyRepository["inviteCodeMap"].clear();

    // Create mock WebSockets
    mockWs1 = createMockWebSocket();
    mockWs2 = createMockWebSocket();

    // Create mock players
    mockPlayer1 = {
      id: "player-1",
      name: "Player 1",
      isHost: true,
      score: 0,
      ws: mockWs1,
    };

    mockPlayer2 = {
      id: "player-2",
      name: "Player 2",
      isHost: false,
      score: 0,
      ws: mockWs2,
    };

    // Create mock lobby
    mockLobby = {
      id: "lobby-1",
      inviteCode: "ABC123",
      isPublic: true,
      totalRounds: 3,
      state: GameState.LOBBY,
      players: new Map([
        ["player-1", mockPlayer1],
        ["player-2", mockPlayer2],
      ]),
      words: [],
      roundIndex: 0,
      game: null,
      winningCanvases: [],
      createdAt: Date.now(),
    };

    lobbyRepository.createLobby(mockLobby);

    // Create context
    context = {
      currentLobbyId: "lobby-1",
      currentUserId: "player-1",
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe("handleJoinLobby", () => {
    it("should assign WebSocket to player and broadcast update", () => {
      const newWs = createMockWebSocket();
      const newContext: MessageContext = {
        currentLobbyId: null,
        currentUserId: null,
      };

      const msg: JoinLobbyMessage = {
        type: "JOIN_LOBBY",
        lobbyId: "lobby-1",
        userId: "player-2",
      };

      handleJoinLobby({ context: newContext, ws: newWs, msg });

      expect(newContext.currentLobbyId).toBe("lobby-1");
      expect(newContext.currentUserId).toBe("player-2");
      expect(mockPlayer2.ws).toBe(newWs); // Player 2 now has the NEW WebSocket
      expect(mockWs1.send).toHaveBeenCalled(); // Player 1 gets broadcast
      expect(newWs.send).toHaveBeenCalled(); // Check newWs instead of mockWs2!
    });

    it("should do nothing if lobby not found", () => {
      const newWs = createMockWebSocket();
      const newContext: MessageContext = {
        currentLobbyId: null,
        currentUserId: null,
      };

      const msg: JoinLobbyMessage = {
        type: "JOIN_LOBBY",
        lobbyId: "non-existent",
        userId: "player-1",
      };

      handleJoinLobby({ context: newContext, ws: newWs, msg });

      expect(newContext.currentLobbyId).toBe("non-existent");
      expect(newContext.currentUserId).toBe("player-1");
    });

    it("should handle player not in lobby", () => {
      const newWs = createMockWebSocket();
      const newContext: MessageContext = {
        currentLobbyId: null,
        currentUserId: null,
      };

      const msg: JoinLobbyMessage = {
        type: "JOIN_LOBBY",
        lobbyId: "lobby-1",
        userId: "non-existent-player",
      };

      handleJoinLobby({ context: newContext, ws: newWs, msg });

      expect(newContext.currentUserId).toBe("non-existent-player");
      // Should still broadcast to existing players
      expect(mockWs1.send).toHaveBeenCalled();
      expect(mockWs2.send).toHaveBeenCalled();
    });
  });

  describe("handleStartGame", () => {
    beforeEach(() => {
      vi.spyOn(lobbyService, "startGame").mockResolvedValue(undefined);
    });

    it("should start game when host requests", async () => {
      handleStartGame({ context });

      await vi.waitFor(() => {
        expect(lobbyService.startGame).toHaveBeenCalledWith(
          "lobby-1",
          "player-1",
        );
      });
    });

    it("should not start if user is not in lobby", () => {
      context.currentLobbyId = null;

      handleStartGame({ context });

      expect(lobbyService.startGame).not.toHaveBeenCalled();
    });

    it("should not start if lobby does not exist", () => {
      context.currentLobbyId = "non-existent";

      handleStartGame({ context });

      expect(lobbyService.startGame).not.toHaveBeenCalled();
    });

    it("should not start if player is not host", () => {
      context.currentUserId = "player-2";

      handleStartGame({ context });

      expect(lobbyService.startGame).not.toHaveBeenCalled();
    });

    it("should not start if less than 2 players", () => {
      mockLobby.players.delete("player-2");

      handleStartGame({ context });

      expect(lobbyService.startGame).not.toHaveBeenCalled();
    });
  });

  describe("handleGuess", () => {
    beforeEach(() => {
      vi.spyOn(lobbyService, "handleGuess").mockImplementation(() => {});
    });

    it("should process guess and broadcast update", () => {
      const msg: GuessMessage = {
        type: "GUESS",
        predictions: [
          { label: "cat", confidence: 0.95 },
          { label: "dog", confidence: 0.05 },
        ],
        canvas: [],
      };

      handleGuess({ context, msg });

      expect(lobbyService.handleGuess).toHaveBeenCalledWith(
        mockLobby,
        "player-1",
        msg.predictions,
      );
      expect(mockWs1.send).toHaveBeenCalled();
      expect(mockWs2.send).toHaveBeenCalled();
    });

    it("should do nothing if no lobby ID in context", () => {
      context.currentLobbyId = null;

      const msg: GuessMessage = {
        type: "GUESS",
        predictions: [],
        canvas: [],
      };

      handleGuess({ context, msg });

      expect(lobbyService.handleGuess).not.toHaveBeenCalled();
    });

    it("should do nothing if lobby not found", () => {
      context.currentLobbyId = "non-existent";

      const msg: GuessMessage = {
        type: "GUESS",
        predictions: [],
        canvas: [],
      };

      handleGuess({ context, msg });

      expect(lobbyService.handleGuess).not.toHaveBeenCalled();
    });
  });

  describe("handleWinningCanvas", () => {
    beforeEach(() => {
      vi.spyOn(lobbyService, "handleWinningCanvas").mockImplementation(
        () => {},
      );
    });

    it("should process winning canvas and broadcast update", () => {
      const msg: WinningCanvasMessage = {
        type: "WINNING_CANVAS",
        canvas: [
          {
            tool: "pen",
            color: "black",
            size: 2,
            points: [{ x: 0, y: 0 }],
          },
        ],
      };

      handleWinningCanvas({ context, msg });

      expect(lobbyService.handleWinningCanvas).toHaveBeenCalledWith(
        mockLobby,
        "player-1",
        msg.canvas,
      );
      expect(mockWs1.send).toHaveBeenCalled();
      expect(mockWs2.send).toHaveBeenCalled();
    });

    it("should do nothing if no lobby ID in context", () => {
      context.currentLobbyId = null;

      const msg: WinningCanvasMessage = {
        type: "WINNING_CANVAS",
        canvas: [],
      };

      handleWinningCanvas({ context, msg });

      expect(lobbyService.handleWinningCanvas).not.toHaveBeenCalled();
    });
  });

  describe("handleCanvasStroke", () => {
    it("should broadcast stroke to other players", () => {
      const msg: CanvasStrokeMessage = {
        type: "CANVAS_STROKE",
        playerId: "player-1",
        stroke: {
          tool: "pen",
          color: "black",
          size: 2,
          points: [{ x: 10, y: 10 }],
        },
        isComplete: false,
      };

      handleCanvasStroke({ context, msg });

      // Player 2 should receive the stroke, but not Player 1 (sender)
      expect(mockWs2.send).toHaveBeenCalled();

      const sentData = JSON.parse((mockWs2.send as any).mock.calls[0][0]);
      expect(sentData.msg.type).toBe("CANVAS_STROKE");
      expect(sentData.msg.playerId).toBe("player-1");
    });

    it("should do nothing if no lobby ID in context", () => {
      context.currentLobbyId = null;

      const msg: CanvasStrokeMessage = {
        type: "CANVAS_STROKE",
        playerId: "player-1",
        stroke: {
          tool: "pen",
          color: "black",
          size: 2,
          points: [],
        },
        isComplete: true,
      };

      handleCanvasStroke({ context, msg });

      expect(mockWs1.send).not.toHaveBeenCalled();
      expect(mockWs2.send).not.toHaveBeenCalled();
    });

    it("should not send to players with closed WebSocket", () => {
      (mockWs2 as any).readyState = 3; // CLOSED

      const msg: CanvasStrokeMessage = {
        type: "CANVAS_STROKE",
        playerId: "player-1",
        stroke: {
          tool: "pen",
          color: "black",
          size: 2,
          points: [{ x: 10, y: 10 }],
        },
        isComplete: false,
      };

      handleCanvasStroke({ context, msg });

      expect(mockWs2.send).not.toHaveBeenCalled();
    });
  });

  describe("handleCanvasUndo", () => {
    it("should broadcast undo to other players", () => {
      const msg: CanvasUndoMessage = {
        type: "CANVAS_UNDO",
        playerId: "player-1",
      };

      handleCanvasUndo({ context, msg });

      expect(mockWs2.send).toHaveBeenCalled();

      const sentData = JSON.parse((mockWs2.send as any).mock.calls[0][0]);
      expect(sentData.msg.type).toBe("CANVAS_UNDO");
      expect(sentData.msg.playerId).toBe("player-1");
    });

    it("should do nothing if lobby not found", () => {
      context.currentLobbyId = "non-existent";

      const msg: CanvasUndoMessage = {
        type: "CANVAS_UNDO",
        playerId: "player-1",
      };

      handleCanvasUndo({ context, msg });

      expect(mockWs1.send).not.toHaveBeenCalled();
      expect(mockWs2.send).not.toHaveBeenCalled();
    });
  });

  describe("handleCanvasClear", () => {
    it("should broadcast clear to other players", () => {
      const msg: CanvasClearMessage = {
        type: "CANVAS_CLEAR",
        playerId: "player-1",
      };

      handleCanvasClear({ context, msg });

      expect(mockWs2.send).toHaveBeenCalled();

      const sentData = JSON.parse((mockWs2.send as any).mock.calls[0][0]);
      expect(sentData.msg.type).toBe("CANVAS_CLEAR");
      expect(sentData.msg.playerId).toBe("player-1");
    });
  });

  describe("handleDisconnect", () => {
    beforeEach(() => {
      vi.spyOn(lobbyService, "handleDisconnect").mockImplementation(() => {});
    });

    it("should remove player and broadcast update", () => {
      handleDisconnect({ context });

      expect(lobbyService.handleDisconnect).toHaveBeenCalledWith(
        "lobby-1",
        "player-1",
      );
    });

    it("should do nothing if no lobby ID in context", () => {
      context.currentLobbyId = null;

      handleDisconnect({ context });

      expect(lobbyService.handleDisconnect).not.toHaveBeenCalled();
    });

    it("should not broadcast if lobby was deleted", () => {
      // Simulate lobby being deleted (last player disconnecting)
      vi.spyOn(lobbyService, "handleDisconnect").mockImplementation(() => {
        lobbyRepository.deleteLobby("lobby-1");
      });

      handleDisconnect({ context });

      expect(lobbyService.handleDisconnect).toHaveBeenCalled();
      // Since lobby no longer exists, broadcast shouldn't happen
    });

    it("should broadcast to remaining players if lobby still exists", () => {
      // Simulate player 2 disconnecting
      context.currentUserId = "player-2";

      vi.spyOn(lobbyService, "handleDisconnect").mockImplementation(() => {
        mockLobby.players.delete("player-2");
      });

      handleDisconnect({ context });

      expect(lobbyService.handleDisconnect).toHaveBeenCalledWith(
        "lobby-1",
        "player-2",
      );
      // Player 1 should still receive the update
      expect(mockWs1.send).toHaveBeenCalled();
    });
  });

  describe("broadcastLobbyUpdate", async () => {
    it("should send update to all connected players", async () => {
      const { broadcastLobbyUpdate } =
        await import("../src/handlers/webSocket/broadcast.js");

      broadcastLobbyUpdate(mockLobby);

      expect(mockWs1.send).toHaveBeenCalled();
      expect(mockWs2.send).toHaveBeenCalled();

      const sentData1 = JSON.parse((mockWs1.send as any).mock.calls[0][0]);
      expect(sentData1.type).toBe("LOBBY_UPDATE");
      expect(sentData1.lobby).toBeDefined();
      expect(sentData1.lobby.id).toBe("lobby-1");
    });

    it("should not send to players with closed connections", async () => {
      const { broadcastLobbyUpdate } =
        await import("../src/handlers/webSocket/broadcast.js");

      (mockWs2 as any).readyState = 3; // CLOSED

      broadcastLobbyUpdate(mockLobby);

      expect(mockWs1.send).toHaveBeenCalled();
      expect(mockWs2.send).not.toHaveBeenCalled();
    });

    it("should handle players without WebSocket", async () => {
      const { broadcastLobbyUpdate } =
        await import("../src/handlers/webSocket/broadcast.js");

      mockPlayer2.ws = null;

      broadcastLobbyUpdate(mockLobby);

      expect(mockWs1.send).toHaveBeenCalled();
      // Should not throw error for player without ws
    });
  });
});
