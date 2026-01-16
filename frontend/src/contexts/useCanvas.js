import { useState } from "react";

export function useCanvas() {
  const [drawingsByPlayer, setDrawingsByPlayer] = useState({});

  function applyCanvasUpdate(playerId, strokes) {
    setDrawingsByPlayer((prev) => ({
      ...prev,
      [playerId]: strokes,
    }));
  }

  function clearCanvas() {
    setDrawingsByPlayer({});
  }

  return {
    drawingsByPlayer,
    applyCanvasUpdate,
    clearCanvas,
  };
}
