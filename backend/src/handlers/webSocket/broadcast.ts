import { Lobby, LobbyUpdateMessage } from "../../types/index.js";
import { serializeLobby } from "../../utils/serializeLobby.js";

export function broadcastLobbyUpdate(lobby: Lobby) {
  const msg: LobbyUpdateMessage = {
    type: "LOBBY_UPDATE",
    lobby: serializeLobby(lobby),
  };
  const payload = JSON.stringify(msg);

  lobby.players.forEach((p) => {
    if (p.ws?.readyState === 1) {
      p.ws.send(payload);
    }
  });
}
