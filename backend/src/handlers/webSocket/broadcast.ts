import { Lobby, LobbyUpdateMessage } from "../../types/index.js";
import { serializeLobby } from "../../utils/serializeLobby.js";
let i = 0;
export function broadcastLobbyUpdate(lobby: Lobby) {
  const msg: LobbyUpdateMessage = {
    type: "LOBBY_UPDATE",
    lobby: serializeLobby(lobby),
  };
  console.log(`[${i++}] Broadcasting lobby update for lobby ${lobby.id}`);
  const payload = JSON.stringify(msg);

  lobby.players.forEach((p) => {
    if (p.ws?.readyState === 1) {
      p.ws.send(payload);
    }
  });
}
