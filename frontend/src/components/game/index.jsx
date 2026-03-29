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

  return (
    <div className="game-page">
      {/* Header: timer, current word, and leave button */}
      <div className="game-header">
        <div className="game-timer">
          <span className="timer-number">{secondsLeft}</span>
          <span className="timer-label">Time left</span>
        </div>

        <div className="game-word">
          <span className="word-label">Draw</span>
          <span className="word-value">{lobby.word}</span>
        </div>

        <button className="leave-button" onClick={leaveLobby}>
          Leave
        </button>
      </div>

      {/* Three-column layout: scores, canvas, other players */}
      <div className="game-body">
        {/* Left sidebar: scores and AI guesses */}
        <aside className="game-sidebar left">
          <div className="sidebar-panel">
            <h3 className="panel-title">Players</h3>
            <PlayerScores players={lobby.players} />
          </div>

          <div className="sidebar-panel">
            <h3 className="panel-title">AI Guesses</h3>
            <GuessDisplay guesses={top3} />
          </div>
        </aside>

        {/* Center column: the drawing canvas */}
        <div className="game-center">
          <MainPlayerCanvas
            onStroke={handleStroke}
            onCurrentStroke={onCurrentStroke}
          />
        </div>

        {/* Right sidebar: small live canvases for other players */}
        <aside className="game-sidebar right">
          <div className="sidebar-panel">
            <h3 className="panel-title">Other Players</h3>
            <SideViewCanvas />
          </div>
        </aside>
      </div>
    </div>
  );
}
