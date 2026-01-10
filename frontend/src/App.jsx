import "./App.css";
import Lobby from "./components/lobby";
import PlayerSetup from "./components/player-setup";
import MainPlayerCanvas from "./components/ui/main-player-canvas";
import Game from "./components/game";

function submitNameForm() {}

function App() {
  return (
    <>
      {/* Player Setup */}
      {/* <PlayerSetup onComplete={submitNameForm} /> */}
      {/* Lobby */}
      {/* <Lobby /> */}
      {/* <MainPlayerCanvas /> */}
      <Game />
    </>
  );
}

export default App;
