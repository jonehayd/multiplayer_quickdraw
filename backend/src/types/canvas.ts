interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  tool: "eraser" | "pen";
  color: "white" | "black";
  size: number;
  points: Point[];
}

export type CanvasStrokes = Stroke[];

export interface WinningCanvas {
  roundIndex: number;
  playerId: string | null;
  playerName: string | null;
  word: string;
  canvas: CanvasStrokes | null;
}
