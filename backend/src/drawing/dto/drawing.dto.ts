export class CreateRoomDto {
  roomName: string;
  username: string;
  maxUsers?: number;
}

export class JoinRoomDto {
  roomId: string;
  username: string;
}

export class DrawEventDto {
  roomId: string;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  brushSize: number;
  tool: 'pen' | 'eraser';
}

export class ClearCanvasDto {
  roomId: string;
}

export class UndoDto {
  roomId: string;
}

export class RedoDto {
  roomId: string;
}

// ✅ NEW: Stroke DTOs
export class StartStrokeDto {
  roomId: string;
  strokeId: string;
}

export class EndStrokeDto {
  roomId: string;
  strokeId: string;
}

export class CursorMoveDto {
  roomId: string;
  x: number;
  y: number;
}

export class DrawShapeDto {
  roomId: string;
  type: 'circle' | 'rectangle' | 'line' | 'arrow';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  strokeWidth: number;
  filled: boolean;
}

// ✅ NEW: Text DTO
export class AddTextDto {
  roomId: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
}
