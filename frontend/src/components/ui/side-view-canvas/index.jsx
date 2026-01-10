import { useEffect, useRef, useState } from "react";
import "./side-view-canvas.css";

export default function SideViewCanvas({ socket, selfId }) {
  const [players, setPlayers] = useState({}); // playerId -> image
  const canvasRefs = useRef({}); // playerId -> canvas element

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type !== "canvas-update") return;
      if (msg.playerId === selfId) return;

      setPlayers((prev) => ({
        ...prev,
        [msg.playerId]: msg.image,
      }));
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket, selfId]);

  // Draw images into canvases
  useEffect(() => {
    Object.entries(players).forEach(([playerId, imageSrc]) => {
      const canvas = canvasRefs.current[playerId];
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = imageSrc;
    });
  }, [players]);

  return (
    <div className="side-view-container">
      {Object.keys(players).map((playerId) => (
        <div key={playerId} className="side-player">
          <canvas
            ref={(el) => (canvasRefs.current[playerId] = el)}
            width={128}
            height={128}
          />
          <span className="player-label">{playerId}</span>
        </div>
      ))}
    </div>
  );
}
