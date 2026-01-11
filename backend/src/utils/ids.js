import crypto from "crypto";

export function createUserId() {
  return "u_" + crypto.randomBytes(4).toString("hex");
}

export function createLobbyId() {
  return crypto.randomBytes(6).toString("hex");
}

export function createInviteCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}
