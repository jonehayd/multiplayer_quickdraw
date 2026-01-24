// src/events/lobbyEvents.ts
import { EventEmitter } from "events";
import { Lobby } from "../types/index.js";

export enum LobbyEvent {
  STATE_CHANGED = "state_changed",
  PLAYER_JOINED = "player_joined",
  PLAYER_LEFT = "player_left",
  GAME_UPDATED = "game_updated",
}

class LobbyEventEmitter extends EventEmitter {
  emitLobbyUpdate(lobby: Lobby, event: LobbyEvent) {
    this.emit(LobbyEvent.STATE_CHANGED, lobby, event);
  }
}

export const lobbyEvents = new LobbyEventEmitter();
