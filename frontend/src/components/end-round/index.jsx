import { useLobbyContext } from "../../contexts/LobbyContext";
import { useCountdown } from "../../hooks/useCountdown";
import { useRef } from "react";
import "./styles.css";
import { useLayoutEffect } from "react";

export default function RoundEnd() {
  const { lobbyInfo } = useLobbyContext();
  const lobby = lobbyInfo?.lobby;
  const canvasRef = useRef(null);

  const {
    phaseStartedAt,
    phaseDuration,
    roundWinner,
    winningGuess,
    winningCanvas,
    winningCanvasReady,
  } = lobby || {};

  const secondsLeft = useCountdown(phaseStartedAt, phaseDuration);

  // Draw winning canvas
  useLayoutEffect(() => {
    console.log(`[end-round] Winning canvas: ${winningCanvas}`);
    if (!canvasRef.current || !winningCanvas) return;
    console.log(`[end-round] Drawing winning canvas: ${winningCanvas}`);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Fill background white
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw each stroke
    ctx.lineCap = "round";
    winningCanvas.forEach((stroke) => {
      const points = stroke.points;
      if (!points || points.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;

      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });

      ctx.stroke();
      ctx.closePath();
    });
  }, [winningCanvas, winningCanvasReady]);

  if (!lobby)
    return <p className="round-end-error">Unable to load lobby info!</p>;

  return (
    <div className="round-end">
      <div className="countdown">
        <span className="countdown-number">{secondsLeft}</span>
        <span className="countdown-text">Next round starts in</span>
      </div>

      <div className="winner-card">
        <span className="winner-label">Round Winner</span>
        <h1 className="winner-name">{roundWinner ?? "No winner"}</h1>

        {winningGuess && (
          <div className="guess-info">
            <div className="guess-row">
              <span className="guess-label">Word</span>
              <span className="guess-value">{lobby.word ?? "—"}</span>
            </div>

            <div className="guess-row">
              <span className="guess-label">Confidence</span>
              <span className="guess-value">
                {Math.round(winningGuess.confidence)}%
              </span>
            </div>
          </div>
        )}

        {winningCanvas && winningCanvas.length > 0 && (
          <div className="winning-canvas-container">
            <span className="canvas-label">Winning Drawing</span>
            <canvas
              ref={canvasRef}
              width={400}
              height={250}
              className="winning-canvas"
            />
          </div>
        )}
      </div>
    </div>
  );
}
