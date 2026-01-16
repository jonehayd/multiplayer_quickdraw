import { useLobbyContext } from "./contexts/LobbyContext";
import { LobbyProvider } from "./contexts/LobbyProvider";
import PlayerSetup from "./components/player-setup";
import Lobby from "./components/lobby";
import Game from "./components/game";
import { GameState } from "../../shared/gameState";
import "./App.css";

function AppContent() {
  const { lobbyInfo } = useLobbyContext();
  const gameState = lobbyInfo?.lobby.state;

  return (
    <>
      {gameState == null && <PlayerSetup />}
      {gameState === GameState.LOBBY && <Lobby />}
      {gameState === GameState.GAME && <Game />}
    </>
  );
}

function App() {
  return (
    <LobbyProvider>
      <AppContent />
    </LobbyProvider>
  );
}

export default App;
