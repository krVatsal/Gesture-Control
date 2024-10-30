import { GestureRecognizer, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

export const setupCamera = async (): Promise<[HTMLVideoElement, HTMLCanvasElement]> => {
  console.log("Setting up camera and canvas...");
  
  // Remove any existing containers first
  const existingContainer = document.getElementById("gesture-container");
  if (existingContainer) {
    existingContainer.remove();
  }

  // Create container div
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
  
  // Setup video with proper containment
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
  
  // Create a separate canvas container
  const canvasContainer = document.createElement("div");
  canvasContainer.style.position = "absolute";
  canvasContainer.style.top = "0";
  canvasContainer.style.left = "0";
  canvasContainer.style.width = "100%";
  canvasContainer.style.height = "100%";
  canvasContainer.style.zIndex = "1002";
  canvasContainer.style.border = "3px solid lime";
  canvasContainer.style.pointerEvents = "none";
  
  // Setup canvas with explicit dimensions
  const canvas = document.createElement("canvas");
  canvas.id = "gesture-canvas";
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.transform = "scaleX(-1)";
  canvas.style.pointerEvents = "none";
  
  // Setup gesture label
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
  gestureLabel.style.fontWeight = "bold";
  gestureLabel.style.zIndex = "1003";
  gestureLabel.textContent = "Initializing...";

  // Add elements to containers
  canvasContainer.appendChild(canvas);
  container.appendChild(video);
  container.appendChild(canvasContainer);
  container.appendChild(gestureLabel);
  document.body.appendChild(container);

  // Add debug overlay
  const debugOverlay = document.createElement("div");
  debugOverlay.style.position = "absolute";
  debugOverlay.style.top = "0";
  debugOverlay.style.left = "0";
  debugOverlay.style.width = "100%";
  debugOverlay.style.padding = "4px";
  debugOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  debugOverlay.style.color = "white";
  debugOverlay.style.fontSize = "12px";
  debugOverlay.style.zIndex = "1004";
  debugOverlay.id = "debug-overlay";
  container.appendChild(debugOverlay);

  try {
    console.log("Requesting camera access...");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user"
      },
      audio: false
    });
    
    video.srcObject = stream;
    await video.play();
    
    // Set canvas dimensions after video is playing
    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log(`Canvas dimensions set to: ${canvas.width}x${canvas.height}`);
        
        // Update debug overlay
        const debugOverlay = document.getElementById("debug-overlay");
        if (debugOverlay) {
          debugOverlay.textContent = `Video: ${video.videoWidth}x${video.videoHeight}, Canvas: ${canvas.width}x${canvas.height}`;
        }
        resolve();
      };
    });

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
    onGestureDetected: (gesture: string, handedness: string, x: number, y: number) => void
  ) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      console.error("Could not get canvas context");
      return;
    }
  
    const drawingUtils = new DrawingUtils(ctx);
  
    const detectGestures = async () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      try {
        const results = await gestureRecognizer.recognizeForVideo(video, Date.now());
  
        if (results.landmarks) {
          for (const landmarks of results.landmarks) {
            drawingUtils.drawConnectors(
              landmarks,
              GestureRecognizer.HAND_CONNECTIONS,
              { color: "#00FF00", lineWidth: 5 }
            );
  
            drawingUtils.drawLandmarks(landmarks, {
              color: "#FF0000", lineWidth: 2, radius: 8, fillColor: "#FFFFFF"
            });
          }
        }
  
        const label = document.getElementById("gesture-label");
        if (results.gestures.length > 0) {
          const gesture = results.gestures[0][0].categoryName;
          if (label) {
            label.textContent = `Detected: ${gesture}`;
          }
  
          if (results.landmarks.length > 0) {
            const handedness = results.handedness[0][0].categoryName;
            const landmarks = results.landmarks[0];
            const x = landmarks[8].x * window.innerWidth;
            const y = landmarks[8].y * window.innerHeight;
            onGestureDetected(gesture, handedness, x, y);
          }
        } else {
          if (label) {
            label.textContent = "No gesture detected";
          }
        }
      } catch (error) {
        console.error("Error in frame processing:", error);
      }
  
      requestAnimationFrame(detectGestures);
    };
  
    detectGestures();
  };
  
// Initialize MediaPipe with debug logging
export const initializeGestureRecognition = async (): Promise<GestureRecognizer> => {
  console.log("Initializing MediaPipe...");
  
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  console.log("FilesetResolver initialized");
  
  const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 1
  });
  console.log("GestureRecognizer created");

  return gestureRecognizer;
};

// React hook with debug logging
export const useGestureControls = (
  setActiveTool: (tool: string) => void,
  handleMouseDown: (e: any) => void,
  handleMouseMove: (e: any) => void,
  handleMouseUp: (e: any) => void
) => {
  const gestureState = {
    isInitialized: false,
    gestureRecognizer: null,
    videoElement: null,
    lastGesture: "",
    drawingMode: false
  };

  const initializeGestureControls = async () => {
    try {
      console.log("Initializing gesture controls...");
      
      // Initialize gesture recognizer
      gestureState.gestureRecognizer = await initializeGestureRecognition();
      
      // Setup camera and canvas
      const [video, canvas] = await setupCamera();
      gestureState.videoElement = video;
      
      // Wait for video to be ready
      await new Promise((resolve) => {
try {
            if (gestureState.videoElement) {
              gestureState.videoElement.onloadeddata = () => {
                console.log("Video ready");
                resolve(true);
              };
            }
} catch (error) {
    console.error("failed to get video ready")
}
      });

      gestureState.isInitialized = true;
      console.log("Gesture controls initialized");

      const handleGesture = (gesture: string, handedness: string, x: number, y: number) => {
        console.log(`Gesture detected: ${gesture}, Hand: ${handedness}, Position: (${x}, ${y})`);
        
        const action = mapGestureToAction(gesture, handedness, x, y);
        if (!action) return;

        if (action.tool !== undefined) {
          setActiveTool(action.tool);
        }

        const eventInit = {
          bubbles: true,
          clientX: x,
          clientY: y,
          nativeEvent: { offsetX: x, offsetY: y }
        };

        if (gesture === "Closed_Fist" && !gestureState.drawingMode) {
          gestureState.drawingMode = true;
          handleMouseDown(new MouseEvent("mousedown", eventInit));
        } else if (gesture === "Open_Palm" && gestureState.drawingMode) {
          gestureState.drawingMode = false;
          handleMouseUp(new MouseEvent("mouseup", eventInit));
        } else if (gestureState.drawingMode) {
          handleMouseMove(new MouseEvent("mousemove", eventInit));
        }

        gestureState.lastGesture = gesture;
      };

      if (gestureState.gestureRecognizer && gestureState.videoElement) {
        processFrame(
          gestureState.gestureRecognizer,
          gestureState.videoElement,
          canvas,
          handleGesture
        );
      }
    } catch (error) {
      console.error("Error in initializeGestureControls:", error);
    }
  };

  return { initializeGestureControls };
};

// Keep original mapGestureToAction function
export const mapGestureToAction = (
  gesture: string,
  handedness: string,
  x: number,
  y: number
) => {
  const actions = {
    "Thumb_Up": () => ({
      tool: "pointer",
      action: "select"
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
    }),
    "Pointing_Up": () => ({
      tool: "text",
      action: "text"
    })
  };

  return actions[gesture] ? actions[gesture]() : null;
};