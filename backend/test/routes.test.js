import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import lobbyRoutes from "../src/routes/lobby.js";
import { lobbies, inviteCodeMap } from "../src/state.js";

const app = express();
app.use(express.json());
app.use("/api/lobby", lobbyRoutes);

describe("Lobby Routes", () => {
  beforeEach(() => {
    lobbies.clear();
    inviteCodeMap.clear();
  });

  describe("POST /api/lobby/create", () => {
    it("should create a new lobby", async () => {
      const response = await request(app)
        .post("/api/lobby/create")
        .send({ displayName: "TestPlayer", isPublic: true, totalRounds: 9 });

      expect(response.status).toBe(200);
      expect(response.body.lobby).toBeDefined();
      expect(response.body.lobby.players).toHaveLength(1);
      expect(response.body.lobby.players[0].name).toBe("TestPlayer");
      expect(response.body.lobby.players[0].isHost).toBe(true);
      expect(response.body.userId).toBeDefined();
      expect(lobbies.size).toBe(1);
    });

    it("should return 400 if displayName is missing", async () => {
      const response = await request(app)
        .post("/api/lobby/create")
        .send({ isPublic: true });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Display name required");
    });
  });

  describe("POST /api/lobby/join", () => {
    it("should join existing lobby with invite code", async () => {
      // Create a lobby first
      const createRes = await request(app)
        .post("/api/lobby/create")
        .send({ displayName: "Host", isPublic: true });

      const inviteCode = createRes.body.lobby.inviteCode;

      // Join the lobby
      const joinRes = await request(app)
        .post("/api/lobby/join")
        .send({ displayName: "Guest", inviteCode });

      expect(joinRes.status).toBe(200);
      expect(joinRes.body.lobby.players).toHaveLength(2);
      expect(joinRes.body.lobby.players[1].name).toBe("Guest");
      expect(joinRes.body.lobby.players[1].isHost).toBe(false);
    });

    it("should return 404 for invalid invite code", async () => {
      const response = await request(app)
        .post("/api/lobby/join")
        .send({ displayName: "Guest", inviteCode: "INVALID" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Lobby not found");
    });
  });

  describe("POST /api/lobby/join-random", () => {
    it("should join random public lobby", async () => {
      // Create public lobby
      await request(app)
        .post("/api/lobby/create")
        .send({ displayName: "Host", isPublic: true });

      // Join random
      const response = await request(app)
        .post("/api/lobby/join-random")
        .send({ displayName: "Guest" });

      expect(response.status).toBe(200);
      expect(response.body.lobby.players).toHaveLength(2);
    });

    it("should return 404 if no public lobbies available", async () => {
      const response = await request(app)
        .post("/api/lobby/join-random")
        .send({ displayName: "Guest" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("No public lobbies available");
    });
  });
});
