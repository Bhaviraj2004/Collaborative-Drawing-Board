// Screen coordinates → Canvas coordinates
export function screenToCanvas(
  screenX: number,
  screenY: number,
  panX: number,
  panY: number,
  zoom: number
): { x: number; y: number } {
  return {
    x: (screenX - panX) / zoom,
    y: (screenY - panY) / zoom,
  };
}

// Canvas coordinates → Screen coordinates
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  panX: number,
  panY: number,
  zoom: number
): { x: number; y: number } {
  return {
    x: canvasX * zoom + panX,
    y: canvasY * zoom + panY,
  };
}

// Apply transform to canvas context
export function applyTransform(
  ctx: CanvasRenderingContext2D,
  panX: number,
  panY: number,
  zoom: number
): void {
  ctx.setTransform(zoom, 0, 0, zoom, panX, panY);
}

// Reset transform
export function resetTransform(ctx: CanvasRenderingContext2D): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// Clamp zoom between min and max
export function clampZoom(zoom: number, min = 0.1, max = 5): number {
  return Math.max(min, Math.min(max, zoom));
}

// Get viewport bounds in canvas space
export function getViewportBounds(
  canvasWidth: number,
  canvasHeight: number,
  panX: number,
  panY: number,
  zoom: number
): { minX: number; minY: number; maxX: number; maxY: number } {
  const topLeft = screenToCanvas(0, 0, panX, panY, zoom);
  const bottomRight = screenToCanvas(canvasWidth, canvasHeight, panX, panY, zoom);
  
  return {
    minX: topLeft.x,
    minY: topLeft.y,
    maxX: bottomRight.x,
    maxY: bottomRight.y,
  };
}