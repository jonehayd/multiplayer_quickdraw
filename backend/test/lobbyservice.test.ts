import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { LobbyService } from "../src/services/lobbyService.js";
import { LobbyRepository } from "../src/repositories/lobbyRepository.js";
import { CategoryService } from "../src/services/categoryService.js";
import {
  Lobby,
  Player,
  GameState,
  Prediction,
  CanvasStrokes,
} from "../src/types/index.js";
import {
  CONFIDENCE_THRESHOLD_CUTOFF,
  RoundLengths,
} from "../src/config/constants.js";

describe("LobbyService", () => {
  let lobbyService: LobbyService;
  let lobbyRepo: LobbyRepository;
  let categoryService: CategoryService;
  let mockLobby: Lobby;
  let mockPlayer: Player;

  beforeEach(() => {
    vi.useFakeTimers();
    lobbyRepo = new LobbyRepository();
    categoryService = CategoryService.getInstance();
    lobbyService = new LobbyService(lobbyRepo, categoryService);

    // Create mock player
    mockPlayer = {
      id: "player-1",
      name: "Test Player",
      isHost: true,
      score: 0,
      ws: null,
    };

    // Create mock lobby
    mockLobby = {
      id: "lobby-1",
      inviteCode: "TEST123",
      isPublic: true,
      totalRounds: 3,
      state: GameState.LOBBY,
      players: new Map([["player-1", mockPlayer]]),
      words: [],
      roundIndex: 0,
      game: null,
      winningCanvases: [],
      createdAt: Date.now(),
    };

    lobbyRepo.createLobby(mockLobby);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("startGame", () => {
    it("should start game successfully with valid conditions", async () => {
      const player2: Player = {
        id: "player-2",
        name: "Player 2",
        isHost: false,
        score: 0,
        ws: null,
      };
      mockLobby.players.set("player-2", player2);

      vi.spyOn(categoryService, "getRandomWords").mockResolvedValue([
        "cat",
        "dog",
        "tree",
      ]);

      await lobbyService.startGame("lobby-1", "player-1");

      expect(mockLobby.state).toBe(GameState.ROUND_START);
      expect(mockLobby.words).toEqual(["cat", "dog", "tree"]);
      expect(mockLobby.roundIndex).toBe(0);
      expect(mockLobby.game).toBeDefined();
    });

    it("should throw error if lobby not found", async () => {
      await expect(
        lobbyService.startGame("non-existent", "player-1"),
      ).rejects.toThrow("Lobby not found");
    });

    it("should throw error if player does not exist", async () => {
      await expect(
        lobbyService.startGame("lobby-1", "non-existent"),
      ).rejects.toThrow("Player does not exist");
    });

    it("should throw error if player is not host", async () => {
      mockPlayer.isHost = false;

      await expect(
        lobbyService.startGame("lobby-1", "player-1"),
      ).rejects.toThrow("Only host can start game");
    });

    it("should throw error if less than 2 players", async () => {
      await expect(
        lobbyService.startGame("lobby-1", "player-1"),
      ).rejects.toThrow("Need at least 2 players");
    });
  });

  describe("handleDisconnect", () => {
    it("should remove player from lobby", () => {
      const player2: Player = {
        id: "player-2",
        name: "Player 2",
        isHost: false,
        score: 0,
        ws: null,
      };
      mockLobby.players.set("player-2", player2);

      lobbyService.handleDisconnect("lobby-1", "player-2");

      expect(mockLobby.players.has("player-2")).toBe(false);
      expect(mockLobby.players.size).toBe(1);
    });

    it("should delete lobby when last player disconnects", () => {
      lobbyService.handleDisconnect("lobby-1", "player-1");

      expect(lobbyRepo.getLobby("lobby-1")).toBeUndefined();
    });

    it("should promote next player to host when host disconnects", () => {
      const player2: Player = {
        id: "player-2",
        name: "Player 2",
        isHost: false,
        score: 0,
        ws: null,
      };
      mockLobby.players.set("player-2", player2);

      lobbyService.handleDisconnect("lobby-1", "player-1");

      expect(player2.isHost).toBe(true);
      expect(mockLobby.players.size).toBe(1);
    });

    it("should throw error if lobby does not exist", () => {
      expect(() =>
        lobbyService.handleDisconnect("non-existent", "player-1"),
      ).toThrow("Cannot delete a lobby that does not exist");
    });
  });

  describe("handleGuess", () => {
    beforeEach(async () => {
      const player2: Player = {
        id: "player-2",
        name: "Player 2",
        isHost: false,
        score: 0,
        ws: null,
      };
      mockLobby.players.set("player-2", player2);

      vi.spyOn(categoryService, "getRandomWords").mockResolvedValue([
        "cat",
        "dog",
        "tree",
      ]);
      await lobbyService.startGame("lobby-1", "player-1");

      // Fast-forward past ROUND_START to GAME state
      vi.advanceTimersByTime(RoundLengths.START_ROUND_LEN);
    });

    it("should accept valid guess during game", () => {
      const predictions: Prediction[] = [
        { label: "cat", confidence: 0.85 },
        { label: "dog", confidence: 0.1 },
      ];

      lobbyService.handleGuess(mockLobby, "player-1", predictions);

      expect(mockLobby.game?.guesses).toHaveLength(1);
      expect(mockLobby.game?.guesses[0]).toEqual({
        playerId: "player-1",
        confidence: 0.85,
      });
    });

    it("should ignore guess if not in GAME state", async () => {
      // Change state back to LOBBY
      mockLobby.state = GameState.LOBBY;
      const predictions: Prediction[] = [{ label: "cat", confidence: 0.85 }];

      lobbyService.handleGuess(mockLobby, "player-1", predictions);

      // When not in GAME state, handleGuess returns early, so guesses array remains as initialized
      expect(mockLobby.game?.guesses).toEqual([]);
    });

    it("should ignore guess if word not in predictions", () => {
      const predictions: Prediction[] = [{ label: "house", confidence: 0.85 }];

      lobbyService.handleGuess(mockLobby, "player-1", predictions);

      expect(mockLobby.game?.guesses).toHaveLength(0);
    });

    it("should trigger instant win if confidence >= threshold", () => {
      const predictions: Prediction[] = [
        { label: "cat", confidence: CONFIDENCE_THRESHOLD_CUTOFF },
      ];

      lobbyService.handleGuess(mockLobby, "player-1", predictions);

      expect(mockLobby.game?.roundFinished).toBe(true);
      expect(mockLobby.game?.roundWinnerId).toBe("player-1");
      expect(mockPlayer.score).toBe(1);
    });

    it("should throw error for invalid confidence value", () => {
      const predictions: Prediction[] = [
        { label: "cat", confidence: NaN as any },
      ];

      expect(() =>
        lobbyService.handleGuess(mockLobby, "player-1", predictions),
      ).toThrow("Invalid confidence value");
    });
  });

  describe("handleWinningCanvas", () => {
    beforeEach(async () => {
      const player2: Player = {
        id: "player-2",
        name: "Player 2",
        isHost: false,
        score: 0,
        ws: null,
      };
      mockLobby.players.set("player-2", player2);

      vi.spyOn(categoryService, "getRandomWords").mockResolvedValue([
        "cat",
        "dog",
        "tree",
      ]);
      await lobbyService.startGame("lobby-1", "player-1");

      // Advance to GAME state
      vi.advanceTimersByTime(RoundLengths.START_ROUND_LEN);

      // Submit instant win guess
      const predictions: Prediction[] = [
        { label: "cat", confidence: CONFIDENCE_THRESHOLD_CUTOFF },
      ];
      lobbyService.handleGuess(mockLobby, "player-1", predictions);
    });

    it("should store winning canvas from round winner", () => {
      const canvasData: CanvasStrokes = [
        {
          tool: "pen",
          color: "black",
          size: 2,
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
          ],
        },
        {
          tool: "pen",
          color: "black",
          size: 2,
          points: [{ x: 20, y: 20 }],
        },
      ];

      lobbyService.handleWinningCanvas(mockLobby, "player-1", canvasData);

      expect(mockLobby.winningCanvases).toHaveLength(1);
      expect(mockLobby.winningCanvases![0]).toEqual({
        playerId: "player-1",
        roundIndex: 0,
        playerName: "Test Player",
        word: "cat",
        canvas: canvasData,
      });
    });

    it("should ignore canvas from non-winner", () => {
      const canvasData: CanvasStrokes = [
        {
          tool: "pen",
          color: "black",
          size: 2,
          points: [{ x: 0, y: 0 }],
        },
      ];

      lobbyService.handleWinningCanvas(mockLobby, "player-2", canvasData);

      // beforeEach already pushed a placeholder via instant-win; non-winner should not add another
      expect(mockLobby.winningCanvases).toHaveLength(1);
      expect(mockLobby.winningCanvases![0].canvas).toBeNull();
    });

    it("should not store duplicate canvas for same round", () => {
      const canvasData: CanvasStrokes = [
        {
          tool: "pen",
          color: "black",
          size: 2,
          points: [{ x: 0, y: 0 }],
        },
      ];

      lobbyService.handleWinningCanvas(mockLobby, "player-1", canvasData);
      lobbyService.handleWinningCanvas(mockLobby, "player-1", canvasData);

      expect(mockLobby.winningCanvases).toHaveLength(1);
    });

    it("should transition to ROUND_END when canvas received", () => {
      const canvasData: CanvasStrokes = [
        {
          tool: "pen",
          color: "black",
          size: 2,
          points: [{ x: 0, y: 0 }],
        },
      ];

      lobbyService.handleWinningCanvas(mockLobby, "player-1", canvasData);

      expect(mockLobby.state).toBe(GameState.ROUND_END);
    });
  });

  describe("game flow", () => {
    it("should transition through all game states", async () => {
      // Set totalRounds to 1 for this test
      mockLobby.totalRounds = 1;

      const player2: Player = {
        id: "player-2",
        name: "Player 2",
        isHost: false,
        score: 0,
        ws: null,
      };
      mockLobby.players.set("player-2", player2);

      vi.spyOn(categoryService, "getRandomWords").mockResolvedValue(["cat"]);

      await lobbyService.startGame("lobby-1", "player-1");
      expect(mockLobby.state).toBe(GameState.ROUND_START);

      // Move to GAME phase
      vi.advanceTimersByTime(RoundLengths.START_ROUND_LEN);
      expect(mockLobby.state).toBe(GameState.GAME);

      // Submit winning guess
      const predictions: Prediction[] = [
        { label: "cat", confidence: CONFIDENCE_THRESHOLD_CUTOFF },
      ];
      lobbyService.handleGuess(mockLobby, "player-1", predictions);

      // Submit canvas
      const canvasData: CanvasStrokes = [
        {
          tool: "pen",
          color: "black",
          size: 2,
          points: [{ x: 0, y: 0 }],
        },
      ];
      lobbyService.handleWinningCanvas(mockLobby, "player-1", canvasData);
      expect(mockLobby.state).toBe(GameState.ROUND_END);

      // Move to GAME_END (only 1 round)
      vi.advanceTimersByTime(RoundLengths.END_ROUND_LEN);
      expect(mockLobby.state).toBe(GameState.GAME_END);
      expect(mockLobby.game).toBeNull();
    });

    it("should handle multiple rounds", async () => {
      mockLobby.totalRounds = 2;
      const player2: Player = {
        id: "player-2",
        name: "Player 2",
        isHost: false,
        score: 0,
        ws: null,
      };
      mockLobby.players.set("player-2", player2);

      vi.spyOn(categoryService, "getRandomWords").mockResolvedValue([
        "cat",
        "dog",
      ]);

      await lobbyService.startGame("lobby-1", "player-1");
      vi.advanceTimersByTime(RoundLengths.START_ROUND_LEN); // ROUND_START -> GAME

      // Round 1
      const predictions1: Prediction[] = [
        { label: "cat", confidence: CONFIDENCE_THRESHOLD_CUTOFF },
      ];
      lobbyService.handleGuess(mockLobby, "player-1", predictions1);
      lobbyService.handleWinningCanvas(mockLobby, "player-1", []);

      expect(mockLobby.roundIndex).toBe(0);
      vi.advanceTimersByTime(RoundLengths.END_ROUND_LEN); // ROUND_END -> ROUND_START

      expect(mockLobby.roundIndex).toBe(1);
      expect(mockLobby.state).toBe(GameState.ROUND_START);

      vi.advanceTimersByTime(RoundLengths.START_ROUND_LEN); // ROUND_START -> GAME

      // Round 2
      const predictions2: Prediction[] = [
        { label: "dog", confidence: CONFIDENCE_THRESHOLD_CUTOFF },
      ];
      lobbyService.handleGuess(mockLobby, "player-2", predictions2);
      lobbyService.handleWinningCanvas(mockLobby, "player-2", []);

      vi.advanceTimersByTime(RoundLengths.END_ROUND_LEN); // ROUND_END -> GAME_END

      expect(mockLobby.state).toBe(GameState.GAME_END);
      expect(mockPlayer.score).toBe(1);
      expect(mockLobby.players.get("player-2")!.score).toBe(1);
    });
  });
});
