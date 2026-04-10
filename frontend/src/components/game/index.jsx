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
  const { lobbyInfo, send, drawingsByPlayer, leaveLobby } = useLobbyContext();
  const lobby = lobbyInfo?.lobby;
  const winningCanvasStrokesRef = useRef(null);
  const highestConfidence = useRef(0);
  const winningCanvasSentRef = useRef(false);
  const currentStrokeRef = useRef(null);

  const [top3, setTop3] = useState([]);

  const secondsLeft = useCountdown(lobby?.phaseStartedAt, lobby?.phaseDuration);

  const phase = lobby?.state;

  useEffect(() => {
    initInference();
  }, []);

  // Receive the in-progress stroke from the canvas so we can include it in the winning canvas snapshot
  const onCurrentStroke = useCallback((stroke) => {
    currentStrokeRef.current = stroke;
  }, []);

  // Called whenever the local player draws a stroke
  const handleStroke = useCallback(
    async (canvas) => {
      if (phase !== "GAME") return;
      const results = await predict(canvas);
      setTop3(results);

      // Get current canvas strokes from context
      const currentCanvasStrokes = drawingsByPlayer[lobbyInfo.userId] || [];

      // Track the highest-confidence correct frame so we can send the best canvas at round end
      const correct = results.find((p) => p.label === lobby?.word);
      if (correct && correct.confidence > highestConfidence.current) {
        highestConfidence.current = correct.confidence;

        // Include the current in-progress stroke if one exists, since it may not be committed yet
        const strokesToCapture = [...currentCanvasStrokes];
        if (currentStrokeRef.current) {
          strokesToCapture.push(currentStrokeRef.current);
        }

        winningCanvasStrokesRef.current = strokesToCapture.map((stroke) => ({
          ...stroke,
          points: stroke.points.map((p) => ({ ...p })),
        }));
      }

      // Send the updated canvas strokes to display
      send({
        type: "GUESS",
        predictions: results,
        canvas: currentCanvasStrokes,
      });
    },
    [phase, drawingsByPlayer, lobbyInfo.userId, send, lobby.word],
  );

  // Send the winning canvas once the server has declared this player as the round winner
  useEffect(() => {
    if (
      lobby?.roundWinnerId === lobbyInfo.userId &&
      winningCanvasStrokesRef.current &&
      !winningCanvasSentRef.current
    ) {
      winningCanvasSentRef.current = true;

      send({
        type: "WINNING_CANVAS",
        canvas: winningCanvasStrokesRef.current,
      });
    }
  }, [lobby.roundIndex, lobby?.roundWinnerId, lobbyInfo.userId, send]);

  // Reset per-round tracking state when the round index changes
  useEffect(() => {
    highestConfidence.current = 0;
    winningCanvasStrokesRef.current = null;
    winningCanvasSentRef.current = false;
  }, [lobby?.roundIndex]);

  if (!lobby) return <p>Loading game...</p>;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="game-page">
      {/* Header */}
      <header className="game-header">
        <span className="game-header-title gradient-title">Quick Draw Battle</span>

        <div className="game-timer-pill">
          <span className="material-symbols-outlined game-timer-icon">timer</span>
          <span className="game-timer-value">
            {mm}:{ss}
          </span>
        </div>

        <button className="game-leave-btn" onClick={leaveLobby} title="Leave game">
          <span className="material-symbols-outlined">logout</span>
          Leave
        </button>
      </header>

      {/* Body: three columns */}
      <div className="game-body">
        {/* Left: players + AI guesses */}
        <aside className="game-sidebar">
          <div className="game-panel">
            <h3 className="game-panel-title">
              <span className="material-symbols-outlined">group</span>
              Players
            </h3>
            <PlayerScores players={lobby.players} />
          </div>

          <div className="game-panel">
            <h3 className="game-panel-title">
              <span className="material-symbols-outlined">psychology</span>
              AI Guesses
            </h3>
            <GuessDisplay guesses={top3} />
          </div>
        </aside>

        {/* Center: word banner + canvas */}
        <div className="game-center">
          <div className="game-word-banner">
            <span className="game-word-label">Draw:</span>
            <span className="game-word-value">{lobby.word}</span>
          </div>
          <MainPlayerCanvas
            onStroke={handleStroke}
            onCurrentStroke={onCurrentStroke}
          />
        </div>

        {/* Right: other players' canvases */}
        <aside className="game-sidebar game-sidebar-right">
          <div className="game-panel">
            <h3 className="game-panel-title">
              <span className="material-symbols-outlined">live_tv</span>
              Live Feeds
            </h3>
            <SideViewCanvas />
          </div>
        </aside>
      </div>
    </div>
  );
}
