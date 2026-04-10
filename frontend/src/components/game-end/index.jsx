import { useLobbyContext } from "../../contexts/LobbyContext.jsx";
import { useRef, useEffect, useState } from "react";
import "./styles.css";

export default function GameEnd() {
  const { lobbyInfo, leaveLobby } = useLobbyContext();

  if (!lobbyInfo) return null;

  const { winningCanvases, totalRounds } = lobbyInfo.lobby;
  const players = lobbyInfo.lobby.players;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const podiumPlayers = sortedPlayers.slice(0, 3);
  const otherPlayers = sortedPlayers.slice(3);
  const winningPlayerId = podiumPlayers[0]?.id;

  const allRounds = [];
  for (let i = 0; i < totalRounds; i++) {
    const winningCanvas = winningCanvases.find((c) => c.roundIndex === i);
    if (winningCanvas) {
      allRounds.push(winningCanvas);
    } else {
      allRounds.push({
        roundIndex: i,
        word: lobbyInfo.lobby.word ?? "Unknown",
        playerName: "No correct guesses",
        playerId: null,
        canvas: null,
      });
    }
  }

  const [centerIndex, setCenterIndex] = useState(0);
  const goLeft  = () => setCenterIndex((i) => Math.max(0, i - 1));
  const goRight = () => setCenterIndex((i) => Math.min(allRounds.length - 1, i + 1));

  // Arrange podium: 2nd | 1st | 3rd
  const podiumOrder = [podiumPlayers[1], podiumPlayers[0], podiumPlayers[2]].filter(Boolean);

  return (
    <div className="ge-page">
      <div className="ge-glow ge-glow-tl" />
      <div className="ge-glow ge-glow-br" />

      {/* Header */}
      <header className="ge-header">
        <span className="ge-header-title gradient-title">Quick Draw Battle</span>
        <button className="ge-back-btn" onClick={leaveLobby}>
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Lobby
        </button>
      </header>

      <main className="ge-main">
        {/* Results heading */}
        <div className="ge-hero">
          <h1 className="ge-hero-title">
            <span className="ge-hero-emoji">🏆</span>
            Game Over
          </h1>
          <p className="ge-hero-sub">Here&rsquo;s how the battle ended.</p>
        </div>

        {/* Podium */}
        {podiumPlayers.length > 0 && (
          <div className="glass-panel ge-podium-card">
            <div className="ge-podium">
              {podiumOrder.map((player) => {
                const rank = sortedPlayers.indexOf(player) + 1;
                const isWinner = player.id === winningPlayerId;
                return (
                  <div key={player.id} className={`ge-podium-slot rank-${rank}`}>
                    {isWinner && (
                      <span className="ge-crown material-symbols-outlined">workspace_premium</span>
                    )}
                    <div className="ge-podium-avatar">{player.name[0].toUpperCase()}</div>
                    <div className="ge-podium-name">{player.name}</div>
                    <div className="ge-podium-score">{player.score}</div>
                    <div className="ge-podium-block">
                      <span className="ge-podium-rank-num">{rank}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full leaderboard */}
        <div className="glass-panel ge-leaderboard">
          <h3 className="ge-section-title">
            <span className="material-symbols-outlined">leaderboard</span>
            Final Standings
          </h3>
          <div className="ge-lb-list">
            {sortedPlayers.map((player, idx) => (
              <div key={player.id} className={`ge-lb-row${idx === 0 ? " first" : ""}`}>
                <span className="ge-lb-rank">#{idx + 1}</span>
                <div className="ge-lb-avatar">{player.name[0].toUpperCase()}</div>
                <span className="ge-lb-name">{player.name}</span>
                <span className="ge-lb-score">{player.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gallery carousel */}
        {allRounds.length > 0 && (
          <div className="glass-panel ge-gallery">
            <h3 className="ge-section-title">
              <span className="material-symbols-outlined">collections</span>
              Round Gallery
            </h3>

            <div className="ge-gallery-track-wrapper">
              <button
                className="ge-arrow-btn"
                onClick={goLeft}
                disabled={centerIndex === 0}
                aria-label="Previous round"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>

              <div className="ge-gallery-track">
                {[centerIndex - 1, centerIndex, centerIndex + 1].map((i) => {
                  const item = allRounds[i];
                  const isCenter = i === centerIndex;
                  return (
                    <div
                      key={i}
                      className={`ge-gallery-item${isCenter ? " active" : ""}`}
                    >
                      {item ? (
                        <CanvasPreview canvasData={item} />
                      ) : (
                        <div className="ge-canvas-placeholder" />
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                className="ge-arrow-btn"
                onClick={goRight}
                disabled={centerIndex === allRounds.length - 1}
                aria-label="Next round"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function CanvasPreview({ canvasData }) {
  const canvasRef = useRef(null);
  const ORIGINAL_WIDTH = 800;
  const ORIGINAL_HEIGHT = 500;
  const DISPLAY_WIDTH = 400;
  const DISPLAY_HEIGHT = 250;

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!canvasData || !canvasData.canvas) return;
    const scaleX = DISPLAY_WIDTH / ORIGINAL_WIDTH;
    const scaleY = DISPLAY_HEIGHT / ORIGINAL_HEIGHT;
    ctx.lineCap = "round";
    canvasData.canvas.forEach((stroke) => {
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
  }, [canvasData]);

  return (
    <div className={`ge-canvas-card${!canvasData.playerId ? " no-winner" : ""}`}>
      <canvas ref={canvasRef} width={400} height={250} />
      <div className="ge-canvas-info">
        <span className="ge-canvas-round">Round {canvasData.roundIndex + 1}</span>
        <span className="ge-canvas-word">{canvasData.word}</span>
        <span className="ge-canvas-player">{canvasData.playerName}</span>
      </div>
    </div>
  );
}


