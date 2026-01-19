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

  // Callback to receive current in-progress stroke from MainPlayerCanvas
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

      // Keep track of the highest confidence correct canvas to send at round end
      const correct = results.find((p) => p.label === lobby?.word);
      if (correct && correct.confidence > highestConfidence.current) {
        highestConfidence.current = correct.confidence;

        // Capture committed strokes plus current in-progress stroke if it exists
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

  // Send the winning canvas if winner
  useEffect(() => {
    if (
      lobby?.roundWinnerId === lobbyInfo.userId &&
      winningCanvasStrokesRef.current &&
      !winningCanvasSentRef.current
    ) {
      winningCanvasSentRef.current = true;

      console.log(
        `[Frontend] Sending winning canvas for round ${lobby.roundIndex}`,
      );
      console.log(
        `[Frontend] Canvas has ${winningCanvasStrokesRef.current.length} strokes`,
      );

      send({
        type: "WINNING_CANVAS",
        canvas: winningCanvasStrokesRef.current,
      });
    }
  }, [lobby.roundIndex, lobby?.roundWinnerId, lobbyInfo.userId, send]);

  // Reset refs between rounds
  useEffect(() => {
    highestConfidence.current = 0;
    winningCanvasStrokesRef.current = null;
    winningCanvasSentRef.current = false;
  }, [lobby?.roundIndex]);

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
          <MainPlayerCanvas
            onStroke={handleStroke}
            onCurrentStroke={onCurrentStroke}
          />
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
