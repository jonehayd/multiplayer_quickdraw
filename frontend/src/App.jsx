import { useState, useEffect } from "react";
import { useLobby } from "./hooks/useLobby";
import PlayerSetup from "./components/player-setup";
import Lobby from "./components/lobby";
import Game from "./components/game";
import { AppStates } from "./AppStates";
import "./App.css";

function App() {
  const { lobbyInfo, handleAction, leaveLobby } = useLobby();
  const [appState, setAppState] = useState(AppStates.PLAYER_SETUP);

  useEffect(() => {
    if (lobbyInfo) {
      setAppState(AppStates.LOBBY);
    } else {
      setAppState(AppStates.PLAYER_SETUP);
    }
  }, [lobbyInfo]);

  function startGame() {
    setAppState(AppStates.GAME);
  }

  return (
    <>
      {appState === AppStates.PLAYER_SETUP && (
        <PlayerSetup handleAction={handleAction} />
      )}

      {appState === AppStates.LOBBY && (
        <Lobby
          lobbyInfo={lobbyInfo}
          onStartGame={startGame}
          onLeave={leaveLobby}
          leaveLobby={leaveLobby}
        />
      )}

      {appState === AppStates.GAME && <Game lobbyInfo={lobbyInfo} />}
    </>
  );
}

export default App;
