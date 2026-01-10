import * as ort from "onnxruntime-web";

let CLASS_NAMES = [];
let session = null;

export async function initInference() {
  ort.env.wasm.wasmPaths = "/";

  const classRes = await fetch("/selected_categories.txt");
  CLASS_NAMES = (await classRes.text()).trim().split("\n");

  const modelBuffer = await (await fetch("/quickdraw.onnx")).arrayBuffer();
  const externalDataBuffer = await (
    await fetch("/quickdraw.onnx.data")
  ).arrayBuffer();

  session = await ort.InferenceSession.create(modelBuffer, {
    executionProviders: ["wasm"],
    externalData: [
      {
        data: externalDataBuffer,
        path: "quickdraw.onnx.data",
      },
    ],
  });
}

function getCanvasTensor(canvas, previewCanvas = null) {
  const SIZE = 28;
  const ctx = canvas.getContext("2d");
  const { data, width, height } = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );

  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (gray < 250) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const padding = 20;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width, maxX + padding);
  maxY = Math.min(height, maxY + padding);

  const cropW = maxX - minX;
  const cropH = maxY - minY;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = SIZE;
  tempCanvas.height = SIZE;
  const tempCtx = tempCanvas.getContext("2d");

  tempCtx.fillStyle = "white";
  tempCtx.fillRect(0, 0, SIZE, SIZE);

  const scale = Math.min(SIZE / cropW, SIZE / cropH);
  const drawW = cropW * scale;
  const drawH = cropH * scale;

  tempCtx.drawImage(
    canvas,
    minX,
    minY,
    cropW,
    cropH,
    (SIZE - drawW) / 2,
    (SIZE - drawH) / 2,
    drawW,
    drawH
  );

  const pixels = tempCtx.getImageData(0, 0, SIZE, SIZE).data;
  const tensorData = new Float32Array(SIZE * SIZE);
  const THRESHOLD = 0.05;

  for (let i = 0; i < SIZE * SIZE; i++) {
    const gray = (pixels[i * 4] + pixels[i * 4 + 1] + pixels[i * 4 + 2]) / 3;
    const inverted = 1 - gray / 255;
    tensorData[i] = inverted > THRESHOLD ? 1 : 0;
  }
  // Preview canvas for the preprocessed image to see if something is wrong
  //   if (previewCanvas) {
  //     const pctx = previewCanvas.getContext("2d");
  //     pctx.imageSmoothingEnabled = false;

  //     const img = pctx.createImageData(SIZE, SIZE);
  //     for (let i = 0; i < SIZE * SIZE; i++) {
  //       const v = tensorData[i] * 255;
  //       img.data.set([v, v, v, 255], i * 4);
  //     }

  //     const vis = document.createElement("canvas");
  //     vis.width = SIZE;
  //     vis.height = SIZE;
  //     vis.getContext("2d").putImageData(img, 0, 0);

  //     pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  //     pctx.drawImage(vis, 0, 0, previewCanvas.width, previewCanvas.height);
  //   }

  return new ort.Tensor("float32", tensorData, [1, 1, SIZE, SIZE]);
}

function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((x) => x / sum);
}

function getTop3(logits) {
  return softmax(Array.from(logits))
    .map((p, i) => ({ i, p }))
    .sort((a, b) => b.p - a.p)
    .slice(0, 3)
    .map(({ i, p }) => ({
      label: CLASS_NAMES[i],
      confidence: (p * 100).toFixed(2),
    }));
}

export async function predict(canvas, previewCanvas = null) {
  if (!session) {
    throw new Error("initInference() must be called first.");
  }

  const tensor = getCanvasTensor(canvas, previewCanvas);
  const { output } = await session.run({ input: tensor });
  return getTop3(output.data);
}
