"use client";
import React, { useState, useRef,useMemo ,useEffect, MouseEvent } from "react";
import { useGestureControls } from "./gestureControl";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession,signOut } from "next-auth/react";
import {
  FiLock,
  FiMove,
  FiMousePointer,
  FiSquare,
  FiCircle,
  FiTriangle,
  FiArrowRight,
  FiEdit3,
} from "react-icons/fi";
import { TbTextResize, TbPalette, TbEraser,TbPencil } from "react-icons/tb";
import { CgProfile } from "react-icons/cg";
import { ChromePicker } from "react-color";
import { useRouter } from "next/navigation";
type Shape = {
  type: string;
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
  img?: HTMLImageElement;
  locked?: boolean;
  points?: Point[]; // For pencil strokes
  lineWidth?: number; 
};

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="h-screen bg-gray-900 flex flex-col text-white">{children}</div>
);

const Toolbar = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-gray-800 flex p-2 justify-center gap-4 rounded-lg m-2">
    {children}
  </div>
);

const IconButton = ({
  active,
  onClick,
  children,
  style,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <button
    className={` hover:bg-gray-600 p-2 rounded ${
      active ? "bg-amber-500" : "bg-gray-700"
    }`}
    onClick={onClick}
    style={style}
  >
    {children}
  </button>
);

const CanvasArea = ({ children }: { children: React.ReactNode }) => (
  <div className="flex-grow border-2 border-dashed border-gray-600 flex justify-center items-center relative">
    {children}
  </div>
);

const HintText = ({ children }: { children: React.ReactNode }) => (
  <p className="text-gray-500 text-sm absolute bottom-5">{children}</p>
);

const Canvas = React.forwardRef<HTMLCanvasElement>((props, ref) => (
  <canvas
    ref={ref}
    className="border-2 border-solid border-gray-500 w-full h-full"
    {...props}
  />
));

Canvas.displayName = "Canvas";

const useAutoSave = (shapes: Shape[], session: any) => {
  useEffect(() => {
    const saveCanvas = async () => {
      if (session?.user && shapes.length > 0) {
        try {
          const response = await fetch(`/api/canvas/save?userEmail=${session.user.email}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shapes })
          });
          const res = await response.json();
          if (response.status !== 200) {
            throw new Error(res.message || "Failed to save canvas");
          }
        } catch (error) {
          console.error("Failed to save canvas:", error);
        }
      }
    };

    const timer = setTimeout(saveCanvas, 5000);
    return () => clearTimeout(timer);
  }, [shapes, session]);
};

const useLoadCanvas = (session: any, setShapes: (shapes: Shape[]) => void) => {
  useEffect(() => {
    const loadCanvas = async () => {
      if (session?.user) {
        try {
          const response = await fetch(`/api/canvas/loader?userEmail=${session.user.email}`);
          const data = await response.json();
          if (data.status !== 200) throw new Error("Failed to load canvas");
          setShapes(data.canvas.shapes);
        } catch (error) {
          console.error("Failed to load canvas:", error);
        }
      }
    };

    loadCanvas();
  }, [session, setShapes]);
};

const App = () => {
  const router= useRouter()
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [currentColor, setCurrentColor] = useState("#ffffff");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [history, setHistory] = useState<Shape[][]>([]); // History for undo functionality
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [lineWidth, setLineWidth] = useState(2);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { data: session, status } = useSession();
  const memoizedValues = React.useMemo(() =>({ shapes,session}), [shapes,session])
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctxRef.current = context;
        redrawCanvas();
      }
    }
  }, [shapes, currentColor]);
  useAutoSave(shapes, session);
  useLoadCanvas(session, setShapes);

   // Add shapes to history when they change
   useEffect(() => {
    if (shapes.length > 0) {
      setHistory(prev => [...prev, [...shapes]]);
    }
  }, [shapes]);

  const redrawCanvas = () => {
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      shapes.forEach((shape) => {
        if (!shape.locked) {
          drawShape(ctx, shape);
        }
      });

      // Highlight selected shape
      if (selectedShape) {
        const shape = shapes.find(s => s === selectedShape);
        if (shape) {
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 2;
          drawSelectionBox(ctx, shape);
        }
      }
    }
  };

  //draw selection box

  const drawSelectionBox = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.strokeStyle = '#00ff00'; // Selection highlight color
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]); // Create dashed line effect for selection
  
    switch (shape.type) {
      case "rectangle":
        // Draw dashed rectangle around the shape with padding
        ctx.strokeRect(
          shape.x! - 4, 
          shape.y! - 4, 
          shape.width! + 8, 
          shape.height! + 8
        );
        // Draw resize handles
        drawResizeHandles(ctx, shape.x!, shape.y!, shape.width!, shape.height!);
        break;
  
      case "circle":
        // Draw dashed circle around the shape with padding
        ctx.beginPath();
        ctx.arc(shape.x!, shape.y!, shape.radius! + 4, 0, Math.PI * 2);
        ctx.stroke();
        // Draw center point
        drawCenterPoint(ctx, shape.x!, shape.y!);
        break;
  
      case "triangle":
        // Draw dashed outline around triangle
        ctx.beginPath();
        // Calculate bounding box
        const minX = Math.min(shape.x1!, shape.x2!, shape.x3!) - 4;
        const minY = Math.min(shape.y1!, shape.y2!, shape.y3!) - 4;
        const maxX = Math.max(shape.x1!, shape.x2!, shape.x3!) + 4;
        const maxY = Math.max(shape.y1!, shape.y2!, shape.y3!) + 4;
        // Draw selection rectangle
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        // Draw vertices
        drawVertexHandles(ctx, [
          { x: shape.x1!, y: shape.y1! },
          { x: shape.x2!, y: shape.y2! },
          { x: shape.x3!, y: shape.y3! }
        ]);
        break;
  
      case "arrow":
        // Draw dashed line parallel to arrow
        ctx.beginPath();
        ctx.moveTo(shape.x1! - 4, shape.y1! - 4);
        ctx.lineTo(shape.x2! + 4, shape.y2! + 4);
        ctx.stroke();
        // Draw endpoint handles
        drawEndpointHandles(ctx, shape.x1!, shape.y1!, shape.x2!, shape.y2!);
        break;
  
      case "text":
        // Get text metrics
        ctx.font = "20px Arial";
        const metrics = ctx.measureText(shape.text!);
        // Draw dashed rectangle around text
        ctx.strokeRect(
          shape.x! - 4,
          shape.y! - 24, // Adjust for text height
          metrics.width + 8,
          28 // Approximate text height + padding
        );
        break;
  
      case "image":
        // Draw dashed rectangle around image
        if (shape.img) {
          ctx.strokeRect(
            shape.x! - 4,
            shape.y! - 4,
            shape.img.width + 8,
            shape.img.height + 8
          );
          drawResizeHandles(ctx, shape.x!, shape.y!, shape.img.width, shape.img.height);
        }
        break;
    }
  
    // Reset line style
    ctx.setLineDash([]);
  };
  
  // Helper function to draw resize handles
  const drawResizeHandles = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    const handleSize = 8;
    const handles = [
      { x: x - handleSize/2, y: y - handleSize/2 }, // Top-left
      { x: x + width/2 - handleSize/2, y: y - handleSize/2 }, // Top-middle
      { x: x + width - handleSize/2, y: y - handleSize/2 }, // Top-right
      { x: x - handleSize/2, y: y + height/2 - handleSize/2 }, // Middle-left
      { x: x + width - handleSize/2, y: y + height/2 - handleSize/2 }, // Middle-right
      { x: x - handleSize/2, y: y + height - handleSize/2 }, // Bottom-left
      { x: x + width/2 - handleSize/2, y: y + height - handleSize/2 }, // Bottom-middle
      { x: x + width - handleSize/2, y: y + height - handleSize/2 } // Bottom-right
    ];
  
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#00ff00';
    handles.forEach(handle => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
  };
  
  // Helper function to draw vertex handles for triangle
  const drawVertexHandles = (ctx: CanvasRenderingContext2D, vertices: Array<{x: number, y: number}>) => {
    const handleSize = 8;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#00ff00';
    
    vertices.forEach(vertex => {
      ctx.fillRect(vertex.x - handleSize/2, vertex.y - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(vertex.x - handleSize/2, vertex.y - handleSize/2, handleSize, handleSize);
    });
  };
  
  // Helper function to draw endpoint handles for arrows
  const drawEndpointHandles = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const handleSize = 8;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#00ff00';
    
    // Start point handle
    ctx.fillRect(x1 - handleSize/2, y1 - handleSize/2, handleSize, handleSize);
    ctx.strokeRect(x1 - handleSize/2, y1 - handleSize/2, handleSize, handleSize);
    
    // End point handle
    ctx.fillRect(x2 - handleSize/2, y2 - handleSize/2, handleSize, handleSize);
    ctx.strokeRect(x2 - handleSize/2, y2 - handleSize/2, handleSize, handleSize);
  };
  
  // Helper function to draw center point for circles
  const drawCenterPoint = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const handleSize = 8;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#00ff00';
    
    ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
    ctx.strokeRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
  };


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
        ctx.strokeRect(shape.x!, shape.y!, shape.width!, shape.height!);
        ctx.fillRect(shape.x!, shape.y!, shape.width!, shape.height!);
        break;
      case "circle":
        ctx.beginPath();
        ctx.arc(shape.x!, shape.y!, shape.radius!, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
        break;
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(shape.x1!, shape.y1!);
        ctx.lineTo(shape.x2!, shape.y2!);
        ctx.lineTo(shape.x3!, shape.y3!);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        break;
      case "arrow":
        drawArrow(ctx, shape.x1!, shape.y1!, shape.x2!, shape.y2!, shape.color || currentColor);
        break;
      case "text":
        ctx.font = "20px Arial";
        ctx.fillStyle = shape.color || currentColor;
        ctx.fillText(shape.text!, shape.x!, shape.y!);
        break;


      default:
        break;
    }
  };


  const drawArrow = (ctx: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number, color: string) => {
    const headlen = 10;
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    setStartPos({ x: offsetX, y: offsetY });

    if (activeTool === "pencil") {
      setIsDrawing(true);
      setCurrentPath([{ x: offsetX, y: offsetY }]);
    }
    else if (activeTool === "pointer") {
      const clickedShape = shapes.find((shape) =>
        isPointInShape(shape, offsetX, offsetY)
      );
      setSelectedShape(clickedShape || null);
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = e.nativeEvent;
    if (isDrawing && activeTool === "pencil") {
      setCurrentPath(prev => [...prev, { x: offsetX, y: offsetY }]);
      
      // Draw the current stroke
      const ctx = ctxRef.current;
      if (ctx) {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        // Redraw the canvas
        redrawCanvas();
        
        // Draw the current path
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        currentPath.forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
      }
    } else if (isDragging && selectedShape) {
      const dx = offsetX - startPos.x;
      const dy = offsetY - startPos.y;
      
      setShapes(prevShapes =>
        prevShapes.map((shape) =>
          shape === selectedShape ? moveShape(shape, dx, dy) : shape
        )
      );
      setStartPos({ x: offsetX, y: offsetY });
    } else if (isDrawing && activeTool !== "pointer" && activeTool !== "pencil") {
      redrawCanvas();

    }
  };

  const handleMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    const { offsetX, offsetY } = e.nativeEvent;
    if (isDrawing && activeTool === "pencil" && currentPath.length > 0) {
      const newShape: Shape = {
        type: "pencil",
        points: [...currentPath, { x: offsetX, y: offsetY }],
        color: currentColor,
        lineWidth: lineWidth
      };
      setShapes(prev => [...prev, newShape]);
      setCurrentPath([]);
    } else if (isDragging) {
      setIsDragging(false);
    } else if (isDrawing) {
      let newShape: Shape | null = null;

    if (activeTool === "erase") {
      setShapes(shapes.filter(shape => !isPointInShape(shape, offsetX, offsetY)));
      return;
    }

    if (activeTool === "rectangle") {
      const width = offsetX - startPos.x;
      const height = offsetY - startPos.y;
      newShape = { type: "rectangle", x: startPos.x, y: startPos.y, width, height, color: currentColor };
    } else if (activeTool === "circle") {
      const radius = Math.sqrt(
        Math.pow(offsetX - startPos.x, 2) + Math.pow(offsetY - startPos.y, 2)
      );
      newShape = { type: "circle", x: startPos.x, y: startPos.y, radius, color: currentColor };
    } else if (activeTool === "triangle") {
      newShape = {
        type: "triangle",
        x1: startPos.x,
        y1: startPos.y,
        x2: offsetX,
        y2: startPos.y,
        x3: (startPos.x + offsetX) / 2,
        y3: offsetY,
        color: currentColor
      };
    } else if (activeTool === "arrow") {
      newShape = {
        type: "arrow",
        x1: startPos.x,
        y1: startPos.y,
        x2: offsetX,
        y2: offsetY,
        color: currentColor
      };
    } else if (activeTool === "text") {
      const text = prompt("Enter text:") || "";
      newShape = { type: "text", x: offsetX, y: offsetY, text, color: currentColor };
    } else if (activeTool === "image") {
      const img = new Image();
      img.src = "https://via.placeholder.com/150";
      newShape = { type: "image", x: offsetX, y: offsetY, img, color: currentColor };
    }
    if (newShape) {
      setShapes(prev => [...prev, newShape]);
    }
  }

  setIsDrawing(false);
  redrawCanvas();
  };

  const isPointInShape = (shape: Shape, x: number, y: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return false;

    switch (shape.type) {
      case "pencil":
        if (!shape.points) return false;
        
        // Check if point is near any point in the path
        const threshold = 5; // Detection threshold in pixels
        return shape.points.some((point, i) => {
          if (i === 0) return false;
          
          // Check if point is near the line segment
          const x1 = shape.points![i - 1].x;
          const y1 = shape.points![i - 1].y;
          const x2 = point.x;
          const y2 = point.y;
          
          // Calculate distance from point to line segment
          const A = x - x1;
          const B = y - y1;
          const C = x2 - x1;
          const D = y2 - y1;
          
          const dot = A * C + B * D;
          const len_sq = C * C + D * D;
          let param = -1;
          
          if (len_sq !== 0) param = dot / len_sq;
          
          let xx, yy;
          
          if (param < 0) {
            xx = x1;
            yy = y1;
          } else if (param > 1) {
            xx = x2;
            yy = y2;
          } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
          }
          
          const dx = x - xx;
          const dy = y - yy;
          
          return Math.sqrt(dx * dx + dy * dy) < threshold;
        });
      case "rectangle":
        return (
          x >= shape.x! &&
          x <= shape.x! + shape.width! &&
          y >= shape.y! &&
          y <= shape.y! + shape.height!
        );
      case "circle":
        const dx = x - shape.x!;
        const dy = y - shape.y!;
        return dx * dx + dy * dy <= shape.radius! * shape.radius!;
      case "triangle":
        const area = Math.abs(
          (shape.x1! * (shape.y2! - shape.y3!) +
            shape.x2! * (shape.y3! - shape.y1!) +
            shape.x3! * (shape.y1! - shape.y2!)) /
            2
        );
        const a =
          (shape.x1! * (shape.y2! - y) +
            shape.x2! * (y - shape.y1!) +
            x * (shape.y1! - shape.y2!)) /
          2;
        const a1 = a < 0 ? -a : a;
        const a2 = area - a1;
        return a1 >= 0 && a2 >= 0;
      case "arrow":
        // Simplified arrow hit test
        return (
          Math.abs(x - shape.x1!) < 10 &&
          Math.abs(y - shape.y1!) < 10
        );
      case "text":
        ctx.font = "20px Arial";
        const metrics = ctx.measureText(shape.text!);
        return (
          x >= shape.x! &&
          x <= shape.x! + metrics.width &&
          y >= shape.y! - 20 &&
          y <= shape.y!
        );
      default:
        return false;
    }
  };

  const moveShape = (shape: Shape, dx: number, dy: number): Shape => {
    if (shape.type === "pencil") {
      return {
        ...shape,
        points: shape.points!.map(point => ({
          x: point.x + dx,
          y: point.y + dy
        }))
      };
    }
    if (shape.type === "rectangle") {
      return { ...shape, x: shape.x! + dx, y: shape.y! + dy };
    } else if (shape.type === "circle") {
      return { ...shape, x: shape.x! + dx, y: shape.y! + dy };
    } else if (shape.type === "triangle") {
      return {
        ...shape,
        x1: shape.x1! + dx,
        y1: shape.y1! + dy,
        x2: shape.x2! + dx,
        y2: shape.y2! + dy,
        x3: shape.x3! + dx,
        y3: shape.y3! + dy,
      };
    } else if (shape.type === "arrow") {
      return {
        ...shape,
        x1: shape.x1! + dx,
        y1: shape.y1! + dy,
        x2: shape.x2! + dx,
        y2: shape.y2! + dy,
      };
    } else if (shape.type === "text") {
      return { ...shape, x: shape.x! + dx, y: shape.y! + dy };
    } else if (shape.type === "image") {
      return { ...shape, x: shape.x! + dx, y: shape.y! + dy };
    }
    return shape;
  };

  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    if (tool !== "erase") {
      setSelectedShape(null); // Deselect shape if tool changes
    }
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // Remove current state
      const previousShapes = newHistory[newHistory.length - 1];
      setShapes([...previousShapes]);
      setHistory(newHistory);
    } else {
      setShapes([]);
    }
  };

  const handleColorChange = (color: any) => {
    setCurrentColor(color.hex);
  };

  const saveShape = (shape: Shape) => {
    setShapes(prev => [...prev, shape]);
    setHistory(prev => [...prev, [...shapes, shape]]);
  };

  const { initializeGestureControls } = useGestureControls(
    setActiveTool,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    activeTool,
    currentColor,
    saveShape, 
    shapes
  );
  console.log(activeTool, currentColor)
 
  
  useEffect(() => {
    initializeGestureControls();
  }, [activeTool, currentColor])


  if (status === "loading") {
    return (
      <div className="p-4 space-y-4">
      {/* Skeleton Toolbar */}
      <div className="flex items-center space-x-4">
        {/* Tool icons */}
        {Array(8)
          .fill(null)
          .map((_, index) => (
            <Skeleton
              key={index}
              className="w-[40px] h-[40px] rounded-full"
            />
          ))}
        {/* Line width select */}
        <Skeleton className="w-[120px] h-[40px] rounded" />
        {/* Profile dropdown */}
        <div className="ml-auto">
          <Skeleton className="w-[48px] h-[48px] rounded-full" />
        </div>
      </div>

      {/* Skeleton Canvas Area */}
      <Skeleton className="w-full h-[400px] rounded-lg" />

      {/* Skeleton Hint Text */}
      <Skeleton className="w-1/2 h-[20px] rounded-full" />
    </div>
    );
  }

  if (!session) {
    router.push('/signin')
    return <p>Please sign in to view this page.</p>;
  }


  return (
  
    <Container>
      
      <Toolbar>
        <IconButton active={activeTool === "pointer"} onClick={() => handleToolChange("pointer")}>
          <FiMove />
        </IconButton>
        <IconButton active={activeTool === "pencil"} onClick={() => handleToolChange("pencil")}>
          <TbPencil />
        </IconButton>
        {activeTool === "pencil" && (
          <select
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="bg-gray-700 text-white p-2 rounded"
          >
            <option value="1">Thin</option>
            <option value="2">Normal</option>
            <option value="4">Thick</option>
            <option value="6">Very Thick</option>
          </select>
        )}
        <IconButton active={activeTool === "rectangle"} onClick={() => handleToolChange("rectangle")}>
          <FiSquare />
        </IconButton>
        <IconButton active={activeTool === "circle"} onClick={() => handleToolChange("circle")}>
          <FiCircle />
        </IconButton>
        <IconButton active={activeTool === "triangle"} onClick={() => handleToolChange("triangle")}>
          <FiTriangle />
        </IconButton>
        <IconButton active={activeTool === "arrow"} onClick={() => handleToolChange("arrow")}>
          <FiArrowRight />
        </IconButton>
        <IconButton active={activeTool === "text"} onClick={() => handleToolChange("text")}>
          <TbTextResize />
        </IconButton>
        <IconButton active={activeTool === "erase"} onClick={() => handleToolChange("erase")}>
          <TbEraser />
        </IconButton>
        <IconButton active={showColorPicker} onClick={() => setShowColorPicker(!showColorPicker)}>
          <TbPalette style={{ color: currentColor }} />
        </IconButton>
        {showColorPicker && (
          <div className="absolute z-10 top-16">
            <div className="fixed inset-0" onClick={() => setShowColorPicker(false)} />
            <div className="relative">
              <ChromePicker color={currentColor} onChange={handleColorChange} disableAlpha={true} />
            </div>
          </div>
        )}
        <IconButton onClick={handleUndo}>Undo</IconButton>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2 p-2 bg-gray-700 rounded-full hover:bg-gray-600"
          >
            <CgProfile />
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-md z-10">
              <div className="p-4 text-gray-700">
                <img
                  src={session?.user?.image || "/default-avatar.png"}
                  alt="Profile"
                  className="w-12 h-12 rounded-full mx-auto"
                />
                <p className="text-center font-medium mt-2">{session?.user?.name}</p>
                <p className="text-center text-sm text-gray-500 truncate">{session?.user?.email}</p>
              </div>
              <div className="border-t border-gray-200">
                <button
                 onClick={() => signOut({ callbackUrl: "/signin" })} 
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </Toolbar>

      <CanvasArea>
        <Canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} />
        <HintText>Press 'Undo' to revert the last action.</HintText>
      </CanvasArea>
    </Container>
  );
};

export default App;