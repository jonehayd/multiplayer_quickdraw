import { useEffect, useRef, useState } from "react";
import { useLobbyContext } from "../../../contexts/LobbyContext";
import "./styles.css";
import { FaEraser } from "react-icons/fa";
import { LuUndo2 } from "react-icons/lu";
import { MdDeleteForever } from "react-icons/md";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const BRUSH_SIZE = 15;
const ERASER_SIZE = 15;
const STROKE_UPDATE_INTERVAL = 50; // Send updates every 50ms while drawing
const PREDICTION_INTERVAL = 500; // Send prediction results every 500 ms

export default function MainPlayerCanvas({ onStroke, onCurrentStroke }) {
  const {
    send,
    lobbyInfo,
    applyCanvasUpdate,
    applyCanvasUndo,
    clearCanvas: clearCanvasContext,
  } = useLobbyContext();
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const strokesRef = useRef([]); // all committed strokes
  const currentStrokeRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const canvasDirtyRef = useRef(false);
  const predictionTimerRef = useRef(null);

  const [tool, setTool] = useState("pen"); // "pen" | "eraser"
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState(null);

  function drawStroke(stroke) {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";

    stroke.points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });

    ctx.stroke();
    ctx.closePath();
  }

  function getMousePos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function redrawFromStrokes() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    strokesRef.current.forEach(drawStroke);
  }

  function undoStroke() {
    if (strokesRef.current.length === 0) return;

    strokesRef.current.pop();
    redrawFromStrokes();

    canvasDirtyRef.current = true;

    // Sync undo to context as well
    applyCanvasUndo(lobbyInfo.userId);

    // Broadcast undo to other players
    send({
      type: "CANVAS_UNDO",
      lobbyId: lobbyInfo.lobby.id,
      playerId: lobbyInfo.userId,
    });
  }

  function startDrawing(e) {
    const { x, y } = getMousePos(e);
    setMousePos({ x, y });

    const stroke = {
      tool,
      color: tool === "eraser" ? "white" : "black",
      size: tool === "eraser" ? ERASER_SIZE : BRUSH_SIZE,
      points: [{ x, y }],
    };

    currentStrokeRef.current = stroke;

    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(x, y);

    setIsDrawing(true);
    lastUpdateTimeRef.current = Date.now();

    // Send initial stroke start
    send({
      type: "CANVAS_STROKE",
      lobbyId: lobbyInfo.lobby.id,
      playerId: lobbyInfo.userId,
      stroke: stroke,
      isComplete: false,
    });
  }

  function draw(e) {
    const { x, y } = getMousePos(e);
    setMousePos({ x, y });

    if (!isDrawing || !currentStrokeRef.current) return;

    const ctx = ctxRef.current;
    const stroke = currentStrokeRef.current;

    stroke.points.push({ x, y });
    ctx.lineTo(x, y);
    ctx.stroke();

    // Mark canvas as changed
    canvasDirtyRef.current = true;

    // Notify parent of current stroke
    if (onCurrentStroke) {
      onCurrentStroke(stroke);
    }

    // Throttled updates - only send every STROKE_UPDATE_INTERVAL ms
    const now = Date.now();
    if (now - lastUpdateTimeRef.current >= STROKE_UPDATE_INTERVAL) {
      lastUpdateTimeRef.current = now;

      send({
        type: "CANVAS_STROKE",
        lobbyId: lobbyInfo.lobby.id,
        playerId: lobbyInfo.userId,
        stroke: { ...stroke }, // Send a copy
        isComplete: false,
      });
    }
  }

  function stopDrawing() {
    if (!currentStrokeRef.current) return;

    ctxRef.current.closePath();

    // Add completed stroke to history
    strokesRef.current.push(currentStrokeRef.current);

    // Mark canvas as changed
    canvasDirtyRef.current = true;

    // Add stroke to context so it's available for sending later
    applyCanvasUpdate(lobbyInfo.userId, currentStrokeRef.current, true);

    // Send FINAL stroke to server
    send({
      type: "CANVAS_STROKE",
      lobbyId: lobbyInfo.lobby.id,
      playerId: lobbyInfo.userId,
      stroke: currentStrokeRef.current,
      isComplete: true, // Mark as complete
    });

    currentStrokeRef.current = null;

    // Notify parent that stroke is done
    if (onCurrentStroke) {
      onCurrentStroke(null);
    }

    setIsDrawing(false);
  }

  function clearCanvas() {
    strokesRef.current = [];
    redrawFromStrokes();

    canvasDirtyRef.current = true;

    // Clear from context as well
    clearCanvasContext(lobbyInfo.userId);

    // Broadcast clear to other players
    send({
      type: "CANVAS_CLEAR",
      lobbyId: lobbyInfo.lobby.id,
      playerId: lobbyInfo.userId,
    });
  }

  function clearPreview() {
    const preview = previewCanvasRef.current;
    if (!preview) return;

    const ctx = preview.getContext("2d");
    ctx.clearRect(0, 0, preview.width, preview.height);
  }

  // Draw eraser indicator
  useEffect(() => {
    const preview = previewCanvasRef.current;
    if (!preview || !mousePos) return;

    preview.width = CANVAS_WIDTH;
    preview.height = CANVAS_HEIGHT;

    const ctx = preview.getContext("2d");
    ctx.clearRect(0, 0, preview.width, preview.height);

    if (tool === "eraser") {
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, ERASER_SIZE / 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [mousePos, tool]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = BRUSH_SIZE;

    ctxRef.current = ctx;
  }, []);

  // Undo on ctrl + z
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undoStroke();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Set tool properties
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "white";
      ctx.lineWidth = ERASER_SIZE;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "black";
      ctx.lineWidth = BRUSH_SIZE;
    }
  }, [tool]);

  // Send predictions every set interval, only if the canvas has changed
  useEffect(() => {
    if (!onStroke) return;

    predictionTimerRef.current = setInterval(() => {
      if (!canvasDirtyRef.current) return;

      canvasDirtyRef.current = false;
      onStroke(canvasRef.current);
    }, PREDICTION_INTERVAL);

    return () => {
      clearInterval(predictionTimerRef.current);
    };
  }, [onStroke]);

  return (
    <div className="player-canvas-container">
      <div className="button-container">
        <button
          title="Clear"
          onClick={clearCanvas}
          className="action-button active"
        >
          <MdDeleteForever />
        </button>
        <button
          title="Undo"
          onClick={undoStroke}
          className="action-button active"
        >
          <LuUndo2 />
        </button>
        <button
          title="Eraser"
          onClick={() => setTool(tool === "eraser" ? "pen" : "eraser")}
          className={`action-button ${tool === "eraser" ? "active" : ""}`}
        >
          <FaEraser />
        </button>
      </div>

      <div className="canvas-wrapper">
        <canvas
          id="main-player-canvas"
          ref={canvasRef}
          className={tool === "eraser" ? "eraser-active" : ""}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={() => {
            if (isDrawing) stopDrawing();
            setIsDrawing(false);
            clearPreview();
          }}
        />
      </div>
    </div>
  );
}
