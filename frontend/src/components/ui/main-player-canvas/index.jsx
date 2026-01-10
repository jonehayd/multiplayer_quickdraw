import { useEffect, useRef, useState } from "react";
import "./styles.css";
import { FaEraser } from "react-icons/fa";
import { LuUndo2 } from "react-icons/lu";
import { MdDeleteForever } from "react-icons/md";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const BRUSH_SIZE = 15;
const MAX_HISTORY = 10;
const ERASER_SIZE = 15;

export default function MainPlayerCanvas({ canvasRef: externalCanvasRef }) {
  const internalRef = useRef(null);
  const canvasRef = externalCanvasRef || internalRef;
  const ctxRef = useRef(null);

  const cPushArray = useRef([]); // Stroke history
  const cStep = useRef(-1); // Index of last drawn stroke
  const previewCanvasRef = useRef(null);

  const [tool, setTool] = useState("pen"); // "pen" | "eraser"
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState(null);

  function cPush() {
    const canvas = canvasRef.current;
    const data = canvas.toDataURL();

    // Prevent duplicate pushes
    if (cPushArray.current[cStep.current] === data) return;

    cStep.current++;
    cPushArray.current.length = cStep.current;
    cPushArray.current.push(data);

    if (cPushArray.current.length > MAX_HISTORY) {
      cPushArray.current.shift();
      cStep.current--;
    }
  }

  function cUndo() {
    if (cStep.current > 0) {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      cStep.current--;
      const canvasPic = new Image();
      canvasPic.src = cPushArray.current[cStep.current];
      canvasPic.onload = function () {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(canvasPic, 0, 0);
      };
    }
  }

  function startDrawing(e) {
    const { offsetX, offsetY } = e.nativeEvent;
    setMousePos({ x: offsetX, y: offsetY });
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  }

  function draw(e) {
    const { offsetX, offsetY } = e.nativeEvent;
    setMousePos({ x: offsetX, y: offsetY });

    if (!isDrawing) return;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  }

  function stopDrawing() {
    ctxRef.current.closePath();
    setIsDrawing(false);
    setMousePos(null);
    cPush();
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    cPush();
  }

  // Clear eraser indicator
  function clearPreview() {
    const preview = previewCanvasRef.current;
    if (!preview) return;

    const ctx = preview.getContext("2d");
    ctx.clearRect(0, 0, preview.width, preview.height);
  }

  // Initialize canvas for eraser indicator
  useEffect(() => {
    const preview = previewCanvasRef.current;
    if (!preview) return;

    // Clear indicator when not erasing or mouse not on canvas
    if (tool !== "eraser" || !mousePos) {
      clearPreview();
      return;
    }

    preview.width = CANVAS_WIDTH;
    preview.height = CANVAS_HEIGHT;

    const ctx = preview.getContext("2d");
    ctx.clearRect(0, 0, preview.width, preview.height);

    ctx.beginPath();
    ctx.arc(mousePos.x, mousePos.y, ERASER_SIZE / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();
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
    cPush();
  }, [canvasRef]);

  // Set whether eraser is active
  useEffect(() => {
    if (!ctxRef.current) return;

    if (tool === "eraser") {
      ctxRef.current.globalCompositeOperation = "source-over";
      ctxRef.current.strokeStyle = "white";
      ctxRef.current.lineWidth = ERASER_SIZE;
    } else {
      ctxRef.current.globalCompositeOperation = "source-over";
      ctxRef.current.strokeStyle = "black";
      ctxRef.current.lineWidth = BRUSH_SIZE;
    }
  }, [tool]);

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
        <button title="Undo" onClick={cUndo} className="action-button active">
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
            stopDrawing();
            clearPreview();
          }}
        />
        <canvas ref={previewCanvasRef} className="preview-canvas" />
      </div>
    </div>
  );
}
