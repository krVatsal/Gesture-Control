import * as Hands from '@mediapipe/hands';

export function initializeMediaPipeHands(canvasRef: { current: any; }) {
  const hands = new Hands.Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });


  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  hands.onResults((results) => {
    drawHands(canvasRef.current, results);
  });

  return () => {
    hands.close();
  };
}

function drawHands(canvas: { getContext: (arg0: string) => any; width: any; height: any; }, results: Hands.Results) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height); 

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      drawLandmarks(ctx, landmarks, { color: 'aqua', lineWidth: 2 });
    }
  }
}

function drawLandmarks(ctx: { strokeStyle: any; lineWidth: any; canvas: { width: number; height: number; }; beginPath: () => void; arc: (arg0: number, arg1: number, arg2: number, arg3: number, arg4: number) => void; fillStyle: any; fill: () => void; stroke: () => void; }, landmarks: string | any[], options: { color: any; lineWidth: any; }) {
  const { color = 'red', lineWidth = 2 } = options;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  for (let i = 0; i < landmarks.length; i++) {
    const point = landmarks[i];


    const x = point.x * ctx.canvas.width;
    const y = point.y * ctx.canvas.height;

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
  }
}