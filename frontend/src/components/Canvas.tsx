import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import type { DrawEvent, Shape, TextElement } from '../types/drawing.types';
import { screenToCanvas, applyTransform, resetTransform } from '../utils/canvasTransform';

interface CanvasProps {
  currentColor: string;
  brushSize: number;
  tool: 'pen' | 'eraser' | 'circle' | 'rectangle' | 'line' | 'arrow' | 'text';
  filled?: boolean;
  zoom: number;
  panX: number;
  panY: number;
  onDraw: (drawEvent: DrawEvent) => void;
  onStrokeStart: () => void;
  onStrokeEnd: () => void;
  onDrawShape?: (shape: Omit<Shape, 'id' | 'timestamp'>) => void;
  onTextClick?: (x: number, y: number) => void;
  onDrawingHistory: (history: DrawEvent[]) => void;
}

const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(({
  currentColor,
  brushSize,
  tool,
  filled = false,
  zoom,
  panX,
  panY,
  onDraw,
  onStrokeStart,
  onStrokeEnd,
  onDrawShape,
  onTextClick,
  // onDrawingHistory,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const [tempCanvas, setTempCanvas] = useState<HTMLCanvasElement | null>(null);
  const [, setTempCanvas] = useState<HTMLCanvasElement | null>(null);

  useImperativeHandle(ref, () => canvasRef.current!);

  // Canvas initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set large canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 80;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setContext(ctx);

    const temp = document.createElement('canvas');
    temp.width = canvas.width;
    temp.height = canvas.height;
    setTempCanvas(temp);

    const handleResize = () => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 80;
      ctx.putImageData(imageData, 0, 0);
      
      if (temp) {
        temp.width = canvas.width;
        temp.height = canvas.height;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Apply transform whenever zoom/pan changes
  useEffect(() => {
    if (!context || !canvasRef.current) return;

    redrawCanvas();
  }, [zoom, panX, panY]);

  // Redraw entire canvas with transform (NO GRID now)
  const redrawCanvas = () => {
    if (!context || !canvasRef.current) return;

    const canvas = canvasRef.current;

    // Clear with identity transform
    resetTransform(context);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Apply transform for drawing content
    applyTransform(context, panX, panY, zoom);

    // Redraw all saved content
    if ((canvas as any).savedStrokes) {
      (canvas as any).savedStrokes.forEach((event: DrawEvent) => {
        draw(event.x, event.y, event.prevX, event.prevY, event.color, event.brushSize, event.tool);
      });
    }

    if ((canvas as any).savedShapes) {
      (canvas as any).savedShapes.forEach((shape: Shape) => {
        drawShape(context, shape.type, shape.startX, shape.startY, shape.endX, shape.endY, shape.color, shape.strokeWidth, shape.filled);
      });
    }

    if ((canvas as any).savedTexts) {
      (canvas as any).savedTexts.forEach((text: TextElement) => {
        drawText(context, text.text, text.x, text.y, text.fontSize, text.fontFamily, text.color);
      });
    }
  };

  // Draw function (pen/eraser)
  const draw = (
    x: number,
    y: number,
    prevX: number,
    prevY: number,
    color: string,
    size: number,
    drawTool: 'pen' | 'eraser'
  ) => {
    if (!context) return;

    context.beginPath();
    context.moveTo(prevX, prevY);
    context.lineTo(x, y);
    context.strokeStyle = drawTool === 'eraser' ? '#ffffff' : color;
    context.lineWidth = size;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke();
  };

  // Draw shape on canvas
  const drawShape = (
    ctx: CanvasRenderingContext2D,
    type: 'circle' | 'rectangle' | 'line' | 'arrow',
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: string,
    strokeWidth: number,
    isFilled: boolean
  ) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const width = endX - startX;
    const height = endY - startY;
    const radius = Math.sqrt(width * width + height * height) / 2;
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;

    ctx.beginPath();

    switch (type) {
      case 'circle':
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        break;

      case 'rectangle':
        ctx.rect(startX, startY, width, height);
        break;

      case 'line':
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        break;

      case 'arrow':
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;
        
        ctx.lineTo(
          endX - arrowLength * Math.cos(angle - arrowAngle),
          endY - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - arrowLength * Math.cos(angle + arrowAngle),
          endY - arrowLength * Math.sin(angle + arrowAngle)
        );
        break;
    }

    if (isFilled && type !== 'line' && type !== 'arrow') {
      ctx.fill();
    }
    ctx.stroke();
  };

  // Draw text on canvas
  const drawText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    fontSize: number,
    fontFamily: string,
    color: string
  ) => {
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  };

  // Mouse down with coordinate transformation
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !context) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const { x, y } = screenToCanvas(screenX, screenY, panX, panY, zoom);

    if (tool === 'text') {
      onTextClick?.(x, y);
      return;
    }

    if (['circle', 'rectangle', 'line', 'arrow'].includes(tool)) {
      setIsDrawing(true);
      setShapeStart({ x, y });
      return;
    }

    setIsDrawing(true);
    setLastPos({ x, y });
    onStrokeStart();
  };

  // Mouse move with coordinate transformation
  const drawMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !context || !canvasRef.current) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const { x, y } = screenToCanvas(screenX, screenY, panX, panY, zoom);

    if (shapeStart && ['circle', 'rectangle', 'line', 'arrow'].includes(tool)) {
      redrawCanvas();
      drawShape(
        context,
        tool as 'circle' | 'rectangle' | 'line' | 'arrow',
        shapeStart.x,
        shapeStart.y,
        x,
        y,
        currentColor,
        brushSize,
        filled
      );
      return;
    }

    draw(x, y, lastPos.x, lastPos.y, currentColor, brushSize, tool as 'pen' | 'eraser');

    onDraw({
      x, y, prevX: lastPos.x, prevY: lastPos.y,
      color: currentColor, brushSize, tool: tool as 'pen' | 'eraser',
    });

    const canvas = canvasRef.current as any;
    if (!canvas.savedStrokes) canvas.savedStrokes = [];
    canvas.savedStrokes.push({
      x, y, prevX: lastPos.x, prevY: lastPos.y,
      color: currentColor, brushSize, tool
    });

    setLastPos({ x, y });
  };

  // Mouse up with coordinate transformation
  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !context || !canvasRef.current) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const { x, y } = screenToCanvas(screenX, screenY, panX, panY, zoom);

    if (shapeStart && ['circle', 'rectangle', 'line', 'arrow'].includes(tool)) {
      drawShape(
        context,
        tool as 'circle' | 'rectangle' | 'line' | 'arrow',
        shapeStart.x,
        shapeStart.y,
        x,
        y,
        currentColor,
        brushSize,
        filled
      );

      onDrawShape?.({
        type: tool as 'circle' | 'rectangle' | 'line' | 'arrow',
        startX: shapeStart.x,
        startY: shapeStart.y,
        endX: x,
        endY: y,
        color: currentColor,
        strokeWidth: brushSize,
        filled: filled,
      });

      const canvas = canvasRef.current as any;
      if (!canvas.savedShapes) canvas.savedShapes = [];
      canvas.savedShapes.push({
        type: tool, startX: shapeStart.x, startY: shapeStart.y,
        endX: x, endY: y, color: currentColor,
        strokeWidth: brushSize, filled
      });

      setShapeStart(null);
    } else {
      onStrokeEnd();
    }

    setIsDrawing(false);
  };

  // Touch events (same logic, no grid)
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const touch = e.touches[0];
    const screenX = touch.clientX - rect.left;
    const screenY = touch.clientY - rect.top;
    const { x, y } = screenToCanvas(screenX, screenY, panX, panY, zoom);

    if (tool === 'text') {
      onTextClick?.(x, y);
      return;
    }

    if (['circle', 'rectangle', 'line', 'arrow'].includes(tool)) {
      setIsDrawing(true);
      setShapeStart({ x, y });
      return;
    }

    setIsDrawing(true);
    setLastPos({ x, y });
    onStrokeStart();
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !context || !canvasRef.current) return;

    const touch = e.touches[0];
    const screenX = touch.clientX - rect.left;
    const screenY = touch.clientY - rect.top;
    const { x, y } = screenToCanvas(screenX, screenY, panX, panY, zoom);

    if (shapeStart && ['circle', 'rectangle', 'line', 'arrow'].includes(tool)) {
      redrawCanvas();
      drawShape(
        context,
        tool as 'circle' | 'rectangle' | 'line' | 'arrow',
        shapeStart.x,
        shapeStart.y,
        x,
        y,
        currentColor,
        brushSize,
        filled
      );
      return;
    }

    draw(x, y, lastPos.x, lastPos.y, currentColor, brushSize, tool as 'pen' | 'eraser');

    onDraw({
      x, y, prevX: lastPos.x, prevY: lastPos.y,
      color: currentColor, brushSize, tool: tool as 'pen' | 'eraser',
    });

    const canvas = canvasRef.current as any;
    if (!canvas.savedStrokes) canvas.savedStrokes = [];
    canvas.savedStrokes.push({
      x, y, prevX: lastPos.x, prevY: lastPos.y,
      color: currentColor, brushSize, tool
    });

    setLastPos({ x, y });
  };

  const stopDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !context || !canvasRef.current) return;

    const touch = e.changedTouches[0];
    const screenX = touch.clientX - rect.left;
    const screenY = touch.clientY - rect.top;
    const { x, y } = screenToCanvas(screenX, screenY, panX, panY, zoom);

    if (shapeStart && ['circle', 'rectangle', 'line', 'arrow'].includes(tool)) {
      drawShape(
        context,
        tool as 'circle' | 'rectangle' | 'line' | 'arrow',
        shapeStart.x,
        shapeStart.y,
        x,
        y,
        currentColor,
        brushSize,
        filled
      );

      onDrawShape?.({
        type: tool as 'circle' | 'rectangle' | 'line' | 'arrow',
        startX: shapeStart.x,
        startY: shapeStart.y,
        endX: x,
        endY: y,
        color: currentColor,
        strokeWidth: brushSize,
        filled: filled,
      });

      const canvas = canvasRef.current as any;
      if (!canvas.savedShapes) canvas.savedShapes = [];
      canvas.savedShapes.push({
        type: tool, startX: shapeStart.x, startY: shapeStart.y,
        endX: x, endY: y, color: currentColor,
        strokeWidth: brushSize, filled
      });

      setShapeStart(null);
    } else {
      onStrokeEnd();
    }

    setIsDrawing(false);
  };

  // Expose methods to parent (same as before)
  useEffect(() => {
    if (canvasRef.current && context) {
      (canvasRef.current as any).drawFromSocket = (drawEvent: DrawEvent) => {
        draw(
          drawEvent.x,
          drawEvent.y,
          drawEvent.prevX,
          drawEvent.prevY,
          drawEvent.color,
          drawEvent.brushSize,
          drawEvent.tool
        );

        const canvas = canvasRef.current as any;
        if (!canvas.savedStrokes) canvas.savedStrokes = [];
        canvas.savedStrokes.push(drawEvent);
      };

      (canvasRef.current as any).drawShapeFromSocket = (shape: Shape) => {
        drawShape(
          context,
          shape.type,
          shape.startX,
          shape.startY,
          shape.endX,
          shape.endY,
          shape.color,
          shape.strokeWidth,
          shape.filled
        );

        const canvas = canvasRef.current as any;
        if (!canvas.savedShapes) canvas.savedShapes = [];
        canvas.savedShapes.push(shape);
      };

      (canvasRef.current as any).drawTextFromSocket = (textElement: TextElement) => {
        drawText(
          context,
          textElement.text,
          textElement.x,
          textElement.y,
          textElement.fontSize,
          textElement.fontFamily,
          textElement.color
        );

        const canvas = canvasRef.current as any;
        if (!canvas.savedTexts) canvas.savedTexts = [];
        canvas.savedTexts.push(textElement);
      };

      (canvasRef.current as any).clearCanvas = () => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current as any;
        canvas.savedStrokes = [];
        canvas.savedShapes = [];
        canvas.savedTexts = [];

        redrawCanvas();
      };

      (canvasRef.current as any).replayHistory = (history: DrawEvent[]) => {
        const canvas = canvasRef.current as any;
        canvas.savedStrokes = history;
        redrawCanvas();
      };

      (canvasRef.current as any).replayShapes = (shapes: Shape[]) => {
        const canvas = canvasRef.current as any;
        canvas.savedShapes = shapes;
        redrawCanvas();
      };

      (canvasRef.current as any).replayTexts = (texts: TextElement[]) => {
        const canvas = canvasRef.current as any;
        canvas.savedTexts = texts;
        redrawCanvas();
      };

      (canvasRef.current as any).downloadCanvas = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = `drawing-${Date.now()}.png`;
        link.href = canvasRef.current.toDataURL();
        link.click();
      };

      (canvasRef.current as any).forceRedraw = () => {
        redrawCanvas();
      };
    }
  }, [context, zoom, panX, panY]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={drawMouse}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawingTouch}
      onTouchMove={drawTouch}
      onTouchEnd={stopDrawingTouch}
      className="cursor-crosshair"
      style={{
        cursor: tool === 'text' ? 'text' : 'crosshair',
      }}
    />
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;