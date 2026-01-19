import { useLobbyContext } from "../../contexts/LobbyContext";
import { useCountdown } from "../../hooks/useCountdown";
import { useRef, useEffect } from "react";
import "./styles.css";

const ORIGINAL_WIDTH = 800;
const ORIGINAL_HEIGHT = 500;
const DISPLAY_WIDTH = 400;
const DISPLAY_HEIGHT = 250;

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
  } = lobby || {};

  const secondsLeft = useCountdown(phaseStartedAt, phaseDuration);
  const confidence = Number(winningGuess?.confidence);

  // Draw winning canvas
  useEffect(() => {
    if (!canvasRef.current || !winningCanvas || winningCanvas.length === 0)
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleX = DISPLAY_WIDTH / ORIGINAL_WIDTH;
    const scaleY = DISPLAY_HEIGHT / ORIGINAL_HEIGHT;

    // Draw each stroke with proper scaling
    ctx.lineCap = "round";
    winningCanvas.forEach((stroke) => {
      const points = stroke.points;
      if (!points || points.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size * scaleX;

      points.forEach((p, i) => {
        const x = p.x * scaleX;
        const y = p.y * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();
      ctx.closePath();
    });
  }, [winningCanvas]);

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
                {Number.isFinite(confidence) ? Math.round(confidence) : "—"}%
              </span>
            </div>
          </div>
        )}

        {winningCanvas && winningCanvas.length > 0 && (
          <div className="winning-canvas-container">
            <span className="canvas-label">Winning Drawing</span>
            <canvas
              ref={canvasRef}
              width={DISPLAY_WIDTH}
              height={DISPLAY_HEIGHT}
              className="winning-canvas"
            />
          </div>
        )}
      </div>
    </div>
  );
}
