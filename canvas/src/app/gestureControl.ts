import { GestureRecognizer, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

// Setup camera types and exports
interface CameraSetup {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
}

// Types for gesture handling
export interface GestureAction {
  tool?: string;
  action?: string;
}

interface DrawingState {
  isDrawing: boolean;
  lastX: number;
  lastY: number;
  currentShape: Shape | null;
  startX: number;
  startY: number;
  shapes: Shape[];  // Store all shapes
}

interface Shape {
  type: string;
  points?: { x: number; y: number }[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  x3?: number;
  y3?: number;
  text?: string;
  color?: string;
}


export type GestureHandler = (gesture: string, handedness: string, x: number, y: number) => void;

export const setupCamera = async (): Promise<[HTMLVideoElement, HTMLCanvasElement]> => {
  console.log("Setting up camera and canvas...");
  
  // Remove any existing containers first
  const existingContainer = document.getElementById("gesture-container");
  if (existingContainer) {
    existingContainer.remove();
  }

  const container = document.createElement("div");
  container.id = "gesture-container";
  container.style.position = "fixed";
  container.style.top = "20px";
  container.style.left = "20px";
  container.style.width = "320px";
  container.style.height = "240px";
  container.style.border = "3px solid red";
  container.style.overflow = "hidden";
  container.style.zIndex = "1000";
  
  const video = document.createElement("video");
  video.id = "gesture-video";
  video.style.position = "absolute";
  video.style.top = "0";
  video.style.left = "0";
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.transform = "scaleX(-1)";
  video.style.objectFit = "cover";
  video.style.zIndex = "1001";
  
  const canvasContainer = document.createElement("div");
  canvasContainer.style.position = "absolute";
  canvasContainer.style.top = "0";
  canvasContainer.style.left = "0";
  canvasContainer.style.width = "100%";
  canvasContainer.style.height = "100%";
  canvasContainer.style.zIndex = "1002";
  
  const canvas = document.createElement("canvas");
  canvas.id = "gesture-canvas";
  canvas.width = 320;
  canvas.height = 240;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.transform = "scaleX(-1)";
  
  const gestureLabel = document.createElement("div");
  gestureLabel.id = "gesture-label";
  gestureLabel.style.position = "absolute";
  gestureLabel.style.bottom = "0";
  gestureLabel.style.left = "0";
  gestureLabel.style.width = "100%";
  gestureLabel.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  gestureLabel.style.color = "#ffffff";
  gestureLabel.style.padding = "8px";
  gestureLabel.style.textAlign = "center";
  gestureLabel.style.fontSize = "16px";
  gestureLabel.style.zIndex = "1003";
  gestureLabel.textContent = "Initializing...";

  // Create drawing canvas
  const drawingCanvas = document.createElement("canvas");
  drawingCanvas.id = "drawing-canvas";
  drawingCanvas.width = window.innerWidth;
  drawingCanvas.height = window.innerHeight;
  drawingCanvas.style.position = "fixed";
  drawingCanvas.style.top = "0";
  drawingCanvas.style.left = "0";
  drawingCanvas.style.zIndex = "999";
  drawingCanvas.style.pointerEvents = "none";

  canvasContainer.appendChild(canvas);
  container.appendChild(video);
  container.appendChild(canvasContainer);
  container.appendChild(gestureLabel);
  document.body.appendChild(container);
  document.body.appendChild(drawingCanvas);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        width: { ideal: 320 },
        height: { ideal: 240 },
        facingMode: "user"
      },
      audio: false
    });
    
    video.srcObject = stream;
    await video.play();

    return [video, canvas];
  } catch (error) {
    console.error("Error accessing camera:", error);
    throw error;
  }
};

export const processFrame = async (
  gestureRecognizer: GestureRecognizer,
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  onGestureDetected: GestureHandler,
  currentTool: string,
  currentColor: string,
  saveShape: (shape: Shape) => void  // Add saveShape parameter
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const drawingUtils = new DrawingUtils(ctx);
  
  // Initialize drawing state with additional properties
  const drawingState: DrawingState = {
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    currentShape: null,
    startX: 0,
    startY: 0,
    shapes: []  // Store all shapes
  };

  // Get drawing canvas context
  const drawingCanvas = document.getElementById('drawing-canvas') as HTMLCanvasElement;
  const drawingCtx = drawingCanvas.getContext('2d');

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.strokeStyle = shape.color || currentColor;
    ctx.lineWidth = 2;
    ctx.fillStyle = `${shape.color || currentColor}33`;

    switch (shape.type) {
      case "pencil":
        if (shape.points && shape.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++) {
            ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          ctx.stroke();
        }
        break;
      case "rectangle":
        const width = shape.x2! - shape.x1!;
        const height = shape.y2! - shape.y1!;
        ctx.strokeRect(shape.x1!, shape.y1!, width, height);
        ctx.fillRect(shape.x1!, shape.y1!, width, height);
        break;
      case "circle":
        const radius = Math.sqrt(
          Math.pow(shape.x2! - shape.x1!, 2) + Math.pow(shape.y2! - shape.y1!, 2)
        );
        ctx.beginPath();
        ctx.arc(shape.x1!, shape.y1!, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
        break;
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(shape.x1!, shape.y1!);
        ctx.lineTo(shape.x2!, shape.y2!);
        ctx.lineTo(
          shape.x1! + (shape.x2! - shape.x1!) / 2,
          shape.y1! - Math.abs(shape.x2! - shape.x1!)
        );
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        break;
    }
  };

  const detectGestures = async () => {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      const results = await gestureRecognizer.recognizeForVideo(video, performance.now());
      
      if (results.landmarks) {
        for (const landmarks of results.landmarks) {
          drawingUtils.drawConnectors(
            landmarks,
            GestureRecognizer.HAND_CONNECTIONS,
            { color: "#00FF00", lineWidth: 2 }
          );
          drawingUtils.drawLandmarks(landmarks, {
            color: "#FF0000",
            lineWidth: 1,
            radius: 4
          });

          // Get index finger tip position (landmark 8)
          const indexTip = landmarks[8];
          const x = indexTip.x * window.innerWidth;
          const y = indexTip.y * window.innerHeight;

          // Handle drawing based on current tool
          if (drawingState.isDrawing && drawingCtx) {
            if (!drawingState.currentShape) {
              // Initialize new shape when starting to draw
              drawingState.currentShape = {
                type: currentTool,
                x1: x,
                y1: y,
                color: currentColor,
                points: currentTool === 'pencil' ? [{ x, y }] : undefined
              };
              drawingState.startX = x;
              drawingState.startY = y;
            } else {
              // Update shape based on current position
              switch (currentTool) {
                case 'pencil':
                  if (drawingState.currentShape.points) {
                    drawingState.currentShape.points.push({ x, y });
                  }
                  break;
                case 'rectangle':
                case 'circle':
                case 'triangle':
                  drawingState.currentShape.x2 = x;
                  drawingState.currentShape.y2 = y;
                  break;
              }

              // Clear canvas and redraw shape
              drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
              drawShape(drawingCtx, drawingState.currentShape);
            }
          }

          drawingState.lastX = x;
          drawingState.lastY = y;
        }
      }

      if (results.gestures && results.gestures.length > 0) {
        const gesture = results.gestures[0][0].categoryName;
        const label = document.getElementById("gesture-label");
        
        // Toggle drawing mode based on gestures
        if (gesture === "Pointing_Up" && !drawingState.isDrawing) {
          drawingState.isDrawing = true;
          drawingState.currentShape = null;
          if (label) label.textContent = `Drawing Mode: ON (${currentTool})`;
        } else if (gesture === "Open_Palm" && drawingState.isDrawing) {
          drawingState.isDrawing = false;
          if (drawingState.currentShape) {
            // Save the completed shape
            saveShape(drawingState.currentShape);
            drawingState.currentShape = null;
          }
          if (label) label.textContent = "Drawing Mode: OFF";
        }

        if (label) {
          label.textContent = `Detected: ${gesture} (${results.gestures[0][0].score.toFixed(2)})${
            drawingState.isDrawing ? ` - Drawing Mode: ON (${currentTool})` : ''
          }`;
        }

        if (results.landmarks && results.landmarks.length > 0) {
          const handedness = results.handedness[0][0].categoryName;
          const landmarks = results.landmarks[0];
          const x = landmarks[8].x * canvas.width;
          const y = landmarks[8].y * canvas.height;
          onGestureDetected(gesture, handedness, x, y);
        }
      }
    } catch (error) {
      console.error("Error in gesture recognition:", error);
    }

    requestAnimationFrame(detectGestures);
  };

  detectGestures();
};

export const initializeGestureRecognition = async (): Promise<GestureRecognizer> => {
  console.log("Initializing MediaPipe...");
  
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  
  const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 1,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  return gestureRecognizer;
};

export const mapGestureToAction = (
  gesture: string,
  handedness: string,
  x: number,
  y: number
): GestureAction | null => {
  const actions: Record<string, () => GestureAction> = {
    "Thumb_Up": () => ({
      tool: "pencil",
      action: "draw"
    }),
    "Closed_Fist": () => ({
      tool: "rectangle",
      action: "draw"
    }),
    "Open_Palm": () => ({
      tool: "erase",
      action: "erase"
    }),
    "Victory": () => ({
      tool: "circle",
      action: "draw"
    }),
    "ILoveYou": () => ({
      tool: "triangle",
      action: "draw"
    })
  };

  return actions[gesture] ? actions[gesture]() : null;
};
export const useGestureControls = (
  setActiveTool: (tool: string) => void,
  handleMouseDown: (e: MouseEvent) => void,
  handleMouseMove: (e: MouseEvent) => void,
  handleMouseUp: (e: MouseEvent) => void,
  currentTool: string,
  currentColor: string,
  saveShape: (shape: Shape) => void,
  shapes: Shape[]
) => {
  const gestureState = {
    // Initialization states
    isInitialized: false,
    gestureRecognizer: null as GestureRecognizer | null,
    videoElement: null as HTMLVideoElement | null,
    
    // Drawing states
    drawingMode: false,
    isDrawing: false,
    isDragging: false,
    
    // Position tracking
    startPos: { x: 0, y: 0 },
    lastPos: { x: 0, y: 0 },
    
    // Shape tracking
    currentShape: null as Shape | null,
    currentPath: [] as Point[],
    
    // Tool states
    lastGesture: "",
    currentTool: "",
    currentColor: "",
    
    // Parameters
    lineWidth: 2,
    params: {
      activeTool: "",
      currentColor: ""
    }
  };


  const initializeGestureControls = async () => {
    try {
      console.log("Initializing gesture controls...");
      
      gestureState.gestureRecognizer = await initializeGestureRecognition();
      
      const [video, canvas] = await setupCamera();
      gestureState.videoElement = video;
      
      if (gestureState.gestureRecognizer && video) {
        processFrame(
          gestureState.gestureRecognizer,
          video,
          canvas,
          (gesture: string, handedness: string, x: number, y: number) => {
            console.log(`Gesture detected: ${gesture}, Hand: ${handedness}, Position: (${x}, ${y})`);
            
            const action = mapGestureToAction(gesture, handedness, x, y);
            if (!action) return;
      
            if (action.tool) {
              setActiveTool(action.tool);
            }
      
            const eventInit = {
              clientX: x,
              clientY: y,
              bubbles: true
            };
      
            // Start drawing with closed fist
            if (gesture === "Closed_Fist" && !gestureState.drawingMode) {
              gestureState.drawingMode = true;
              gestureState.startPos = { x, y };
              handleMouseDown(new MouseEvent("mousedown", eventInit));
            } 
            // Continue drawing while moving
            else if (gestureState.drawingMode) {
              handleMouseMove(new MouseEvent("mousemove", eventInit));
              
              // Update current shape based on tool
              if (!gestureState.currentShape) {
                gestureState.currentShape = {
                  type: action.tool || currentTool,
                  x1: gestureState.startPos.x,
                  y1: gestureState.startPos.y,
                  color: currentColor,
                  points: action.tool === 'pencil' ? [{ x, y }] : undefined
                };
              } else if (action.tool === 'pencil' && gestureState.currentShape.points) {
                gestureState.currentShape.points.push({ x, y });
              } else {
                gestureState.currentShape.x2 = x;
                gestureState.currentShape.y2 = y;
              }
            }
            // End drawing with open palm
            else if (gesture === "Open_Palm" && gestureState.drawingMode) {
              gestureState.drawingMode = false;
              handleMouseUp(new MouseEvent("mouseup", eventInit));
              
              if (gestureState.currentShape) {
                saveShape(gestureState.currentShape);
                gestureState.currentShape = null;
              }
            }
      
            gestureState.lastGesture = gesture;
          },
          currentTool,
          currentColor,
          saveShape
        );
      }
      const onGestureDetected: GestureHandler = (gesture, handedness, x, y) => {
        const action = mapGestureToAction(gesture, handedness, x, y);
        if (action) {
          setActiveTool(action.tool || "");
  
          if (action.action === "draw") {
            const newShape: Shape = {
              type: action.tool || "",
              x1: x,
              y1: y,
              x2: x + 50, // Example values, adjust as needed
              y2: y + 50,
              color: currentColor
            };
            setShapes([...shapes, newShape]); // Update shapes state
          }
        }
      };
    } catch (error) {
      console.error("Error in initializeGestureControls:", error);
    }
  };

  return { initializeGestureControls };
};