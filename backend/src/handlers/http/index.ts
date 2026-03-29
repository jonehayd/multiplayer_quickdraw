import express from "express";
import {
  createLobby,
  joinLobby,
  joinRandomLobby,
  reconnectLobby,
} from "./lobbyRoutes.js";

const lobbyRoutes = express.Router();
lobbyRoutes.post("/create", createLobby);
lobbyRoutes.post("/join", joinLobby);
lobbyRoutes.post("/join-random", joinRandomLobby);
lobbyRoutes.post("/reconnect", reconnectLobby);

export default lobbyRoutes;
