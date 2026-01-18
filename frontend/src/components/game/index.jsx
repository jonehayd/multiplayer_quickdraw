import { useEffect, useState, useCallback, useRef } from "react";
import { useLobbyContext } from "../../contexts/LobbyContext";
import { useCountdown } from "../../hooks/useCountdown";
import MainPlayerCanvas from "../ui/main-player-canvas";
import SideViewCanvas from "../ui/side-view-canvas";
import GuessDisplay from "../ui/guess-display";
import PlayerScores from "../ui/player-scores";
import { initInference, predict } from "./inference";
import "./styles.css";

export default function Game() {
  const { lobbyInfo, send, drawingsByPlayer } = useLobbyContext();
  const lobby = lobbyInfo?.lobby;
  const mainCanvasRef = useRef(null);

  const [top3, setTop3] = useState([]);

  const secondsLeft = useCountdown(lobby?.phaseStartedAt, lobby?.phaseDuration);

  useEffect(() => {
    initInference().then(() => {
      console.log("Inference initialized!");
    });
  }, []);

  // Called whenever the local player draws a stroke
  const handleStroke = useCallback(
    async (canvas) => {
      const results = await predict(canvas);
      setTop3(results);

      // Get current canvas strokes from context
      const currentCanvasStrokes = drawingsByPlayer[lobbyInfo.userId] || [];

      send({
        type: "GUESS",
        predictions: results,
        canvas: currentCanvasStrokes,
      });
    },
    [send, lobbyInfo.userId, drawingsByPlayer],
  );

  if (!lobby) return <p>Loading game...</p>;

  return (
    <div className="game">
      {/* Top HUD */}
      <div className="game-header">
        <div className="game-timer">
          <span className="timer-number">{secondsLeft}</span>
          <span className="timer-label">Time left</span>
        </div>

        <div className="game-word">
          <span className="word-label">Draw</span>
          <span className="word-value">{lobby.word}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="game-body">
        {/* Main canvas */}
        <div className="main-canvas">
          <MainPlayerCanvas onStroke={handleStroke} />
        </div>

        {/* Guesses */}
        <GuessDisplay guesses={top3} />

        {/* Side canvases */}
        <SideViewCanvas />

        {/* Scores */}
        <PlayerScores players={lobby.players} />
      </div>
    </div>
  );
}
