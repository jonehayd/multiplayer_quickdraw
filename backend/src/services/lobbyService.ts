import {
  Lobby,
  Player,
  Game,
  GameState,
  Guess,
  CanvasStrokes,
  Prediction,
} from "../types/index.js";
import {
  RoundLengths,
  CONFIDENCE_THRESHOLD_CUTOFF,
  MAX_LOBBY_CAPACITY,
} from "../config/constants.js";
import { LobbyRepository } from "../repositories/index.js";
import { CategoryService } from "./index.js";
import { lobbyEvents, LobbyEvent } from "../events/lobbyEvents.js";

export class LobbyService {
  constructor(
    private lobbyRepo: LobbyRepository,
    private categoryService: CategoryService,
  ) {}

  async startGame(lobbyId: string, userId: string): Promise<void> {
    const lobby = this.lobbyRepo.getLobby(lobbyId);
    if (!lobby) throw new Error("Lobby not found");

    const player = lobby.players.get(userId);
    if (!player) throw new Error("Player does not exist");
    if (!player?.isHost) throw new Error("Only host can start game");
    if (lobby.players.size < 2) throw new Error("Need at least 2 players");

    // Initialize words and game state
    lobby.words = await this.categoryService.getRandomWords(lobby.totalRounds);
    lobby.roundIndex = 0;
    lobby.game = this.initializeGame();

    console.log(`Starting game in lobby: ${lobbyId}`);
    this.transitionState(lobby, GameState.ROUND_START);

    lobbyEvents.emitLobbyUpdate(lobby, LobbyEvent.GAME_UPDATED);
  }

  handleDisconnect(lobbyId: string, userId: string): void {
    const lobby = this.lobbyRepo.getLobby(lobbyId);
    if (!lobby) throw new Error("Cannot delete a lobby that does not exist");

    const players = lobby.players;
    const leavingPlayer = players.get(userId);
    const wasHost = leavingPlayer?.isHost;

    console.log(`Disconnecting player with id ${userId}`);

    this.removePlayer(lobbyId, userId);

    lobbyEvents.emitLobbyUpdate(lobby, LobbyEvent.PLAYER_LEFT);
  }

  handleGuess(lobby: Lobby, userId: string, predictions: Prediction[]): void {
    if (lobby.state !== GameState.GAME) return;
    const game = this.requireGame(lobby);
    if (game.roundFinished) throw new Error("Cannot submit guess - round over");

    const word = lobby.words[lobby.roundIndex];
    const correctPrediction = predictions.find((p) => p.label === word);

    if (!correctPrediction) return;

    const confidence = Number(correctPrediction.confidence);
    if (Number.isNaN(confidence)) throw new Error("Invalid confidence value");

    // Double-check round not finished (race condition)
    if (game.roundFinished) throw new Error("Cannot submit guess - round over");

    game.guesses.push({
      playerId: userId,
      confidence,
    });

    // Instant win if confidence threshold met
    if (confidence >= CONFIDENCE_THRESHOLD_CUTOFF) {
      this.finishRound(lobby, userId, {
        playerId: userId,
        confidence,
      });
    }

    lobbyEvents.emitLobbyUpdate(lobby, LobbyEvent.GAME_UPDATED);
  }

  handleWinningCanvas(
    lobby: Lobby,
    userId: string,
    canvasData: CanvasStrokes,
  ): void {
    const game = this.requireGame(lobby);
    if (lobby.state !== GameState.GAME && lobby.state !== GameState.ROUND_END)
      return;

    // Check if already received for this round
    if (lobby.winningCanvasAlreadyReceived) return;

    if (game.roundWinnerId !== userId) return;

    // Store winning canvas
    if (!lobby.winningCanvases) lobby.winningCanvases = [];
    const index = lobby.winningCanvases.findIndex(
      (c) => c.roundIndex === lobby.roundIndex,
    );

    if (index !== -1) {
      lobby.winningCanvases[index] = {
        playerId: userId,
        roundIndex: lobby.roundIndex,
        playerName: game.roundWinner,
        word: lobby.words[lobby.roundIndex]!,
        canvas: canvasData,
      };
    }

    lobby.winningCanvasAlreadyReceived = true;

    // Cancel wait timer and transition
    if (game.canvasWaitTimer) {
      clearTimeout(game.canvasWaitTimer);
      game.canvasWaitTimer = null;
    }

    if (lobby.state === GameState.GAME) {
      this.transitionState(lobby, GameState.ROUND_END);
    }

    lobbyEvents.emitLobbyUpdate(lobby, LobbyEvent.GAME_UPDATED);
  }

  isLobbyFull(lobbyId: string): boolean {
    const lobby = this.lobbyRepo.getLobby(lobbyId);
    if (!lobby) throw new Error("Lobby not found");
    return lobby.players.size >= MAX_LOBBY_CAPACITY;
  }

  addPlayer(lobbyId: string, player: Player): void {
    const lobby = this.lobbyRepo.getLobby(lobbyId);
    if (!lobby) throw new Error("Lobby not found");
    if (lobby.players.size >= MAX_LOBBY_CAPACITY) {
      throw new Error("Lobby is full");
    }
    lobby.players.set(player.id, player);
  }

  removePlayer(lobbyId: string, userId: string): void {
    const lobby = this.lobbyRepo.getLobby(lobbyId);
    if (!lobby) throw new Error("Lobby not found");

    const player = lobby.players.get(userId);
    if (!player) throw new Error("Player not found in lobby");

    const wasHost = player.isHost;

    lobby.players.delete(userId);

    if (lobby.players.size === 0) {
      console.log(`Deleting empty lobby: ${lobbyId}`);
      this.lobbyRepo.deleteLobby(lobbyId);
      return;
    }

    // Promote the next player to host if the host left
    if (wasHost) {
      const nextPlayer = lobby.players.values().next().value as Player;
      if (nextPlayer) {
        nextPlayer.isHost = true;
      }
    }
  }

  private finishRound(
    lobby: Lobby,
    instantWinnerId?: string,
    instantWinningGuess?: Guess,
  ): void {
    if (lobby.state !== GameState.GAME) return;
    const game = this.requireGame(lobby);
    if (game.roundFinished) {
      return;
    }

    game.roundFinished = true;
    this.clearTimers(lobby);

    let winnerId = instantWinnerId;
    let winningGuess = instantWinningGuess;

    // Find highest confidence if no instant winner
    if (!winnerId && game.guesses.length > 0) {
      game.guesses.sort((a, b) => b.confidence - a.confidence);
      winnerId = game.guesses[0]!.playerId;
      winningGuess = game.guesses[0];
    }

    if (winnerId) {
      const player = lobby.players.get(winnerId);
      if (!player) return;

      player.score += 1;
      game.roundWinner = player.name;
      game.roundWinnerId = winnerId;
      game.winningGuess = winningGuess || null;
    }

    if (!lobby.winningCanvases) lobby.winningCanvases = [];

    lobby.winningCanvases.push({
      playerId: game.roundWinnerId ?? null,
      roundIndex: lobby.roundIndex,
      playerName: game.roundWinner ?? null,
      word: lobby.words[lobby.roundIndex],
      canvas: null, // placeholder
    });

    lobby.winningCanvasAlreadyReceived = false;

    // Immediately broadcast lobby to have time to send winning canvas
    lobbyEvents.emitLobbyUpdate(lobby, LobbyEvent.GAME_UPDATED);

    // Set timeout for winner to send canvas
    game.canvasWaitTimer = setTimeout(() => {
      if (lobby.state === GameState.GAME) {
        this.transitionState(lobby, GameState.ROUND_END);
      }
    }, 1000);
  }

  private transitionState(lobby: Lobby, nextState: GameState): void {
    lobby.state = nextState;
    const game = this.requireGame(lobby);

    const now = Date.now();

    switch (nextState) {
      case GameState.ROUND_START:
        game.phaseStartedAt = now;
        game.phaseDuration = RoundLengths.START_ROUND_LEN;
        this.startRoundStart(lobby);
        break;

      case GameState.GAME:
        game.phaseStartedAt = now;
        game.phaseDuration = RoundLengths.ROUND_LEN;
        this.startGamePhase(lobby);
        break;

      case GameState.ROUND_END:
        game.phaseStartedAt = now;
        game.phaseDuration = RoundLengths.END_ROUND_LEN;
        this.startRoundEnd(lobby);
        break;

      case GameState.GAME_END:
        this.endGame(lobby);
        break;
    }

    lobbyEvents.emitLobbyUpdate(lobby, LobbyEvent.STATE_CHANGED);
  }

  private startRoundStart(lobby: Lobby): void {
    this.clearTimers(lobby);
    const game = this.requireGame(lobby);

    lobby.winningCanvasAlreadyReceived = false;
    game.roundWinner = null;
    game.winningGuess = null;

    game.startTimer = setTimeout(() => {
      this.transitionState(lobby, GameState.GAME);
    }, RoundLengths.START_ROUND_LEN);
  }

  private startGamePhase(lobby: Lobby): void {
    this.clearTimers(lobby);
    const game = this.requireGame(lobby);

    game.guesses = [];
    game.roundWinner = null;
    game.roundWinnerId = null;
    game.roundFinished = false;
    game.canvasWaitTimer = null;

    game.roundTimer = setTimeout(() => {
      this.finishRound(lobby);
    }, RoundLengths.ROUND_LEN);
  }

  private startRoundEnd(lobby: Lobby): void {
    this.clearTimers(lobby);
    const game = this.requireGame(lobby);

    game.endTimer = setTimeout(() => {
      if (lobby.roundIndex + 1 < lobby.totalRounds) {
        lobby.roundIndex++;
        this.transitionState(lobby, GameState.ROUND_START);
      } else {
        lobby.roundIndex++;
        this.transitionState(lobby, GameState.GAME_END);
      }
    }, RoundLengths.END_ROUND_LEN);
  }

  private endGame(lobby: Lobby): void {
    this.clearTimers(lobby);
    lobby.game = null;
    console.log(`Ended game for lobby: ${lobby.id}`);
  }

  private initializeGame(): Game {
    return {
      roundFinished: false,
      canvasWaitTimer: null,
      roundTimer: null,
      startTimer: null,
      endTimer: null,
      guesses: [],
      roundWinner: null,
      roundWinnerId: null,
      winningGuess: null,
      phaseStartedAt: null,
      phaseDuration: null,
    };
  }

  private clearTimers(lobby: Lobby): void {
    const game = this.requireGame(lobby);

    if (game.startTimer) {
      clearTimeout(game.startTimer);
      game.startTimer = null;
    }

    if (game.roundTimer) {
      clearTimeout(game.roundTimer);
      game.roundTimer = null;
    }

    if (game.endTimer) {
      clearTimeout(game.endTimer);
      game.endTimer = null;
    }

    if (game.canvasWaitTimer) {
      clearTimeout(game.canvasWaitTimer);
      game.canvasWaitTimer = null;
    }
  }

  private requireGame(lobby: Lobby): Game {
    if (!lobby.game) {
      throw new Error("Game not initialized");
    }
    return lobby.game;
  }
}
