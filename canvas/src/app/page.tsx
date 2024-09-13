"use client";
import React, { useState, useRef, useEffect, MouseEvent } from "react";
import {
  FiLock,
  FiMove,
  FiMousePointer,
  FiSquare,
  FiCircle,
  FiTriangle,
  FiArrowRight,
  FiEdit3,
  FiImage,
  FiCpu,
} from "react-icons/fi";
import { TbTextResize, TbPalette, TbEraser } from "react-icons/tb";
import { ChromePicker } from "react-color";

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
    className={`bg-gray-700 hover:bg-gray-600 p-2 rounded ${
      active ? "bg-gray-600" : ""
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

const App = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [currentColor, setCurrentColor] = useState("#ffffff");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [history, setHistory] = useState<Shape[][]>([]); // History for undo functionality
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

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

  const redrawCanvas = () => {
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      shapes.forEach((shape) => {
        if (!shape.locked) {
          drawShape(ctx, shape);
        }
      });
    }
  };

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.strokeStyle = shape.color || currentColor;
    ctx.lineWidth = 2;
    ctx.fillStyle = `${shape.color || currentColor}33`;

    switch (shape.type) {
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
      case "image":
        if (shape.img) {
          ctx.drawImage(shape.img, shape.x!, shape.y!);
        }
        break;
      case "cpu":
        // Mocked CPU tool functionality
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

    if (activeTool === "pointer") {
      const clickedShape = shapes.find((shape) =>
        isPointInShape(shape, offsetX, offsetY)
      );
      setSelectedShape(clickedShape || null);
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = e.nativeEvent;

    if (activeTool === "move" && selectedShape) {
      const dx = offsetX - startPos.x;
      const dy = offsetY - startPos.y;
      setShapes(
        shapes.map((shape) =>
          shape === selectedShape ? moveShape(shape, dx, dy) : shape
        )
      );
      setStartPos({ x: offsetX, y: offsetY });
    }
  };

  const handleMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    const { offsetX, offsetY } = e.nativeEvent;

    if (activeTool === "erase") {
      setShapes(shapes.filter(shape => !isPointInShape(shape, offsetX, offsetY)));
      return;
    }

    let newShape: Shape | null = null;

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
      setShapes([...shapes, newShape]);
    }

    redrawCanvas();
  };

  const isPointInShape = (shape: Shape, x: number, y: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return false;

    switch (shape.type) {
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
      case "image":
        return (
          x >= shape.x! &&
          x <= shape.x! + (shape.img?.width || 0) &&
          y >= shape.y! &&
          y <= shape.y! + (shape.img?.height || 0)
        );
      default:
        return false;
    }
  };

  const moveShape = (shape: Shape, dx: number, dy: number): Shape => {
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
    const newHistory = [...history];
    const previousShapes = newHistory.pop();
    if (previousShapes) {
      setShapes(previousShapes);
      setHistory(newHistory);
      redrawCanvas();
    }
  };

  const handleColorChange = (color: string) => {
    setCurrentColor(color);
    setShowColorPicker(false);
  };

  return (
    <Container>
      <Toolbar>
        <IconButton active={activeTool === "pointer"} onClick={() => handleToolChange("pointer")}>
          <FiMove />
        </IconButton>
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
          <FiEdit3 />
        </IconButton>
        <IconButton active={activeTool === "image"} onClick={() => handleToolChange("image")}>
          <FiImage />
        </IconButton>
        <IconButton active={activeTool === "cpu"} onClick={() => handleToolChange("cpu")}>
          <FiCpu />
        </IconButton>
        <IconButton active={activeTool === "erase"} onClick={() => handleToolChange("erase")}>
          <TbEraser />
        </IconButton>
        <IconButton active={showColorPicker} onClick={() => setShowColorPicker(!showColorPicker)}>
          <TbPalette />
        </IconButton>
        {showColorPicker && (
          <div className="absolute top-14 left-2">
            <ChromePicker color={currentColor} onChangeComplete={(color) => handleColorChange(color.hex)} />
          </div>
        )}
        <IconButton onClick={handleUndo}>
          Undo
        </IconButton>
      </Toolbar>
      <CanvasArea>
        <Canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} />
        <HintText>Press 'Undo' to revert the last action.</HintText>
      </CanvasArea>
    </Container>
  );
};

export default App;
