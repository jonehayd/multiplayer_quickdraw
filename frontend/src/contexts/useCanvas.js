import { useState, useRef, useCallback } from "react";

export function useCanvas() {
  const [drawingsByPlayer, setDrawingsByPlayer] = useState({});
  const inProgressStrokesRef = useRef({}); // strokes that have started but not yet been committed

  const applyCanvasUpdate = useCallback((playerId, stroke, isComplete) => {
    if (isComplete) {
      // The stroke is done, move it from in-progress to the committed list
      setDrawingsByPlayer((prev) => {
        const playerStrokes = prev[playerId] || [];
        return {
          ...prev,
          [playerId]: [...playerStrokes, stroke],
        };
      });
      delete inProgressStrokesRef.current[playerId];
    } else {
      // Store the partial stroke so the canvas can render it live
      inProgressStrokesRef.current[playerId] = stroke;
      setDrawingsByPlayer((prev) => ({ ...prev }));
    }
  }, []);

  const applyCanvasUndo = useCallback((playerId) => {
    setDrawingsByPlayer((prev) => {
      const playerStrokes = prev[playerId] || [];
      if (playerStrokes.length === 0) return prev;

      return {
        ...prev,
        [playerId]: playerStrokes.slice(0, -1),
      };
    });
  }, []);

  const clearCanvas = useCallback((playerId) => {
    setDrawingsByPlayer((prev) => {
      const newState = { ...prev };
      delete newState[playerId];
      return newState;
    });
    delete inProgressStrokesRef.current[playerId];
  }, []);

  return {
    drawingsByPlayer,
    inProgressStrokesRef,
    applyCanvasUpdate,
    applyCanvasUndo,
    clearCanvas,
  };
}
