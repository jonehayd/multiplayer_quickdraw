import { GiDiamondTrophy } from "react-icons/gi";
import { useLobbyContext } from "../../contexts/LobbyContext.jsx";
import { useRef, useEffect } from "react";
import "./styles.css";

export default function GameEnd() {
  const { lobbyInfo, leaveLobby } = useLobbyContext();

  if (!lobbyInfo) return null;

  const { winningCanvases, totalRounds } = lobbyInfo.lobby;
  const players = lobbyInfo.lobby.players;

  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const podiumPlayers = sortedPlayers.slice(0, 3); // top 3
  const otherPlayers = sortedPlayers.slice(3); // The rest

  const winningPlayerId = podiumPlayers[0]?.id;

  const handleBackToLobby = () => leaveLobby();

  // Build complete rounds array including empty canvases for no-winner rounds
  const allRounds = [];
  for (let i = 0; i < totalRounds; i++) {
    const winningCanvas = winningCanvases.find((c) => c.roundIndex === i);
    if (winningCanvas) {
      allRounds.push(winningCanvas);
    } else {
      // Add empty canvas entry for rounds with no winner
      allRounds.push({
        roundIndex: i,
        word: lobbyInfo.lobby.word ?? "Unknown",
        playerName: "No correct guesses",
        playerId: null,
        canvas: null,
      });
    }
  }

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

      {/* All Rounds Gallery */}
      {allRounds && allRounds.length > 0 && (
        <div className="winning-canvases-gallery">
          <h2>All Rounds</h2>
          <div className="canvas-grid">
            {allRounds.map((item, index) => (
              <div key={index} className="canvas-item">
                <CanvasPreview canvasData={item} />
              </div>
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

    // If no canvas data, just show white canvas
    if (!canvasData || !canvasData.canvas) return;

    // Calculate scale factors
    const scaleX = DISPLAY_WIDTH / ORIGINAL_WIDTH;
    const scaleY = DISPLAY_HEIGHT / ORIGINAL_HEIGHT;

    // Draw each stroke with proper scaling
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
    <div
      className={`canvas-preview-card ${!canvasData.playerId ? "no-winner" : ""}`}
    >
      <canvas ref={canvasRef} width={400} height={250} />
      <div className="canvas-info">
        <span className="round-label">Round {canvasData.roundIndex + 1}</span>
        <span className="word-label">{canvasData.word}</span>
        <span className="player-label">{canvasData.playerName}</span>
      </div>
    </div>
  );
}
