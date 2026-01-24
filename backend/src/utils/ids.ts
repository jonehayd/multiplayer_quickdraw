import crypto from "crypto";

export function createUserId(): string {
  return "u_" + crypto.randomBytes(4).toString("hex");
}

export function createLobbyId(): string {
  return crypto.randomBytes(6).toString("hex");
}

export function createInviteCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}
