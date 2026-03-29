import "dotenv/config";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import lobbyRoutes from "./handlers/http/index.js";
import { setupWebSockets } from "./webSocket/setUpWebSocket.js";

const PORT = Number(process.env.PORT) || 3000;
const CLIENT_ORIGIN = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173"
).replace(/\/$/, "");

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.use("/api/lobby", lobbyRoutes);

const server = http.createServer(app);

const wss = new WebSocketServer({ server });
setupWebSockets(wss);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
