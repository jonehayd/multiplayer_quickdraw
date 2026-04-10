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
    players,
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
    return <p className="re-error">Unable to load lobby info!</p>;

  const sortedPlayers = players
    ? [...players].sort((a, b) => b.score - a.score)
    : [];

  return (
    <div className="re-page">
      <div className="re-glow re-glow-tl" />
      <div className="re-glow re-glow-br" />

      {/* Countdown bar at top */}
      <header className="re-top-bar">
        <div className="re-timer">
          <span className="material-symbols-outlined re-timer-icon">timer</span>
          <span className="re-timer-number">{secondsLeft}</span>
          <span className="re-timer-label">Next round in</span>
        </div>
        <span className="re-header-title gradient-title">Round {lobby.roundIndex} / {lobby.totalRounds}</span>
      </header>

      <main className="re-main">
        {/* Winner card */}
        <div className="glass-panel re-winner-card">
          <div className="re-winner-eyebrow">
            <span className="material-symbols-outlined">emoji_events</span>
            Round Winner
          </div>

          <h1 className="re-winner-name">{roundWinner ?? "No winner"}</h1>

          {winningGuess && (
            <div className="re-stats">
              <div className="re-stat">
                <span className="re-stat-label">Word</span>
                <span className="re-stat-value">{lobby.word ?? "—"}</span>
              </div>
              <div className="re-stat-divider" />
              <div className="re-stat">
                <span className="re-stat-label">AI&nbsp;Confidence</span>
                <span className="re-stat-value">
                  {Number.isFinite(confidence) ? Math.round(confidence) : "—"}%
                </span>
              </div>
            </div>
          )}

          {winningCanvas && winningCanvas.length > 0 && (
            <div className="re-canvas-wrapper">
              <p className="re-canvas-label">Winning Drawing</p>
              <canvas
                ref={canvasRef}
                width={DISPLAY_WIDTH}
                height={DISPLAY_HEIGHT}
                className="re-canvas"
              />
            </div>
          )}
        </div>

        {/* Leaderboard */}
        {sortedPlayers.length > 0 && (
          <div className="glass-panel re-leaderboard">
            <h3 className="re-leaderboard-title">
              <span className="material-symbols-outlined">leaderboard</span>
              Scores
            </h3>
            <div className="re-leaderboard-list">
              {sortedPlayers.map((player, idx) => (
                <div key={player.id} className="re-leaderboard-row">
                  <span className="re-rank">{idx + 1}</span>
                  <div className="re-lb-avatar">
                    {player.name[0].toUpperCase()}
                  </div>
                  <span className="re-lb-name">{player.name}</span>
                  <span className="re-lb-score">{player.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}



