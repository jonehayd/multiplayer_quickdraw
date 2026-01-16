import { useState, useRef, useCallback } from "react";

export function useCanvas() {
  const [drawingsByPlayer, setDrawingsByPlayer] = useState({});
  const inProgressStrokesRef = useRef({}); // Track incomplete strokes

  const applyCanvasUpdate = useCallback((playerId, stroke, isComplete) => {
    if (isComplete) {
      // Finalize the stroke - add to completed strokes
      setDrawingsByPlayer((prev) => {
        const playerStrokes = prev[playerId] || [];
        return {
          ...prev,
          [playerId]: [...playerStrokes, stroke],
        };
      });
      // Remove from in-progress
      delete inProgressStrokesRef.current[playerId];
    } else {
      // Store in-progress stroke for live rendering
      inProgressStrokesRef.current[playerId] = stroke;
      // Force re-render by updating state
      setDrawingsByPlayer((prev) => ({ ...prev }));
    }
  }, []);

  const applyCanvasUndo = useCallback((playerId) => {
    setDrawingsByPlayer((prev) => {
      const playerStrokes = prev[playerId] || [];
      if (playerStrokes.length === 0) return prev;

      return {
        ...prev,
        [playerId]: playerStrokes.slice(0, -1), // Remove last stroke
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
