import { useEffect, useRef, useMemo } from "react";
import { useLobbyContext } from "../../../contexts/LobbyContext";

const MAIN_CANVAS_WIDTH = 800;
const MAIN_CANVAS_HEIGHT = 500;

export default function SideViewCanvas() {
  const { lobbyInfo, drawingsByPlayer } = useLobbyContext();
  const canvasRefs = useRef({});

  const userId = lobbyInfo?.userId;

  const players = useMemo(() => {
    return lobbyInfo?.lobby?.players ?? [];
  }, [lobbyInfo?.lobby?.players]);

  const otherPlayers = useMemo(() => {
    return players.filter((p) => p.id !== userId);
  }, [players, userId]);

  useEffect(() => {
    otherPlayers.forEach((player) => {
      const canvas = canvasRefs.current[player.id];
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";

      const strokes = drawingsByPlayer[player.id] || [];

      // Fill background white
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Scaling for small side canvas
      const scaleX = canvas.width / MAIN_CANVAS_WIDTH;
      const scaleY = canvas.height / MAIN_CANVAS_HEIGHT;

      strokes.forEach((stroke) => {
        const points = stroke.points;
        if (!points || points.length === 0) return;

        // Single point -> draw a small dot
        if (points.length === 1) {
          const p = points[0];
          const x = p.x * scaleX;
          const y = p.y * scaleY;

          ctx.beginPath();
          ctx.fillStyle = stroke.color;
          ctx.arc(x, y, stroke.size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.closePath();
        } else {
          // Multiple points -> draw line
          ctx.beginPath();
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.size * ((scaleX + scaleY) / 2);

          points.forEach((p, i) => {
            const x = p.x * scaleX;
            const y = p.y * scaleY;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });

          ctx.stroke();
          ctx.closePath();
        }
      });
    });
  }, [drawingsByPlayer, otherPlayers]);

  if (!lobbyInfo) return null;

  return (
    <div className="side-view-container">
      {otherPlayers.map((player) => (
        <div key={player.id} className="side-player">
          <canvas
            ref={(el) => {
              if (el) canvasRefs.current[player.id] = el;
            }}
            width={128}
            height={128}
          />
          <span className="player-label">{player.name}</span>
        </div>
      ))}
    </div>
  );
}
