import { useEffect, useState, useRef } from "react";
import MainPlayerCanvas from "../ui/main-player-canvas";
import { initInference, predict } from "./inference";
import GuessDisplay from "../ui/guess-display";

export default function TestInference() {
  const [top3, setTop3] = useState([]);
  const preprocessedCanvasRef = useRef(null);

  useEffect(() => {
    initInference().then(() => {
      console.log("Inference initialized!");
    });
  }, []);

  const handlePredict = async (canvas) => {
    const results = await predict(canvas, preprocessedCanvasRef.current);
    setTop3(results);
    console.log(results);
  };

  return (
    <div style={{ display: "flex", gap: "20px", padding: "20px" }}>
      <div>
        <h3>Draw Here</h3>
        <MainPlayerCanvas />
        <button
          onClick={() =>
            handlePredict(document.getElementById("main-player-canvas"))
          }
          style={{ marginTop: "10px" }}
        >
          Predict
        </button>
      </div>
      <GuessDisplay guesses={top3} />
    </div>
  );
}
