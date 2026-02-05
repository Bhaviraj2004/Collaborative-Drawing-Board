export interface DrawEvent {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  brushSize: number;
  tool: 'pen' | 'eraser';
  timestamp?: number;
}

export interface DrawEventWithRoom extends DrawEvent {
  roomId: string;
}

// ✅ NEW: Stroke = collection of draw events
export interface Stroke {
  id: string;
  events: DrawEvent[];
  timestamp: number;
}

export interface DrawAction {
  type: 'draw' | 'clear' | 'shape' | 'text';
  data: any;
  timestamp: number;
}

export interface User {
  id: string;
  username: string;
  joinedAt: number;
}

export interface Room {
  roomId: string;
  name: string;
  createdAt: number;
  createdBy: string;
  maxUsers: number;
  userCount?: number;
}

// export interface CanvasState {
//   isDrawing: boolean;
//   currentColor: string;
//   brushSize: number;
//   tool: 'pen' | 'eraser';
// }

export interface Cursor {
  userId: string;
  username: string;
  x: number;
  y: number;
  color: string;
}

export interface CursorMap {
  [userId: string]: Cursor;
}

// Add these interfaces

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  userId: string;
  username: string;
}

export interface TextToolState {
  isActive: boolean;
  isEditing: boolean;
  currentText: TextElement | null;
  isDragging: boolean;
  dragOffset: { x: number; y: number };
}


// ... existing interfaces ...

// ✅ NEW: Shapes
export interface Shape {
  id: string;
  type: 'circle' | 'rectangle' | 'line' | 'arrow';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  strokeWidth: number;
  filled: boolean;
  timestamp: number;
}

export interface ShapeWithRoom extends Shape {
  roomId: string;
}

// ✅ NEW: Text
export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  timestamp: number;
}

export interface TextWithRoom extends TextElement {
  roomId: string;
}

// ✅ UPDATE: CanvasState with new tools
export interface CanvasState {
  isDrawing: boolean;
  currentColor: string;
  brushSize: number;
  tool: 'pen' | 'eraser' | 'circle' | 'rectangle' | 'line' | 'arrow' | 'text';
  filled?: boolean;
}

export interface Transform {
  zoom: number;
  panX: number;
  panY: number;
}

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}