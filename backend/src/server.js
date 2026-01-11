import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import lobbyRoutes from "./routes/lobby.js";
import { lobbies } from "./state.js";
import { broadcastLobbyUpdate } from "./routes/lobby.js";

const app = express();
app.use(express.json());

app.use("/api/lobby", lobbyRoutes);

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  // Store which lobby/user this socket belongs to
  let currentLobbyId = null;
  let currentUserId = null;

  ws.on("message", (data) => {
    const msg = JSON.parse(data);

    if (msg.type === "JOIN_LOBBY_SOCKET") {
      const { lobbyId, userId } = msg;
      currentLobbyId = lobbyId;
      currentUserId = userId;

      const lobby = lobbies.get(lobbyId);
      if (!lobby) return;

      // Store the socket on the player
      const player = lobby.players.get(userId);
      if (player) player.ws = ws;

      // Broadcast updated lobby to everyone
      broadcastLobbyUpdate(lobby);
    }

    if (msg.type === "START_GAME") {
      if (!currentLobbyId || !currentUserId) return;

      const lobby = lobbies.get(currentLobbyId);
      if (!lobby) return;

      const player = lobby.players.get(currentUserId);
      if (!player || !player.isHost) {
        console.log("Non-host tried to start game");
        return;
      }

      if (lobby.players.size < 2) return;

      // Transition lobby state
      lobby.state = "in-game";

      // Notify everyone
      broadcastLobbyUpdate(lobby);
    }
  });

  ws.on("close", () => {
    if (!currentLobbyId || !currentUserId) return;

    const lobby = lobbies.get(currentLobbyId);
    if (!lobby) return;

    const players = lobby.players;
    const leavingPlayer = players.get(currentUserId);

    const wasHost = leavingPlayer?.isHost;

    players.delete(currentUserId);

    // Destroy empty lobby
    if (players.size === 0) {
      lobbies.delete(currentLobbyId);
      return;
    }

    // Promote next player
    if (wasHost) {
      const nextPlayer = players.values().next().value;
      if (nextPlayer) nextPlayer.isHost = true;
    }

    broadcastLobbyUpdate(lobby);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
