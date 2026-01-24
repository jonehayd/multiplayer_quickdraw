import { LobbyService } from "./lobbyService.js";
import { lobbyRepository } from "../repositories/index.js";
import { CategoryService } from "./categoryService.js";

export const lobbyService = new LobbyService(
  lobbyRepository,
  CategoryService.getInstance(),
);
export { CategoryService };
