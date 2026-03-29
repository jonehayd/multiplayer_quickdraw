import { useLobbyContext } from "./contexts/LobbyContext";
import { LobbyProvider } from "./contexts/LobbyProvider";
import PlayerSetup from "./components/player-setup";
import Lobby from "./components/lobby";
import Game from "./components/game";
import StartRound from "./components/start-round";
import RoundEnd from "./components/end-round";
import GameEnd from "./components/game-end";
import { GameState } from "../../shared/gameState";
import { Analytics } from "@vercel/analytics/next";
import "./App.css";

function AppContent() {
  const { lobbyInfo } = useLobbyContext();
  const gameState = lobbyInfo?.lobby.state;

  return (
    <>
      {gameState == null && <PlayerSetup />}
      {gameState === GameState.LOBBY && <Lobby />}
      {gameState === GameState.ROUND_START && <StartRound />}
      {gameState === GameState.GAME && <Game />}
      {gameState === GameState.ROUND_END && <RoundEnd />}
      {gameState === GameState.GAME_END && <GameEnd />}
    </>
  );
}

function App() {
  return (
    <>
      <LobbyProvider>
        <AppContent />
      </LobbyProvider>
      <Analytics />
    </>
  );
}

export default App;
