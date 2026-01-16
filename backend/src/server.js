import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import lobbyRoutes from "./routes/lobby.js";
import { setupWebSockets } from "./socket/index.js";

const app = express();
app.use(express.json());

app.use("/api/lobby", lobbyRoutes);

const server = http.createServer(app);

const wss = new WebSocketServer({ server });
setupWebSockets(wss);

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
