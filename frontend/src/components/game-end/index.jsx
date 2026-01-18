import { GiDiamondTrophy } from "react-icons/gi";
import { useLobbyContext } from "../../contexts/LobbyContext.jsx";
import { useEffect, useRef } from "react";
import "./styles.css";

export default function GameEnd() {
  const { lobbyInfo, leaveLobby } = useLobbyContext();

  if (!lobbyInfo) return null;

  const { players, winningCanvases } = lobbyInfo.lobby;

  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const podiumPlayers = sortedPlayers.slice(0, 3); // top 3
  const otherPlayers = sortedPlayers.slice(3, 5); // next 2

  const winningPlayerId = podiumPlayers[0]?.id;

  const handleBackToLobby = () => leaveLobby();

  return (
    <div className="container game-end">
      <h1>Game Over</h1>

      <div className="podium">
        {podiumPlayers.map((player, index) => {
          const visualIndex = index === 0 ? 1 : index === 1 ? 0 : 2;
          return (
            <div
              key={player.id}
              className={`podium-step rank-${index + 1} visual-${visualIndex}`}
            >
              <div className="score">{player.score}</div>
              <div className="name">
                {player.name}
                {player.id === winningPlayerId && (
                  <GiDiamondTrophy className="trophy" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {otherPlayers.length > 0 && (
        <div className="leaderboard">
          {otherPlayers.map((player, index) => (
            <div key={player.id} className="leaderboard-row">
              <span className="rank">{index + 4}.</span>
              <span className="name">{player.name}</span>
              <span className="score">{player.score}</span>
            </div>
          ))}
        </div>
      )}

      {/* Winning Canvases Gallery */}
      {winningCanvases && winningCanvases.length > 0 && (
        <div className="winning-canvases-gallery">
          <h2>Winning Drawings</h2>
          <div className="canvas-grid">
            {winningCanvases.map((item, index) => (
              <CanvasPreview key={index} canvasData={item} />
            ))}
          </div>
        </div>
      )}

      <button className="back-to-lobby-btn" onClick={handleBackToLobby}>
        Back to Lobby
      </button>
    </div>
  );
}

// Component to render each canvas
function CanvasPreview({ canvasData }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !canvasData.canvas) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Fill background white
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw each stroke
    ctx.lineCap = "round";
    canvasData.canvas.forEach((stroke) => {
      const points = stroke.points;
      if (!points || points.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size * 0.5; // Scale down for smaller canvas

      points.forEach((p, i) => {
        const x = p.x * 0.5; // Scale coordinates
        const y = p.y * 0.5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();
      ctx.closePath();
    });
  }, [canvasData]);

  return (
    <div className="canvas-preview-card">
      <canvas ref={canvasRef} width={400} height={250} />
      <div className="canvas-info">
        <span className="round-label">Round {canvasData.roundIndex + 1}</span>
        <span className="word-label">{canvasData.word}</span>
        <span className="player-label">{canvasData.playerName}</span>
      </div>
    </div>
  );
}
