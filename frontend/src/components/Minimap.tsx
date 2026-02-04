import { useRef, useEffect } from 'react';

interface MinimapProps {
  canvasWidth: number;
  canvasHeight: number;
  viewportX: number;
  viewportY: number;
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  onNavigate: (x: number, y: number) => void;
}

export default function Minimap({
  canvasWidth,
  canvasHeight,
  viewportX,
  viewportY,
  viewportWidth,
  viewportHeight,
  zoom,
  // onNavigate,
}: MinimapProps) {
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const MINIMAP_WIDTH = 200;
  const MINIMAP_HEIGHT = 150;

  useEffect(() => {
    const canvas = minimapRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear minimap
    ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Draw background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Draw border
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Calculate scale (minimap to canvas)
    const scaleX = MINIMAP_WIDTH / canvasWidth;
    const scaleY = MINIMAP_HEIGHT / canvasHeight;
    const scale = Math.min(scaleX, scaleY);

    // Calculate viewport rectangle on minimap
    const minimapViewportX = viewportX * scale;
    const minimapViewportY = viewportY * scale;
    const minimapViewportWidth = viewportWidth * scale;
    const minimapViewportHeight = viewportHeight * scale;

    // Draw viewport rectangle
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; // Blue transparent
    ctx.fillRect(
      minimapViewportX,
      minimapViewportY,
      minimapViewportWidth,
      minimapViewportHeight
    );

    // Draw viewport border
    ctx.strokeStyle = '#3B82F6'; // Blue
    ctx.lineWidth = 2;
    ctx.strokeRect(
      minimapViewportX,
      minimapViewportY,
      minimapViewportWidth,
      minimapViewportHeight
    );

    // Draw zoom indicator
    ctx.fillStyle = '#c01616';
    ctx.font = '12px Arial';
    ctx.fillText(`${Math.round(zoom * 100)}%`, 5, 15);
  }, [canvasWidth, canvasHeight, viewportX, viewportY, viewportWidth, viewportHeight, zoom]);

  return (
   <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 z-40">
    </div>
  );
}