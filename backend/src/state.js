/**
 * lobbies: Map<lobbyId, Lobby>
 *
 * lobby:
 * {
 *   id: string,              // Unique lobby ID
 *   inviteCode: string,      // Short code used to join private/public lobbies
 *   isPublic: boolean,       // Whether the lobby is joinable via random matchmaking
 *   players: Map<userId, Player>, // Connected players in this lobby
 *   createdAt: number        // Timestamp (Date.now()) when lobby was created
 *   state: GameState
 *   roundIndex: int
 *   totalRounds: int
 *   words: Array<string>
 *   game: Game
 * }
 *
 * players:
 * {
 *   id: string,              // Unique user ID
 *   name: string,            // Player display name
 *   ws: WebSocket | null     // WebSocket connection (null until connected)
 *   isHost: bool             // Whether the player is the host
 *   score: int
 * }
 *
 * game:
 * {
 *    roundTimer,
 *    startTimer,
 *    endTimer,
 *    guesses: [], // [{playerId, confidence}] only stores correct guesses
 *    roundWinner: string,
 * }
 */
export const lobbies = new Map();

export const inviteCodeMap = new Map();
