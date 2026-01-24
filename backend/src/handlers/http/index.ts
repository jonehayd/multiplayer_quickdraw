import express from "express";
import { createLobby, joinLobby, joinRandomLobby } from "./lobbyRoutes.js";

const lobbyRoutes = express.Router();
lobbyRoutes.post("/create", createLobby);
lobbyRoutes.post("/join", joinLobby);
lobbyRoutes.post("/join-random", joinRandomLobby);

export default lobbyRoutes;
